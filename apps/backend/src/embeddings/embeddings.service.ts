import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudflareAiService } from '../cloudflare-ai/cloudflare-ai.service';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { chunkText } from './chunking';

const EMBEDDING_DIM = 1024;
const EMBED_BATCH_SIZE = 50;

@Injectable()
export class EmbeddingsService {
  constructor(
    private readonly ai: CloudflareAiService,
    @InjectRepository(DocumentChunk)
    private readonly chunks: Repository<DocumentChunk>,
  ) {}

  async processDocument(
    documentId: string,
    text: string,
    sourceFilename: string,
  ): Promise<number> {
    const chunks = chunkText(text);
    const embeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
      embeddings.push(...(await this.ai.embed(batch.map((chunk) => chunk.content))));
    }

    if (
      embeddings.length !== chunks.length ||
      embeddings.some((embedding) => embedding.length !== EMBEDDING_DIM)
    ) {
      throw new BadGatewayException('Cloudflare returned invalid embedding dimensions');
    }

    await this.chunks.save(
      chunks.map((chunk, i) =>
        this.chunks.create({
          documentId,
          chunkIndex: chunk.index,
          content: chunk.content,
          sourceFilename,
          tokenCount: chunk.tokenCount,
          embedding: embeddings[i],
        }),
      ),
    );

    return chunks.length;
  }
}
