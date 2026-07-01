import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiOperation, TokenUsage, UsageRecorder } from '../cloudflare-ai/types';
import { AiUsage } from './entities/ai-usage.entity';

const PER_MILLION_TOKEN_USD: Record<string, { input: number; output: number }> = {
  '@cf/meta/llama-3.2-3b-instruct': { input: 0.051, output: 0.34 },
  '@cf/baai/bge-large-en-v1.5': { input: 0.2, output: 0 },
};

@Injectable()
export class UsageService implements UsageRecorder {
  constructor(@InjectRepository(AiUsage) private readonly usage: Repository<AiUsage>) {}

  record(entry: {
    userId?: string;
    model: string;
    operation: AiOperation;
    usage?: TokenUsage;
  }): Promise<AiUsage> {
    const promptTokens = entry.usage?.prompt_tokens ?? 0;
    const completionTokens = entry.usage?.completion_tokens ?? 0;
    const totalTokens = entry.usage?.total_tokens ?? promptTokens + completionTokens;

    return this.usage.save(
      this.usage.create({
        userId: entry.userId ?? null,
        model: entry.model,
        operation: entry.operation,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd: estimateCost(entry.model, promptTokens, completionTokens),
      }),
    );
  }
}

function estimateCost(model: string, promptTokens: number, completionTokens: number): string {
  const rates = PER_MILLION_TOKEN_USD[model] ?? { input: 0, output: 0 };
  const cost = (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output;
  return cost.toFixed(8);
}
