import { ChatMessage } from '../../cloudflare-ai/types';

/**
 * Shared agent rules, repeated across prompts so every model call is bound by them:
 * - never invent facts
 * - say clearly when the docs lack the answer
 * - cite document name + chunk number
 * - prefer retrieved context over model memory
 * - keep answers clear, practical, and developer-friendly
 */
const AGENT_RULES = `Rules you must always follow:
- Never invent facts. Only use information present in the provided context.
- If the context does not contain the answer, say so clearly instead of guessing.
- When citing information, reference the document name and chunk number.
- Prefer retrieved context over anything you might recall from training.
- Keep responses clear, practical, and developer-friendly.`;

export const CLASSIFIER_SYSTEM_PROMPT = `You are a question classifier for a developer documentation assistant.
${AGENT_RULES}

Classify the user's question into exactly one of these categories:
- simple: a quick factual question answerable in one sentence
- document: a question about the contents of a specific document
- technical: a question requiring technical/code-level explanation
- multi-step: a question requiring multiple steps or combining several pieces of context

Respond with only the category label, nothing else.`;

export function buildClassifierPrompt(question: string): ChatMessage[] {
  return [
    { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
    { role: 'user', content: question },
  ];
}

export const REWRITER_SYSTEM_PROMPT = `You rewrite user questions into search-optimized queries for a vector database of developer documentation.
${AGENT_RULES}

Produce a concise, keyword-rich search query capturing the user's intent. Respond with only the rewritten query, nothing else.`;

export function buildRewriterPrompt(question: string, retryContext?: string): ChatMessage[] {
  const userContent = retryContext
    ? `Original question: ${question}\n\nThe previous search query did not return sufficient context (${retryContext}). Produce a broader or differently-worded search query.`
    : question;
  return [
    { role: 'system', content: REWRITER_SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];
}

export const EVALUATOR_SYSTEM_PROMPT = `You evaluate whether retrieved documentation context is sufficient to answer a user's question.
${AGENT_RULES}

Respond with only one word: SUFFICIENT if the context contains enough information to answer accurately, or INSUFFICIENT if it does not.`;

export function buildEvaluatorPrompt(question: string, context: string): ChatMessage[] {
  return [
    { role: 'system', content: EVALUATOR_SYSTEM_PROMPT },
    { role: 'user', content: `Question:\n${question}\n\nRetrieved context:\n${context}` },
  ];
}

export const VERIFIER_SYSTEM_PROMPT = `You verify whether a generated answer is fully grounded in the provided documentation context.
${AGENT_RULES}

Respond starting with GROUNDED or UNGROUNDED, followed by a brief reason. An answer is GROUNDED only if every claim it makes is supported by the context. If the answer invents facts not present in the context, respond UNGROUNDED.`;

export function buildVerifierPrompt(question: string, context: string, answer: string): ChatMessage[] {
  return [
    { role: 'system', content: VERIFIER_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Question:\n${question}\n\nRetrieved context:\n${context}\n\nGenerated answer:\n${answer}`,
    },
  ];
}
