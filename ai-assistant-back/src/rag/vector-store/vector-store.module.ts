import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { EmbeddingsModule } from '../../modules/ai/embeddings.module';

@Module({
    imports: [EmbeddingsModule],
    providers: [VectorStoreService],
    exports: [VectorStoreService],
})
export class VectorStoreModule { }
