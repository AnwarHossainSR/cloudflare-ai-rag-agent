import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudflareAiModule } from '../cloudflare-ai/cloudflare-ai.module';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentChunk]), CloudflareAiModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
