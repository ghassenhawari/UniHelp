import {
    Controller, Post, Get, Delete,
    UploadedFiles, UseInterceptors,
    Param, Req, UseGuards,
    HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags, ApiOperation, ApiResponse,
    ApiConsumes, ApiBody, ApiSecurity,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import * as common from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocsService } from './docs.service';
import { AdminGuard } from '../common/guards/admin.guard';
import * as express from 'express';

const ALLOWED_MIMETYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@ApiTags('Documents')
@ApiSecurity('admin-secret')
@UseGuards(AdminGuard)
@Controller('docs')
export class DocsController {
    private readonly maxFileMb: number;

    constructor(
        private readonly docsService: DocsService,
        private readonly config: ConfigService,
    ) {
        this.maxFileMb = this.config.get<number>('app.upload.maxFileMb', 20);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: memoryStorage(),
            limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max per file
            fileFilter: (_req, file, cb) => {
                if (ALLOWED_MIMETYPES.includes(file.mimetype) || file.originalname.match(/\.(pdf|txt|md|doc|docx)$/i)) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException(`Format de fichier non supporté: ${file.mimetype}`), false);
                }
            },
        }),
    )
    @ApiOperation({
        summary: 'Upload et indexer des documents officiels',
        description: `
      Admin uniquement (X-Admin-Secret requis).
      
      Accepte jusqu'à 10 fichiers simultanément.
      Pipeline : **Extraction texte → Chunking → Embedding → ChromaDB**
      
      Formats supportés : PDF, TXT, MD, DOC, DOCX
    `,
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Fichiers à uploader (max 10)',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Résultats d\'indexation par fichier',
    })
    @ApiResponse({ status: 400, description: 'Fichier invalide ou format non supporté' })
    @ApiResponse({ status: 401, description: 'Admin secret manquant ou invalide' })
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: express.Request,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('Aucun fichier fourni.');
        }

        const requestId = (req as any).requestId;
        const results = await Promise.all(
            files.map((file) => this.docsService.ingestFile(file, requestId)),
        );

        const succeeded = results.filter((r) => r.status === 'success').length;
        const failed = results.filter((r) => r.status === 'error').length;

        return {
            summary: {
                total: results.length,
                succeeded,
                failed,
                totalChunksCreated: results.reduce((s, r) => s + r.chunksCreated, 0),
            },
            results,
        };
    }

    @Post('reindex')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Ré-indexer tous les documents sur disque',
        description: 'Relit tous les fichiers dans le dossier uploads et les ré-indexe dans ChromaDB.',
    })
    @ApiResponse({ status: 200, description: 'Résultats du reindex' })
    async reindexAll(@Req() req: express.Request) {
        const requestId = (req as any).requestId;
        const results = await this.docsService.reindexAll(requestId);
        const succeeded = results.filter((r) => r.status === 'success').length;

        return {
            message: `Reindex terminé: ${succeeded}/${results.length} documents`,
            results,
        };
    }

    @Get()
    @ApiOperation({ summary: 'Lister tous les documents indexés' })
    @ApiResponse({ status: 200, description: 'Liste des documents avec leur nombre de chunks' })
    async listDocuments() {
        return this.docsService.listDocuments();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Statistiques des documents indexés' })
    @ApiResponse({ status: 200, description: 'Stats: nombre de docs, chunks total, état ChromaDB' })
    async getStats() {
        return this.docsService.getStats();
    }

    @Delete(':name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Supprimer un document indexé',
        description: 'Supprime le document du vector store et du disque.',
    })
    @ApiResponse({ status: 200, description: 'Document supprimé' })
    @ApiResponse({ status: 404, description: 'Document non trouvé' })
    async deleteDocument(@Param('name') name: string) {
        return this.docsService.deleteDocument(decodeURIComponent(name));
    }
}
