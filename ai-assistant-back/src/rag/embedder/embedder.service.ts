import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

/**
 * EmbedderService — generates vector embeddings for text.
 *
 * Strategy:
 *   1. Tries Ollama's embedding API (nomic-embed-text or mxbai-embed-large)
 *   2. Falls back to a simple TF-IDF-based local pseudo-embedding for dev
 *
 * Production: pull embed model with `ollama pull nomic-embed-text`
 */
@Injectable()
export class EmbedderService implements OnModuleInit {
    private readonly logger = new Logger(EmbedderService.name);
    private readonly ollamaBase: string;
    private readonly embedModel = 'nomic-embed-text';
    private useLocalFallback = false;

    constructor(private readonly config: ConfigService) {
        this.ollamaBase = this.config.get<string>('app.ollama.baseUrl', 'http://localhost:11434');
    }

    async onModuleInit() {
        await this.checkOllamaEmbed();
    }

    private async checkOllamaEmbed(): Promise<void> {
        try {
            await axios.post(
                `${this.ollamaBase}/api/embeddings`,
                { model: this.embedModel, prompt: 'test' },
                { timeout: 5000 },
            );
            this.logger.log(`✅ Ollama embedding ready (model: ${this.embedModel})`);
        } catch {
            this.logger.warn(
                `⚠️  Ollama embed not available → using local hash fallback. ` +
                `Run: ollama pull ${this.embedModel}`,
            );
            this.useLocalFallback = true;
        }
    }

    /**
     * Generate embedding for a single text.
     * Returns a float32 array of dimension 768 (nomic-embed-text) or 384 (fallback).
     */
    async embed(text: string): Promise<number[]> {
        if (this.useLocalFallback) {
            return this.localHashEmbed(text);
        }

        try {
            const response = await axios.post<{ embedding: number[] }>(
                `${this.ollamaBase}/api/embeddings`,
                { model: this.embedModel, prompt: text },
                { timeout: 30000 },
            );
            return response.data.embedding;
        } catch (err) {
            this.logger.error(`Embedding failed, using fallback: ${err.message}`);
            return this.localHashEmbed(text);
        }
    }

    /**
     * Batch embed — more efficient for bulk ingestion.
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        // Ollama doesn't natively support batch embeddings — parallelise with concurrency control
        const CONCURRENCY = 4;
        const results: number[][] = [];

        for (let i = 0; i < texts.length; i += CONCURRENCY) {
            const batch = texts.slice(i, i + CONCURRENCY);
            const embeddings = await Promise.all(batch.map((t) => this.embed(t)));
            results.push(...embeddings);
            this.logger.debug(`Embedded batch ${i}–${i + batch.length} / ${texts.length}`);
        }

        return results;
    }

    /**
     * Local hash-based pseudo-embedding (dim=384, dev only).
     * Deterministic — same text always produces same vector.
     */
    private localHashEmbed(text: string): number[] {
        const DIM = 384;
        const vec = new Array(DIM).fill(0);
        const words = text.toLowerCase().split(/\s+/);

        for (const word of words) {
            for (let i = 0; i < word.length; i++) {
                const idx = (word.charCodeAt(i) * (i + 1) * 31) % DIM;
                vec[idx] += 1 / (words.length || 1);
            }
        }

        // L2 normalise
        const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
        return vec.map((v) => v / norm);
    }

    getDimension(): number {
        return this.useLocalFallback ? 384 : 768;
    }
}
