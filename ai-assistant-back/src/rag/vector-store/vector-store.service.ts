import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { TextChunk } from '../chunker/chunker.service';
import { EmbeddingsService } from '../../modules/ai/embeddings.service';

export interface RetrievedChunk {
    chunkId: string;
    text: string;
    documentName: string;
    pageNumber?: number;
    score: number; // cosine distance (lower = more similar) → converted to similarity
    similarity: number; // 0–1 (higher = better match)
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
    private readonly logger = new Logger(VectorStoreService.name);
    private client: ChromaClient;
    private collection: Collection;
    private readonly collectionName: string;
    private readonly similarityThreshold: number;

    constructor(
        private readonly config: ConfigService,
        private readonly embedder: EmbeddingsService,
    ) {
        const host = this.config.get<string>('app.chroma.host', 'localhost');
        const port = this.config.get<number>('app.chroma.port', 8000);
        this.collectionName = this.config.get<string>(
            'app.chroma.collection',
            'unihelp_docs',
        );
        this.similarityThreshold = this.config.get<number>(
            'app.rag.similarityThreshold',
            0.35,
        );

        this.client = new ChromaClient({ path: `http://${host}:${port}` });
    }

    async onModuleInit() {
        await this.initCollection();
    }

    private async initCollection() {
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: {
                    description: 'UniHelp official documents vector store',
                    'hnsw:space': 'cosine',
                },
            });
            const count = await this.collection.count();
            this.logger.log(
                `✅ ChromaDB collection "${this.collectionName}" ready (${count} chunks)`,
            );
        } catch (err) {
            this.logger.error(
                `❌ ChromaDB connection failed: ${err.message}. Is ChromaDB running?`,
            );
            // Don't throw — allow app to start without Chroma for health check
        }
    }

    /**
     * Store chunks with their embeddings into ChromaDB.
     */
    async addChunks(chunks: TextChunk[]): Promise<void> {
        if (!this.collection) throw new Error('ChromaDB not connected');

        const texts = chunks.map((c) => c.text);
        const embeddings = await this.embedder.embedBatch(texts);

        const ids = chunks.map((c) => c.chunkId);
        const metadatas = chunks.map((c) => ({
            documentName: c.documentName,
            pageNumber: c.pageNumber ?? -1,
            chunkIndex: c.chunkIndex,
            wordCount: c.wordCount,
        }));

        // ChromaDB limit: add in batches of 500
        const BATCH = 500;
        for (let i = 0; i < chunks.length; i += BATCH) {
            await this.collection.add({
                ids: ids.slice(i, i + BATCH),
                embeddings: embeddings.slice(i, i + BATCH),
                documents: texts.slice(i, i + BATCH),
                metadatas: metadatas.slice(i, i + BATCH),
            });
        }

        this.logger.log(
            `Added ${chunks.length} chunks from "${chunks[0]?.documentName}"`,
        );
    }

    /**
     * Similarity search — returns topK most relevant chunks.
     */
    async retrieve(query: string, topK: number = 5): Promise<RetrievedChunk[]> {
        if (!this.collection) return [];

        const queryEmbedding = await this.embedder.embedText(query);

        const results = await this.collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: Math.min(topK * 2, 20), // fetch more, then filter
            include: [IncludeEnum.documents, IncludeEnum.metadatas, IncludeEnum.distances],
        });

        const ids = results.ids[0] || [];
        const documents = results.documents[0] || [];
        const metadatas = results.metadatas[0] || [];
        const distances = results.distances?.[0] || [];

        const retrieved: RetrievedChunk[] = ids
            .map((id, i) => {
                const distance = distances[i] ?? 1;
                const similarity = 1 - distance; // cosine: distance [0,2] → similarity [-1,1] but Chroma normalises to [0,1]
                const meta = metadatas[i] as any;

                return {
                    chunkId: id,
                    text: documents[i] || '',
                    documentName: meta?.documentName || 'Unknown',
                    pageNumber: meta?.pageNumber !== -1 ? meta?.pageNumber : undefined,
                    score: distance,
                    similarity,
                };
            })
            .filter((r) => r.similarity >= this.similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);

        return retrieved;
    }

    /**
     * Delete all chunks for a given document.
     */
    async deleteDocument(documentName: string): Promise<void> {
        if (!this.collection) return;

        const results = await this.collection.get({
            where: { documentName },
        });

        if (results.ids.length > 0) {
            await this.collection.delete({ ids: results.ids });
            this.logger.log(
                `Deleted ${results.ids.length} chunks for "${documentName}"`,
            );
        }
    }

    /**
     * List all distinct documents in the collection.
     */
    async listDocuments(): Promise<{ name: string; chunkCount: number }[]> {
        if (!this.collection) return [];

        const all = await this.collection.get({
            include: [IncludeEnum.metadatas],
        });

        const map = new Map<string, number>();
        for (const meta of all.metadatas) {
            const name = (meta as any)?.documentName || 'Unknown';
            map.set(name, (map.get(name) || 0) + 1);
        }

        return Array.from(map.entries()).map(([name, chunkCount]) => ({
            name,
            chunkCount,
        }));
    }

    async getTotalChunkCount(): Promise<number> {
        if (!this.collection) return 0;
        return this.collection.count();
    }

    isConnected(): boolean {
        return !!this.collection;
    }
}
