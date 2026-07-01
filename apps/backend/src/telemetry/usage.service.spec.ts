import { UsageService } from './usage.service';

describe('UsageService', () => {
  it('records usage and computes estimated cost from model token rates', async () => {
    const repo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => ({ id: 'usage-1', ...row })),
    };
    const service = new UsageService(repo as any);

    const saved = await service.record({
      userId: 'user-1',
      model: '@cf/meta/llama-3.2-3b-instruct',
      operation: 'chat',
      usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 },
    });

    expect(repo.create).toHaveBeenCalledWith({
      userId: 'user-1',
      model: '@cf/meta/llama-3.2-3b-instruct',
      operation: 'chat',
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      estimatedCostUsd: '0.00022100',
    });
    expect(repo.save).toHaveBeenCalledWith(repo.create.mock.results[0].value);
    expect(saved.id).toBe('usage-1');
  });
});
