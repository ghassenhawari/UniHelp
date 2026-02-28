import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from '../ollama/ollama.service';
import { VectorStoreService } from '../rag/vector-store/vector-store.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly config: ConfigService,
        private readonly ollama: OllamaService,
        private readonly vectorStore: VectorStoreService,
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Health check complet',
        description: 'Vérifie l\'état de l\'API, Ollama et ChromaDB.',
    })
    @ApiResponse({
        status: 200,
        description: 'Statut de tous les services',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['ok', 'degraded', 'error'] },
                timestamp: { type: 'string', format: 'date-time' },
                uptime: { type: 'number', description: 'Uptime en secondes' },
                services: {
                    type: 'object',
                    properties: {
                        api: { type: 'object' },
                        ollama: { type: 'object' },
                        chromadb: { type: 'object' },
                    },
                },
            },
        },
    })
    async check() {
        const ollamaHealth = await this.ollama.healthCheck();
        const chromaConnected = this.vectorStore.isConnected();
        const totalChunks = await this.vectorStore.getTotalChunkCount().catch(() => 0);

        const allHealthy = ollamaHealth.available && chromaConnected;
        const anyHealthy = ollamaHealth.available || chromaConnected;

        return {
            status: allHealthy ? 'ok' : anyHealthy ? 'degraded' : 'error',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            version: '1.0.0',
            environment: this.config.get<string>('app.nodeEnv', 'development'),
            services: {
                api: {
                    status: 'ok',
                    port: this.config.get<number>('app.port', 3001),
                },
                ollama: {
                    status: ollamaHealth.available ? 'ok' : 'unavailable',
                    url: this.ollama.getBaseUrl(),
                    model: this.ollama.getModel(),
                    availableModels: ollamaHealth.models,
                    error: ollamaHealth.error,
                },
                chromadb: {
                    status: chromaConnected ? 'ok' : 'unavailable',
                    totalChunks,
                    collection: this.config.get<string>('app.chroma.collection'),
                },
            },
        };
    }

    @Get('ping')
    @ApiOperation({ summary: 'Ping rapide (pas de vérification des services externes)' })
    @ApiResponse({ status: 200, description: 'Pong' })
    ping() {
        return { status: 'ok', message: 'pong', timestamp: new Date().toISOString() };
    }
}
