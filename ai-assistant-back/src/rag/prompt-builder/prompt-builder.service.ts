import { Injectable, Logger } from '@nestjs/common';
import { RetrievedChunk } from '../vector-store/vector-store.service';

export interface BuiltPrompt {
    systemPrompt: string;
    userPrompt: string;
    contextUsed: RetrievedChunk[];
}

/**
 * PromptBuilderService — assembles a strict anti-hallucination RAG prompt.
 *
 * The prompt forcefully restricts the LLM to only use provided context.
 * If context is empty, it returns a "not found" prompt to return immediately.
 */
@Injectable()
export class PromptBuilderService {
    private readonly logger = new Logger(PromptBuilderService.name);

    buildQaPrompt(question: string, chunks: RetrievedChunk[], lang = 'fr'): BuiltPrompt {
        if (chunks.length === 0) {
            return {
                systemPrompt: this.getSystemPrompt(lang),
                userPrompt: this.buildNoContextPrompt(question, lang),
                contextUsed: [],
            };
        }

        const contextBlock = this.formatContext(chunks);
        const userPrompt = this.buildContextualPrompt(question, contextBlock, lang);

        return {
            systemPrompt: this.getSystemPrompt(lang),
            userPrompt,
            contextUsed: chunks,
        };
    }

    private getSystemPrompt(lang: string): string {
        if (lang === 'fr') {
            return `Tu es UniHelp, un assistant administratif universitaire officiel.

RÈGLES UNIHELP :
1. Répond UNIQUEMENT à partir de la source fournie.
2. N'utilise AUCUNE connaissance externe.
3. Si absent des sources, réponds : "Je n'ai pas trouvé cette information dans les documents officiels disponibles."
4. Cite les sources à la fin.
5. Sois formel, structuré, et précis.
6. Ne pas inventer de dates ou de procédures.
7. Ne fais pas d'introduction inutile, va droit au but.`;
        }

        if (lang === 'ar') {
            return `أنت UniHelp، مساعد إداري جامعي رسمي.

قواعد صارمة:
1. تجيب فقط من المصادر الرسمية المقدمة أدناه.
2. لا تستخدم أي معرفة خارجية.
3. إذا لم تجد المعلومات، قل: "لم أجد هذه المعلومات في الوثائق الرسمية المتاحة."
4. دائماً اذكر المصادر في نهاية إجابتك.`;
        }

        return `You are UniHelp, an official university administrative assistant.

ABSOLUTE RULES:
1. Answer ONLY from the official sources provided below.
2. Use NO external knowledge whatsoever.
3. If information is not in the sources, respond EXACTLY:
   "I could not find this information in the available official documents. Please contact the administration."
4. Always cite sources at the end.
5. Make no assumptions or extrapolations.`;
    }

    private buildContextualPrompt(question: string, contextBlock: string, lang: string): string {
        if (lang === 'fr') {
            return `QUESTION DE L'ÉTUDIANT :
${question}

SOURCES OFFICIELLES :
───────────────────────────────────────────
${contextBlock}
───────────────────────────────────────────

FORMAT DE RÉPONSE OBLIGATOIRE :

**Réponse :**
(Explication claire et précise basée UNIQUEMENT sur les sources ci-dessus)

**Procédure :** (si applicable)
1. Étape 1
2. Étape 2
...

**Sources :**
- [NomDocument] (page X)
- [NomDocument] (page Y)`;
        }

        if (lang === 'ar') {
            return `سؤال الطالب:
${question}

المصادر الرسمية:
───────────────────────────────────────────
${contextBlock}
───────────────────────────────────────────

صيغة الإجابة:

**الإجابة:**
(شرح واضح ودقيق بناءً على المصادر فقط)

**الإجراءات:** (إن وجدت)
1. الخطوة 1
2. الخطوة 2

**المصادر:**
- [اسم الوثيقة] (صفحة X)`;
        }

        return `STUDENT QUESTION:
${question}

OFFICIAL SOURCES:
───────────────────────────────────────────
${contextBlock}
───────────────────────────────────────────

REQUIRED RESPONSE FORMAT:

**Answer:**
(Clear explanation based ONLY on the sources above)

**Procedure:** (if applicable)
1. Step 1
2. Step 2

**Sources:**
- [DocumentName] (page X)`;
    }

    private buildNoContextPrompt(question: string, lang: string): string {
        const noInfoMsg =
            lang === 'fr'
                ? 'Je n\'ai pas trouvé cette information dans les documents officiels disponibles. Veuillez contacter l\'administration.'
                : lang === 'ar'
                    ? 'لم أجد هذه المعلومات في الوثائق الرسمية المتاحة. يرجى التواصل مع الإدارة.'
                    : 'I could not find this information in the available official documents. Please contact the administration.';

        return `QUESTION: ${question}

No relevant context found in official documents.

Respond with this EXACT message: "${noInfoMsg}"`;
    }

    private formatContext(chunks: RetrievedChunk[]): string {
        return chunks
            .map((chunk, i) => {
                const page = chunk.pageNumber ? ` — Page ${chunk.pageNumber}` : '';
                const score = (chunk.similarity * 100).toFixed(0);
                return `[SOURCE ${i + 1}] ${chunk.documentName}${page} (pertinence: ${score}%)
${chunk.text}`;
            })
            .join('\n\n---\n\n');
    }

    computeConfidence(chunks: RetrievedChunk[]): number {
        if (chunks.length === 0) return 0;
        const avg = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
        const topScore = chunks[0]?.similarity ?? 0;
        // Weighted: 70% top score, 30% average
        return Math.round((topScore * 0.7 + avg * 0.3) * 100) / 100;
    }
}
