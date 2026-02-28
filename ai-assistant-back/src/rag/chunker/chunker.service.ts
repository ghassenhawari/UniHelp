import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TextChunk {
    text: string;
    chunkIndex: number;
    pageNumber?: number;
    documentName: string;
    chunkId: string;
    wordCount: number;
}

@Injectable()
export class ChunkerService {
    private readonly logger = new Logger(ChunkerService.name);
    private readonly chunkSize: number;
    private readonly chunkOverlap: number;

    constructor(private readonly config: ConfigService) {
        this.chunkSize = this.config.get<number>('app.rag.chunkSize', 500);
        this.chunkOverlap = this.config.get<number>('app.rag.chunkOverlap', 80);
    }

    /**
     * Split text into overlapping chunks optimised for RAG retrieval.
     * Strategy: sentence-aware splitting respecting chunkSize (in chars).
     */
    chunkText(
        text: string,
        documentName: string,
        pageBreaks?: number[],
    ): TextChunk[] {
        const normalized = this.normalizeText(text);
        const sentences = this.splitIntoSentences(normalized);
        const chunks: TextChunk[] = [];

        let currentChunk = '';
        let currentChunkIndex = 0;
        let charOffset = 0;

        for (const sentence of sentences) {
            const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;

            if (candidate.length <= this.chunkSize) {
                currentChunk = candidate;
            } else {
                // Flush current chunk
                if (currentChunk.trim()) {
                    chunks.push(
                        this.createChunk(
                            currentChunk.trim(),
                            documentName,
                            currentChunkIndex++,
                            pageBreaks,
                            charOffset,
                        ),
                    );
                    charOffset += currentChunk.length;

                    // Overlap: keep last N chars as seed for next chunk
                    const overlap = currentChunk.slice(-this.chunkOverlap);
                    currentChunk = `${overlap} ${sentence}`.trim();
                } else {
                    // Single sentence exceeds chunk size → force-split on words
                    const words = sentence.split(' ');
                    let wordChunk = '';
                    for (const word of words) {
                        if ((wordChunk + ' ' + word).length <= this.chunkSize) {
                            wordChunk = wordChunk ? `${wordChunk} ${word}` : word;
                        } else {
                            if (wordChunk) {
                                chunks.push(
                                    this.createChunk(
                                        wordChunk.trim(),
                                        documentName,
                                        currentChunkIndex++,
                                        pageBreaks,
                                        charOffset,
                                    ),
                                );
                                charOffset += wordChunk.length;
                            }
                            wordChunk = word;
                        }
                    }
                    currentChunk = wordChunk;
                }
            }
        }

        // Flush last chunk
        if (currentChunk.trim()) {
            chunks.push(
                this.createChunk(
                    currentChunk.trim(),
                    documentName,
                    currentChunkIndex++,
                    pageBreaks,
                    charOffset,
                ),
            );
        }

        this.logger.debug(
            `Chunked "${documentName}" → ${chunks.length} chunks (size=${this.chunkSize}, overlap=${this.chunkOverlap})`,
        );

        return chunks;
    }

    private createChunk(
        text: string,
        documentName: string,
        chunkIndex: number,
        pageBreaks?: number[],
        charOffset?: number,
    ): TextChunk {
        const pageNumber = pageBreaks
            ? this.estimatePage(charOffset || 0, pageBreaks)
            : undefined;

        const safeDocName = documentName.replace(/[^a-zA-Z0-9_-]/g, '_');
        return {
            text,
            chunkIndex,
            pageNumber,
            documentName,
            chunkId: `${safeDocName}_chunk_${chunkIndex}`,
            wordCount: text.split(/\s+/).length,
        };
    }

    private normalizeText(text: string): string {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n') // max 2 consecutive newlines
            .replace(/[ \t]+/g, ' ')    // collapse spaces/tabs
            .trim();
    }

    private splitIntoSentences(text: string): string[] {
        // Split on sentence boundaries, preserving paragraph breaks
        const parts = text.split(/(?<=[.!?؟]\s+)|(?<=\n\n)/);
        return parts
            .map((s) => s.trim())
            .filter((s) => s.length > 5);
    }

    private estimatePage(charOffset: number, pageBreaks: number[]): number {
        let page = 1;
        for (const breakPoint of pageBreaks) {
            if (charOffset > breakPoint) page++;
            else break;
        }
        return page;
    }
}
