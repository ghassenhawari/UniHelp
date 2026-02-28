import {
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from './ollama.service';
import { VectorStoreService } from '../../rag/vector-store/vector-store.service';
import { PromptBuilderService } from '../../rag/prompt-builder/prompt-builder.service';
import { StatsService } from '../../stats/stats.service';
import { AiAskDto, AiAskResponseDto, AiSourceDto } from './dto/ask-ai.dto';

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);
    private readonly threshold: number;
    private readonly defaultTopK: number;
    private readonly temperature: number;

    constructor(
        private readonly config: ConfigService,
        private readonly vectorStore: VectorStoreService,
        private readonly ollama: OllamaService,
        private readonly promptBuilder: PromptBuilderService,
        private readonly stats: StatsService,
    ) {
        // Lire la configuration depuis .env via ConfigService (avec fallback typé)
        this.threshold = this.config.get<number>('app.rag.similarityThreshold', 0.35);
        this.defaultTopK = this.config.get<number>('app.rag.topKDefault', 5);
        this.temperature = this.config.get<number>('app.rag.temperature', 0.1);
    }

    /**
     * Pipeline RAG complet :
     *   1. Retrieving chunks sémantiquement similaires depuis ChromaDB
     *   2. Calcul du score de confiance (top3 pondéré)
     *   3. Si confiance < seuil → réponse "non trouvée"
     *   4. Prompt strict anti-hallucination via PromptBuilderService
     *   5. Génération via Ollama
     *   6. Log stats
     */
    async ask(dto: AiAskDto): Promise<AiAskResponseDto> {
        const startTime = Date.now();
        const { question, topK = this.defaultTopK, lang = 'fr' } = dto;

        this.logger.log(
            `[RAG] question="${question.slice(0, 80)}" | topK=${topK} | lang=${lang} | threshold=${this.threshold}`,
        );

        try {
            // ── 1. Recherche sémantique ─────────────────────────────────
            const chunks = await this.vectorStore.retrieve(question, topK);
            this.logger.debug(`[RAG] Retrieved ${chunks.length} chunks`);

            // ── 2. Calcul de confiance robuste ──────────────────────────
            const confidence = this.promptBuilder.computeConfidence(chunks);

            // ── 3. Seuil de confiance anti-hallucination ────────────────
            if (chunks.length === 0 || confidence < this.threshold) {
                this.logger.warn(
                    `[RAG] Confiance insuffisante: ${confidence.toFixed(3)} < ${this.threshold} (${chunks.length} chunks)`,
                );
                const msg = this.getNotFoundMessage(lang);

                await this.stats.recordQuestion({
                    question,
                    found: false,
                    confidence: 0,
                    durationMs: Date.now() - startTime,
                });

                return { answer: msg, sources: [], confidence: 0 };
            }

            // ── 4. Prompt strict anti-hallucination ─────────────────────
            const { systemPrompt, userPrompt } = this.promptBuilder.buildQaPrompt(
                question,
                chunks,
                lang,
            );

            // ── 5. Vérification de disponibilité Ollama ─────────────────
            const ollamaStatus = await this.ollama.checkStatus();
            if (!ollamaStatus.ready) {
                this.logger.error(`[RAG] Ollama non prêt: ${ollamaStatus.message}`);
                throw new ServiceUnavailableException(
                    `Le moteur IA est momentanément indisponible. ${ollamaStatus.message}`,
                );
            }

            // ── 6. Inférence LLM ────────────────────────────────────────
            const answer = await this.ollama.chat(
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                { temperature: this.temperature },
            );

            // ── 7. Formater les sources ─────────────────────────────────
            const sources: AiSourceDto[] = chunks.map((c) => ({
                documentName: c.documentName,
                text: c.text.slice(0, 300), // Tronquer pour la réponse
                pageNumber: c.pageNumber,
                similarity: Math.round(c.similarity * 1000) / 1000,
            }));

            const durationMs = Date.now() - startTime;
            this.logger.log(
                `[RAG] ✅ Réponse en ${durationMs}ms | confidence=${confidence.toFixed(3)} | sources=${sources.length}`,
            );

            // ── 8. Log statistiques ─────────────────────────────────────
            await this.stats.recordQuestion({
                question,
                found: true,
                confidence,
                durationMs,
                sourceDocuments: [...new Set(sources.map((s) => s.documentName))],
            });

            return { answer, sources, confidence };

        } catch (err) {
            if (err instanceof ServiceUnavailableException) throw err;

            this.logger.error(`[RAG] Erreur pipeline: ${err.message}`, err.stack);
            return {
                answer: `Erreur technique: ${err.message}`,
                sources: [],
                confidence: 0,
            };
        }
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
