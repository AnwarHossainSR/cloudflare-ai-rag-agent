import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

export type Confidence = 'High' | 'Medium' | 'Low';

export interface SourceCitation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  snippet: string;
}

export interface RagQueryResponse {
  answer: string;
  citations: SourceCitation[];
  confidence: Confidence;
}

export interface RagQueryInput {
  question: string;
  topK?: number;
}

export function useRagQuery() {
  return useMutation({
    mutationFn: async (input: RagQueryInput) => {
      const { data } = await api.post<RagQueryResponse>('/rag/query', input);
      return data;
    },
  });
}
