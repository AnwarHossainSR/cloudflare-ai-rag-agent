import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudflareAiModule } from '../cloudflare-ai/cloudflare-ai.module';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { EmbeddingsService } from './embeddings.service';

@Module({
  imports: [CloudflareAiModule, TypeOrmModule.forFeature([DocumentChunk])],
  providers: [EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
