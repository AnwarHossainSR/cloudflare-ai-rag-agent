import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentChunk } from './entities/document-chunk.entity';
import { Document } from './entities/document.entity';

@Module({
  imports: [
    MulterModule.register({}),
    TypeOrmModule.forFeature([Document, DocumentChunk]),
    EmbeddingsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
