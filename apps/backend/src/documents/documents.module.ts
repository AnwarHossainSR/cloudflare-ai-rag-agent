import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { DOCUMENT_PROCESSING_QUEUE } from './documents.constants';
import { DocumentsController } from './documents.controller';
import { DocumentsProcessor } from './documents.processor';
import { DocumentsQueueService } from './documents.queue';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage.service';
import { DocumentChunk } from './entities/document-chunk.entity';
import { Document } from './entities/document.entity';

@Module({
  imports: [
    MulterModule.register({}),
    TypeOrmModule.forFeature([Document, DocumentChunk]),
    EmbeddingsModule,
    BullModule.registerQueue({ name: DOCUMENT_PROCESSING_QUEUE }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService, DocumentsQueueService, DocumentsProcessor],
  exports: [DocumentsService, StorageService],
})
export class DocumentsModule {}
