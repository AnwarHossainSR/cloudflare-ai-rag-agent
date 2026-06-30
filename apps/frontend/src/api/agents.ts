import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Confidence, SourceCitation } from './rag';

// Mirrors AgentStepName in packages/shared/src/index.ts.
export type AgentStepName =
  | 'classifyQuestion'
  | 'rewriteQuery'
  | 'retrieveContext'
  | 'evaluateContext'
  | 'retryRetrieval'
  | 'generateAnswer'
  | 'verifyAnswer'
  | 'finalResponse';

export interface AgentStep {
  id: string;
  runId: string;
  name: AgentStepName;
  input: unknown;
  output: unknown;
  latencyMs: number | null;
  order: number;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  userId: string;
  sessionId: string | null;
  question: string;
  finalAnswer: string | null;
  confidence: Confidence | null;
  status: string;
  retryCount: number;
  createdAt: string;
  steps: AgentStep[];
}

export interface AgentRunResult {
  runId: string;
  answer: string;
  citations: SourceCitation[];
  confidence: Confidence;
  steps: AgentStep[];
}

export interface AgentQueryInput {
  question: string;
  sessionId?: string;
}

export function useAgentQuery() {
  return useMutation({
    mutationFn: async (input: AgentQueryInput) => {
      const { data } = await api.post<AgentRunResult>('/agents/query', input);
      return data;
    },
  });
}

export function useAgentRun(id?: string) {
  return useQuery({
    queryKey: ['agents', 'run', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<AgentRun>(`/agents/runs/${id}`);
      return data;
    },
  });
}
