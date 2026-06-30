import { SourceCitation } from '@devdocs/shared';
import { RetrievedChunk } from './rag.service';

export function toCitation(chunk: RetrievedChunk): SourceCitation {
  return {
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    chunkIndex: chunk.chunkIndex,
    score: chunk.score,
    snippet: chunk.content.slice(0, 200),
  };
}

export function buildContextText(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk) => `[Doc: ${chunk.documentName} #${chunk.chunkIndex}]\n${chunk.content}`)
    .join('\n\n');
}
