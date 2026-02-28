import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OllamaModule } from '../ollama/ollama.module';
import { VectorStoreModule } from '../rag/vector-store/vector-store.module';

@Module({
    imports: [OllamaModule, VectorStoreModule],
    controllers: [HealthController],
})
export class HealthModule { }
