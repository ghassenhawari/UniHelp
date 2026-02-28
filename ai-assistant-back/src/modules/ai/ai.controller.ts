import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { OllamaService } from './ollama.service';
import { AiAskDto, AiAskResponseDto } from './dto/ask-ai.dto';

class DirectAskDto {
    @ApiProperty({ example: 'Explique en 3 mots ce qu\'est une université.' })
    @IsString()
    prompt: string;

    @ApiProperty({ required: false, default: 'system: Tu es UniHelp, assistant universitaire.' })
    @IsOptional()
    @IsString()
    system?: string;
}

@ApiTags('AI (RAG & LLM)')
@Controller('ai')
export class AiController {
    constructor(
        private readonly ragService: RagService,
        private readonly ollamaService: OllamaService,
    ) { }

    /**
     * POST /api/ai/ask — RAG complet
     */
    @Post('ask')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Poser une question via le pipeline RAG complet' })
    @ApiBody({ type: AiAskDto })
    @ApiResponse({ status: 200, type: AiAskResponseDto })
    @ApiResponse({ status: 503, description: 'Ollama ou ChromaDB indisponible' })
    async ask(@Body() dto: AiAskDto): Promise<AiAskResponseDto> {
        return this.ragService.ask(dto);
    }

    /**
     * POST /api/ai/direct — Test direct LLM sans RAG
     */
    @Post('direct')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Tester le LLM directement (sans RAG, sans documents)' })
    @ApiBody({ type: DirectAskDto })
    @ApiResponse({ status: 200, description: 'Réponse brute du LLM' })
    @ApiResponse({ status: 503, description: 'Ollama indisponible' })
    async directAsk(@Body() body: DirectAskDto) {
        const status = await this.ollamaService.checkStatus();
        if (!status.ready) {
            throw new ServiceUnavailableException(
                `Ollama indisponible: ${status.message}`,
            );
        }

        const answer = await this.ollamaService.chat(
            [
                {
                    role: 'system',
                    content: body.system || 'Tu es UniHelp, un assistant universitaire.',
                },
                { role: 'user', content: body.prompt },
            ],
            { temperature: 0.3 },
        );

        return { answer, model: status.model };
    }

    /**
     * GET /api/ai/llm/status — Vérification état Ollama
     */
    @Get('llm/status')
    @ApiOperation({ summary: 'Vérifier l\'état du moteur LLM (Ollama + modèle)' })
    @ApiResponse({
        status: 200,
        description: 'État détaillé du moteur IA',
        schema: {
            example: {
                available: true,
                ready: true,
                model: 'llama3.2',
                models: ['llama3.2:latest'],
                message: 'Le moteur IA est prêt.',
            },
        },
    })
    async getLlmStatus() {
        return this.ollamaService.checkStatus();
    }
}
