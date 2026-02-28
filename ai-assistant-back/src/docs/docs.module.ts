import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { VectorStoreModule } from '../rag/vector-store/vector-store.module';
import { ChunkerModule } from '../rag/chunker/chunker.module';
import { DocumentEntity } from './entities/document.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([DocumentEntity]),
        VectorStoreModule,
        ChunkerModule,
    ],
    controllers: [DocsController],
    providers: [DocsService],
    exports: [DocsService],
})
export class DocsModule { }
