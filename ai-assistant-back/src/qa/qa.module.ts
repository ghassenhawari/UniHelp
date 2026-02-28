import { Module } from '@nestjs/common';
import { QaController } from './qa.controller';
import { VectorStoreModule } from '../rag/vector-store/vector-store.module';
import { StatsModule } from '../stats/stats.module';
import { AiModule } from '../modules/ai/ai.module';

@Module({
    imports: [
        VectorStoreModule,
        StatsModule,
        AiModule,       // RagService + OllamaService + EmbeddingsService
    ],
    controllers: [QaController],
    // QaService retiré — la logique RAG est dans AiModule.RagService
})
export class QaModule { }
