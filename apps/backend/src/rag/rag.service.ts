import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Confidence, RagQueryResponse } from '@devdocs/shared';
import { Repository } from 'typeorm';
import { CloudflareAiService } from '../cloudflare-ai/cloudflare-ai.service';
import { vectorTransformer } from '../database/transformers/vector.transformer';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { buildAnswerPrompt, parseConfidence } from './prompts';
import { buildContextText, toCitation } from './rag.utils';

export interface RetrievedChunk {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  score: number;
}

@Injectable()
export class RagService {
  constructor(
    @InjectRepository(DocumentChunk)
    private readonly chunkRepo: Repository<DocumentChunk>,
    private readonly ai: CloudflareAiService,
  ) {}

  async retrieve(userId: string, query: string, topK = 6): Promise<RetrievedChunk[]> {
    const [queryEmbedding] = await this.ai.embed([query]);
    const limit = clampTopK(topK);
    const rows = await this.chunkRepo.query(
      `SELECT c.document_id AS "documentId", d.filename AS "documentName",
              c.chunk_index AS "chunkIndex", c.content,
              1 - (c.embedding <=> $1::vector) AS score
         FROM document_chunks c
         JOIN documents d ON d.id = c.document_id
        WHERE d.user_id = $2 AND d.status = 'ready'
        ORDER BY c.embedding <=> $1::vector
        LIMIT $3`,
      [vectorTransformer.to(queryEmbedding), userId, limit],
    );

    return rows.map((row: RetrievedChunk) => ({ ...row, score: Number(row.score) }));
  }

  async answer(userId: string, question: string, topK = 6): Promise<RagQueryResponse> {
    const chunks = await this.retrieve(userId, question, clampTopK(topK));
    if (!chunks.length) {
      return {
        answer: 'The documents do not contain enough information to answer this question.',
        citations: [],
        confidence: Confidence.LOW,
      };
    }

    const context = buildContextText(chunks);
    const { text } = await this.ai.chat(buildAnswerPrompt(context, question));

    return {
      answer: text,
      citations: chunks.map(toCitation),
      confidence: parseConfidence(text),
    };
  }
}

function clampTopK(topK: number): number {
  return Math.min(8, Math.max(5, topK));
}
