export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export type AiOperation = 'embed' | 'chat';

export interface AiUsageContext {
  userId?: string;
}

export interface UsageRecorder {
  record(entry: {
    userId?: string;
    model: string;
    operation: AiOperation;
    usage?: TokenUsage;
  }): Promise<unknown>;
}

export const USAGE_RECORDER = Symbol('USAGE_RECORDER');
