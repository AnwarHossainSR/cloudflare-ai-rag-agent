import { AgentStepName, Confidence } from '@devdocs/shared';
import { CloudflareAiService } from '../../cloudflare-ai/cloudflare-ai.service';
import { RagService } from '../../rag/rag.service';
import { buildAnswerPrompt, parseConfidence } from '../../rag/prompts';
import { buildContextText, toCitation } from '../../rag/rag.utils';
import {
  buildClassifierPrompt,
  buildEvaluatorPrompt,
  buildRewriterPrompt,
  buildVerifierPrompt,
} from './agent-prompts';
import { AgentState, StepLog } from './state';

type State = typeof AgentState.State;
type StateUpdate = Partial<State>;

const CLASSIFICATIONS = ['simple', 'document', 'technical', 'multi-step'] as const;
type Classification = (typeof CLASSIFICATIONS)[number];

const SUFFICIENCY_SCORE_THRESHOLD = 0.5;

/**
 * Wraps a node body, timing it and shaping the return value so every node
 * appends exactly one StepLog to the `steps` channel.
 */
function withStep<TInput>(
  name: AgentStepName,
  fn: (state: State) => Promise<{ input: TInput; output: unknown; update: StateUpdate }>,
) {
  return async (state: State): Promise<StateUpdate> => {
    const start = Date.now();
    const { input, output, update } = await fn(state);
    const log: StepLog = { name, input, output, latencyMs: Date.now() - start };
    return { ...update, steps: [log] };
  };
}

function parseClassification(text: string): Classification {
  const lower = text.toLowerCase();
  const match = CLASSIFICATIONS.find((label) => lower.includes(label));
  return match ?? 'simple';
}

export function createNodes(deps: { ai: CloudflareAiService; rag: RagService }) {
  const { ai, rag } = deps;

  const classifyQuestion = withStep<{ question: string }>(
    AgentStepName.CLASSIFY,
    async (state) => {
      const messages = buildClassifierPrompt(state.question);
      const { text } = await ai.chat(messages, undefined, { userId: state.userId });
      const classification = parseClassification(text);
      return {
        input: { question: state.question },
        output: { classification, raw: text },
        update: { classification },
      };
    },
  );

  const rewriteQuery = withStep<{ question: string }>(AgentStepName.REWRITE, async (state) => {
    const messages = buildRewriterPrompt(state.question);
    const { text } = await ai.chat(messages, undefined, { userId: state.userId });
    const searchQuery = text.trim() || state.question;
    return {
      input: { question: state.question },
      output: { searchQuery },
      update: { searchQuery },
    };
  });

  const retrieveContext = withStep<{ userId: string; searchQuery: string; documentIds: string[] }>(
    AgentStepName.RETRIEVE,
    async (state) => {
      const retrieved = await rag.retrieve(state.userId, state.searchQuery, undefined, state.documentIds);
      return {
        input: { userId: state.userId, searchQuery: state.searchQuery, documentIds: state.documentIds },
        output: { count: retrieved.length },
        update: { retrieved },
      };
    },
  );

  const evaluateContext = withStep<{ question: string; retrievedCount: number }>(
    AgentStepName.EVALUATE,
    async (state) => {
      const chunks = state.retrieved;
      const topScore = chunks.length ? Math.max(...chunks.map((c) => c.score)) : 0;

      // Cheap heuristic first: no chunks, or top score below threshold -> insufficient.
      if (chunks.length === 0 || topScore < SUFFICIENCY_SCORE_THRESHOLD) {
        return {
          input: { question: state.question, retrievedCount: chunks.length },
          output: { contextSufficient: false, reason: 'heuristic', topScore },
          update: { contextSufficient: false },
        };
      }

      // Heuristic is inconclusive; ask the model.
      const context = buildContextText(chunks);
      const { text } = await ai.chat(buildEvaluatorPrompt(state.question, context), undefined, {
        userId: state.userId,
      });
      const contextSufficient = /\bSUFFICIENT\b/i.test(text) && !/\bINSUFFICIENT\b/i.test(text);

      return {
        input: { question: state.question, retrievedCount: chunks.length },
        output: { contextSufficient, reason: 'model', raw: text },
        update: { contextSufficient },
      };
    },
  );

  const retryRetrieval = withStep<{ previousSearchQuery: string; retryCount: number }>(
    AgentStepName.RETRY,
    async (state) => {
      const retryCount = state.retryCount + 1;
      const retryContext = `attempt ${retryCount}, previous query: "${state.searchQuery}"`;
      const { text } = await ai.chat(buildRewriterPrompt(state.question, retryContext), undefined, {
        userId: state.userId,
      });
      const searchQuery = text.trim() || state.searchQuery;
      return {
        input: { previousSearchQuery: state.searchQuery, retryCount },
        output: { searchQuery },
        update: { retryCount, searchQuery },
      };
    },
  );

  const generateAnswer = withStep<{ question: string; retrievedCount: number }>(
    AgentStepName.GENERATE,
    async (state) => {
      const context = buildContextText(state.retrieved);
      const messages = buildAnswerPrompt(context, state.question);
      const { text } = await ai.chat(messages, undefined, { userId: state.userId });
      const citations = state.retrieved.map(toCitation);
      const confidence = parseConfidence(text);
      return {
        input: { question: state.question, retrievedCount: state.retrieved.length },
        output: { answer: text, confidence },
        update: { answer: text, citations, confidence },
      };
    },
  );

  const verifyAnswer = withStep<{ answer: string }>(AgentStepName.VERIFY, async (state) => {
    const context = buildContextText(state.retrieved);
    const { text } = await ai.chat(buildVerifierPrompt(state.question, context, state.answer), undefined, {
      userId: state.userId,
    });
    const grounded = /\bGROUNDED\b/i.test(text) && !/\bUNGROUNDED\b/i.test(text);
    const confidence = grounded ? state.confidence : Confidence.LOW;
    return {
      input: { answer: state.answer },
      output: { verified: grounded, raw: text },
      update: { verified: grounded, confidence },
    };
  });

  const finalResponse = withStep<{ answer: string; confidence: Confidence }>(
    AgentStepName.FINAL,
    async (state) => {
      return {
        input: { answer: state.answer, confidence: state.confidence },
        output: { answer: state.answer, confidence: state.confidence },
        update: {},
      };
    },
  );

  return {
    classifyQuestion,
    rewriteQuery,
    retrieveContext,
    evaluateContext,
    retryRetrieval,
    generateAnswer,
    verifyAnswer,
    finalResponse,
  };
}
