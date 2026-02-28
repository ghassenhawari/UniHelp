import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingsModule } from './embeddings.module';
import { OllamaService } from './ollama.service';
import { RagService } from './rag.service';
import { AiController } from './ai.controller';
import { VectorStoreModule } from '../../rag/vector-store/vector-store.module';
import { StatsModule } from '../../stats/stats.module';
import { PromptBuilderModule } from '../../rag/prompt-builder/prompt-builder.module';

@Module({
    imports: [
        ConfigModule,
        EmbeddingsModule,
        VectorStoreModule,
        StatsModule,
        PromptBuilderModule,
    ],
    controllers: [AiController],
    providers: [
        OllamaService,
        RagService,
    ],
    exports: [EmbeddingsModule, OllamaService, RagService],
})
export class AiModule { }
