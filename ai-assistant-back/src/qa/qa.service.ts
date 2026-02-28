import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '../rag/vector-store/vector-store.service';
import { PromptBuilderService } from '../rag/prompt-builder/prompt-builder.service';
import { OllamaService } from '../modules/ai/ollama.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AskAnswerDto, SourceDto } from './dto/ask-answer.dto';
import { StatsService } from '../stats/stats.service';

// Exact phrase returned when no context is found — used for "found" detection
const NOT_FOUND_PHRASES = [
    "je n'ai pas trouvé",
    "information non trouvée",
    'i could not find',
    'لم أجد',
];

@Injectable()
export class QaService {
    private readonly logger = new Logger(QaService.name);

    constructor(
        private readonly vectorStore: VectorStoreService,
        private readonly promptBuilder: PromptBuilderService,
        private readonly ollama: OllamaService,
        private readonly stats: StatsService,
    ) { }

    /**
     * Full RAG pipeline:
     *   1. Retrieve relevant chunks from vector store
     *   2. Build strict anti-hallucination prompt
     *   3. Generate answer with Ollama
     *   4. Return answer + sources + confidence
     */
    async ask(dto: AskQuestionDto, requestId?: string): Promise<AskAnswerDto> {
        const { question, topK = 5, lang = 'fr' } = dto;
        const start = Date.now();

        this.logger.log(`[${requestId}] Q&A: "${question.slice(0, 80)}…" (topK=${topK}, lang=${lang})`);

        // ── 1. Retrieve ──────────────────────────────────────────────
        const chunks = await this.vectorStore.retrieve(question, topK);
        this.logger.debug(`[${requestId}] Retrieved ${chunks.length} chunks`);

        // ── 2. Build prompt ──────────────────────────────────────────
        const { systemPrompt, userPrompt, contextUsed } = this.promptBuilder.buildQaPrompt(
            question,
            chunks,
            lang,
        );

        // ── 3. If no context, return not-found immediately ───────────
        if (contextUsed.length === 0) {
            const notFoundMsg = this.getNotFoundMessage(lang);
            this.logger.warn(`[${requestId}] No relevant chunks found for question`);

            // Track in stats
            await this.stats.recordQuestion({
                question,
                found: false,
                confidence: 0,
                durationMs: Date.now() - start,
                requestId,
            });

            return {
                answer: notFoundMsg,
                sources: [],
                confidence: 0,
                found: false,
                requestId,
            };
        }

        // ── 4. Generate via Ollama ───────────────────────────────────
        const rawAnswer = await this.ollama.chat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { temperature: 0.1 },
        );

        // ── 5. Compute confidence ────────────────────────────────────
        const confidence = this.promptBuilder.computeConfidence(contextUsed);

        // ── 6. Check if LLM actually answered or said "not found" ────
        const lowerAnswer = rawAnswer.toLowerCase();
        const found = !NOT_FOUND_PHRASES.some((phrase) => lowerAnswer.includes(phrase));

        // ── 7. Build sources ─────────────────────────────────────────
        const sources: SourceDto[] = contextUsed.map((c) => ({
            document: c.documentName,
            page: c.pageNumber,
            chunkId: c.chunkId,
            similarity: Math.round(c.similarity * 1000) / 1000,
        }));

        const durationMs = Date.now() - start;
        this.logger.log(
            `[${requestId}] Answered in ${durationMs}ms | found=${found} | confidence=${confidence}`,
        );

        // ── 8. Log stats ─────────────────────────────────────────────
        await this.stats.recordQuestion({
            question,
            found,
            confidence,
            durationMs,
            requestId,
            sourceDocuments: [...new Set(sources.map((s) => s.document))],
        });

        return {
            answer: rawAnswer,
            sources,
            confidence,
            found,
            requestId,
        };
    }

    private getNotFoundMessage(lang: string): string {
        switch (lang) {
            case 'ar':
                return 'لم أجد هذه المعلومات في الوثائق الرسمية المتاحة. يرجى التواصل مع الإدارة.';
            case 'en':
                return 'I could not find this information in the available official documents. Please contact the administration.';
            default:
                return "Je n'ai pas trouvé cette information dans les documents officiels disponibles. Veuillez contacter l'administration.";
        }
    }
}
