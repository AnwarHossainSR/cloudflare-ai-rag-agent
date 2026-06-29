import { Confidence } from '@devdocs/shared';
import { ChatMessage } from '../cloudflare-ai/types';

export const ANSWER_SYSTEM_PROMPT = `You are DevDocs AI Copilot, a careful technical assistant.
Answer the user using only the provided context.
If the context does not contain enough information, say that clearly.
Include source citations using document name and chunk number.
Keep the answer practical, concise, and useful for a software engineer.

Context:
{{retrieved_context}}

User question:
{{user_question}}`;

export function buildAnswerPrompt(context: string, question: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: ANSWER_SYSTEM_PROMPT.replace('{{retrieved_context}}', context).replace(
        '{{user_question}}',
        question,
      ),
    },
    { role: 'user', content: question },
  ];
}

export function parseConfidence(text: string): Confidence {
  const match = text.match(/\b(High|Medium|Low)\b/i)?.[1]?.toLowerCase();
  if (match === 'high') return Confidence.HIGH;
  if (match === 'low') return Confidence.LOW;
  return Confidence.MEDIUM;
}
