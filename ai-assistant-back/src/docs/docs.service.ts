import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { VectorStoreService } from '../rag/vector-store/vector-store.service';
import { ChunkerService } from '../rag/chunker/chunker.service';
import { DocumentEntity, IngestionStatus } from './entities/document.entity';

// pdf-parse uses require (CommonJS)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface IngestResult {
    documentName: string;
    chunksCreated: number;
    pageCount: number;
    durationMs: number;
    status: 'success' | 'error';
    error?: string;
}

@Injectable()
export class DocsService implements OnModuleInit {
    private readonly logger = new Logger(DocsService.name);
    private readonly uploadDir: string;

    constructor(
        private readonly config: ConfigService,
        private readonly vectorStore: VectorStoreService,
        private readonly chunker: ChunkerService,
        @InjectRepository(DocumentEntity)
        private readonly docRepo: Repository<DocumentEntity>,
    ) {
        this.uploadDir = this.config.get<string>('app.upload.dir', './uploads');
    }

    async onModuleInit() {
        await this.ensureUploadDir();
    }

    private async ensureUploadDir() {
        await fs.mkdir(this.uploadDir, { recursive: true });
    }

    /**
     * Ingest a single uploaded file: extract text → chunk → embed → store.
     */
    async ingestFile(file: Express.Multer.File, requestId?: string): Promise<IngestResult> {
        const start = Date.now();
        const documentName = file.originalname;

        this.logger.log(`[${requestId}] Ingestion document: "${documentName}"`);

        // 1. Initialiser l'entrée en base (PENDING)
        let docEntity = await this.docRepo.findOne({ where: { filename: documentName } });
        if (!docEntity) {
            docEntity = this.docRepo.create({
                filename: documentName,
                originalName: documentName,
                mimeType: file.mimetype,
                size: file.size,
                status: IngestionStatus.PENDING,
            });
        }
        docEntity.status = IngestionStatus.PROCESSING;
        docEntity.error = undefined;
        await this.docRepo.save(docEntity);

        try {
            // 2. Extraire le texte
            const { text, pageCount, pageBreaks } = await this.extractText(file);

            if (!text || text.trim().length < 20) {
                throw new Error("Contenu textuel insuffisant.");
            }

            // 3. Re-indexation logic: supprimer l'ancien
            await this.vectorStore.deleteDocument(documentName);

            // 4. Chunking
            const chunks = this.chunker.chunkText(text, documentName, pageBreaks);
            if (chunks.length === 0) {
                throw new Error('Le chunking n\'a produit aucun segment.');
            }

            // 5. Stockage Vectoriel
            await this.vectorStore.addChunks(chunks);

            // 6. Sauvegarder fichier sur disque
            const destPath = path.join(this.uploadDir, documentName);
            await fs.writeFile(destPath, file.buffer);

            // 7. Mettre à jour en base (COMPLETED)
            docEntity.status = IngestionStatus.COMPLETED;
            docEntity.chunkCount = chunks.length;
            await this.docRepo.save(docEntity);

            const durationMs = Date.now() - start;
            return { documentName, chunksCreated: chunks.length, pageCount, durationMs, status: 'success' };
        } catch (err) {
            this.logger.error(`Erreur ingestion "${documentName}": ${err.message}`);
            docEntity.status = IngestionStatus.FAILED;
            docEntity.error = err.message;
            await this.docRepo.save(docEntity);

            return { documentName, chunksCreated: 0, pageCount: 0, durationMs: Date.now() - start, status: 'error', error: err.message };
        }
    }

    private async extractText(file: Express.Multer.File) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf') return this.extractPdf(file.buffer);
        if (['.txt', '.md'].includes(ext)) return { text: file.buffer.toString('utf-8'), pageCount: 1, pageBreaks: [] };
        throw new BadRequestException(`Format non supporté: ${ext}`);
    }

    private async extractPdf(buffer: Buffer) {
        const data = await pdfParse(buffer);
        const avgCharsPerPage = data.text.length / (data.numpages || 1);
        const pageBreaks = Array.from({ length: (data.numpages || 1) - 1 }, (_, i) => Math.floor(avgCharsPerPage * (i + 1)));
        return { text: data.text, pageCount: data.numpages || 1, pageBreaks };
    }

    async listDocuments(): Promise<DocumentEntity[]> {
        return this.docRepo.find({ order: { createdAt: 'DESC' } });
    }

    async deleteDocument(filename: string) {
        await this.vectorStore.deleteDocument(filename);
        await this.docRepo.delete({ filename });
        try {
            await fs.unlink(path.join(this.uploadDir, filename));
        } catch (e) { /* ignore if not on disk */ }
        return { deleted: true, name: filename };
    }

    async getStats() {
        const docs = await this.listDocuments();
        const totalChunks = docs.reduce((acc, d) => acc + d.chunkCount, 0);
        return {
            count: docs.length,
            totalChunks,
            documents: docs
        };
    }

    async reindexAll(requestId?: string): Promise<IngestResult[]> {
        this.logger.log(`[${requestId}] Début du ré-indexage complet…`);
        const results: IngestResult[] = [];

        try {
            const files = await fs.readdir(this.uploadDir);
            const supportedExts = ['.pdf', '.txt', '.md'];
            const docFiles = files.filter(f => supportedExts.includes(path.extname(f).toLowerCase()));

            for (const filename of docFiles) {
                const filePath = path.join(this.uploadDir, filename);
                const buffer = await fs.readFile(filePath);
                const fakeFile: Express.Multer.File = {
                    originalname: filename,
                    buffer,
                    size: buffer.length,
                    mimetype: 'application/octet-stream',
                    fieldname: 'file',
                    encoding: '7bit',
                    stream: null as any,
                    destination: this.uploadDir,
                    filename,
                    path: filePath,
                };
                results.push(await this.ingestFile(fakeFile, requestId));
            }
        } catch (err) {
            this.logger.error(`Reindex failed: ${err.message}`);
        }

        const succeeded = results.filter(r => r.status === 'success').length;
        this.logger.log(`[${requestId}] Reindex terminé: ${succeeded}/${results.length} documents`);
        return results;
    }
}
