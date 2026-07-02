import { Annotation } from '@langchain/langgraph';
import { Confidence, SourceCitation, AgentStepName } from '@devdocs/shared';
import { RetrievedChunk } from '../../rag/rag.service';

export interface StepLog {
  name: AgentStepName;
  input: unknown;
  output: unknown;
  latencyMs: number;
}

export const AgentState = Annotation.Root({
  userId: Annotation<string>(),
  question: Annotation<string>(),
  documentIds: Annotation<string[]>({ reducer: (_, n) => n, default: () => [] }),
  classification: Annotation<string>(),
  searchQuery: Annotation<string>(),
  retrieved: Annotation<RetrievedChunk[]>({ reducer: (_, n) => n, default: () => [] }),
  contextSufficient: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
  retryCount: Annotation<number>({ reducer: (_, n) => n, default: () => 0 }),
  answer: Annotation<string>(),
  citations: Annotation<SourceCitation[]>({ reducer: (_, n) => n, default: () => [] }),
  confidence: Annotation<Confidence>(),
  verified: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
  steps: Annotation<StepLog[]>({ reducer: (a, n) => a.concat(n), default: () => [] }),
});
