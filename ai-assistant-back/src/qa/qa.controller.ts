import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RagService } from '../modules/ai/rag.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AiAskDto, AiAskResponseDto } from '../modules/ai/dto/ask-ai.dto';
import type { Request } from 'express';

@ApiTags('Q&A (RAG)')
@Controller('qa')
export class QaController {
    constructor(
        private readonly ragService: RagService,
    ) { }

    /**
     * POST /api/qa/ask
     * Pipeline RAG complet : embedding → retrieve → prompt strict → Ollama → réponse
     */
    @Post('ask')
    @HttpCode(HttpStatus.OK)
    @Throttle({ medium: { ttl: 60000, limit: 15 } }) // 15 questions/minute par IP
    @ApiOperation({
        summary: 'Poser une question administrative universitaire (RAG)',
        description: `
**Pipeline RAG complet :**
1. Embedding de la question (Xenova/all-MiniLM-L6-v2)
2. Recherche sémantique dans ChromaDB (top-K chunks)
3. Calcul du score de confiance (top3 pondéré)
4. Si confiance < seuil → réponse "non trouvée"
5. Prompt strict anti-hallucination → Ollama (llama3.2)
6. Retour: answer + sources (doc/page) + confidence

**Si l'information n'est pas dans les documents officiels**, retourne le message standard "non trouvée".
    `,
    })
    @ApiBody({ type: AskQuestionDto })
    @ApiResponse({
        status: 200,
        description: 'Réponse générée avec sources et score de confiance',
        type: AiAskResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Requête invalide' })
    @ApiResponse({ status: 429, description: 'Trop de requêtes (rate limit)' })
    @ApiResponse({ status: 503, description: 'Ollama ou ChromaDB indisponible' })
    async ask(
        @Body() dto: AskQuestionDto,
        @Req() req: Request,
    ): Promise<AiAskResponseDto> {
        // Convertir AskQuestionDto → AiAskDto (même structure, compatible)
        const aiDto: AiAskDto = {
            question: dto.question,
            topK: dto.topK,
            lang: dto.lang,
        };
        return this.ragService.ask(aiDto);
    }
}
