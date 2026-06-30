import { Confidence } from '@devdocs/shared';
import { CloudflareAiService } from '../cloudflare-ai/cloudflare-ai.service';
import { RagService, RetrievedChunk } from '../rag/rag.service';
import { AgentsService } from './agents.service';
import { AgentRun } from './entities/agent-run.entity';
import { AgentStep } from './entities/agent-step.entity';

type ChatMessage = { role: string; content: string };

const weakChunk: RetrievedChunk = {
  documentId: 'doc-1',
  documentName: 'guide.md',
  chunkIndex: 0,
  content: 'Unrelated low-relevance snippet.',
  score: 0.1,
};

const strongChunk: RetrievedChunk = {
  documentId: 'doc-1',
  documentName: 'guide.md',
  chunkIndex: 1,
  content: 'Upload docs with POST /documents/upload.',
  score: 0.9,
};

function promptText(messages: ChatMessage[]): string {
  return messages.map((m) => m.content).join(' ');
}

/**
 * Routes a mocked ai.chat call based on the system-prompt content, so the same
 * mock can serve every node in the graph (classify/rewrite/evaluate/generate/verify)
 * without relying on brittle call-count ordering across a looping graph.
 */
function makeAi(overrides: {
  evaluate?: () => string;
  generate?: () => string;
  verify?: () => string;
} = {}) {
  const chat = jest.fn(async (messages: ChatMessage[]) => {
    const text = promptText(messages);
    if (text.includes('question classifier')) {
      return { text: 'simple' };
    }
    if (text.includes('rewrite user questions')) {
      return { text: 'rewritten search query' };
    }
    if (text.includes('evaluate whether retrieved')) {
      return { text: overrides.evaluate ? overrides.evaluate() : 'SUFFICIENT' };
    }
    if (text.includes('verify whether a generated answer')) {
      return { text: overrides.verify ? overrides.verify() : 'GROUNDED - matches context.' };
    }
    if (text.includes('DevDocs AI Copilot')) {
      return { text: overrides.generate ? overrides.generate() : 'Grounded answer. Confidence: High' };
    }
    return { text: '' };
  });
  return { chat, embed: jest.fn().mockResolvedValue([[0.1]]) } as unknown as jest.Mocked<
    Pick<CloudflareAiService, 'chat' | 'embed'>
  >;
}

describe('AgentsService', () => {
  let runRepo: { save: jest.Mock; create: jest.Mock };
  let stepRepo: { save: jest.Mock; create: jest.Mock };

  beforeEach(() => {
    runRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'run-1', ...data })),
    };
    stepRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => data),
    };
  });

  it('retries retrieval when context starts weak, then produces a grounded answer and persists run + steps in order', async () => {
    const ai = makeAi();
    let retrieveCalls = 0;
    const rag = {
      retrieve: jest.fn(async () => {
        retrieveCalls += 1;
        return retrieveCalls === 1 ? [weakChunk] : [strongChunk];
      }),
    } as unknown as jest.Mocked<Pick<RagService, 'retrieve'>>;

    const service = new AgentsService(
      ai as unknown as CloudflareAiService,
      rag as unknown as RagService,
      runRepo as any,
      stepRepo as any,
    );

    const result = await service.run('user-1', 'How do I upload docs?', 'session-1');

    expect(rag.retrieve).toHaveBeenCalledTimes(2);
    expect(result.confidence).toBe(Confidence.HIGH);
    expect(result.answer).toContain('Grounded answer');
    expect(result.citations).toEqual([
      {
        documentId: 'doc-1',
        documentName: 'guide.md',
        chunkIndex: 1,
        score: 0.9,
        snippet: 'Upload docs with POST /documents/upload.',
      },
    ]);
    expect(result.runId).toBe('run-1');

    // run persisted as completed
    expect(runRepo.save).toHaveBeenCalledTimes(1);
    const savedRun = runRepo.save.mock.calls[0][0];
    expect(savedRun.status).toBe('completed');
    expect(savedRun.userId).toBe('user-1');
    expect(savedRun.sessionId).toBe('session-1');
    expect(savedRun.question).toBe('How do I upload docs?');
    expect(savedRun.finalAnswer).toContain('Grounded answer');
    expect(savedRun.confidence).toBe(Confidence.HIGH);
    expect(savedRun.retryCount).toBeLessThanOrEqual(2);

    // steps persisted in order with correct runId
    expect(stepRepo.save).toHaveBeenCalledTimes(1);
    const savedSteps = stepRepo.save.mock.calls[0][0];
    expect(Array.isArray(savedSteps)).toBe(true);
    expect(savedSteps.length).toBeGreaterThan(0);
    savedSteps.forEach((step: Partial<AgentStep>, idx: number) => {
      expect(step.runId).toBe('run-1');
      expect(step.order).toBe(idx);
    });
    expect(result.steps).toEqual(savedSteps);

    // step names appear in the expected pipeline order, retry included
    const names = savedSteps.map((s: Partial<AgentStep>) => s.name);
    expect(names[0]).toBe('classifyQuestion');
    expect(names[1]).toBe('rewriteQuery');
    expect(names).toContain('retryRetrieval');
    expect(names[names.length - 1]).toBe('finalResponse');
  });

  it('terminates with a low-confidence "not enough information" style answer when context never improves', async () => {
    const ai = makeAi({
      evaluate: () => 'INSUFFICIENT',
      generate: () => 'The documents do not contain enough information to answer this question. Confidence: Low',
      verify: () => 'UNGROUNDED - no supporting context.',
    });
    const rag = {
      retrieve: jest.fn().mockResolvedValue([weakChunk]),
    } as unknown as jest.Mocked<Pick<RagService, 'retrieve'>>;

    const service = new AgentsService(
      ai as unknown as CloudflareAiService,
      rag as unknown as RagService,
      runRepo as any,
      stepRepo as any,
    );

    const result = await service.run('user-1', 'What is the meaning of life?');

    expect(result.confidence).toBe(Confidence.LOW);
    expect(result.answer).toMatch(/do not contain enough information/i);

    const savedRun = runRepo.save.mock.calls[0][0];
    expect(savedRun.status).toBe('completed');
    expect(savedRun.retryCount).toBeLessThanOrEqual(2);
    expect(savedRun.confidence).toBe(Confidence.LOW);
  });

  it('persists a failed run and rethrows when the graph invocation throws', async () => {
    const ai = makeAi();
    const rag = {
      retrieve: jest.fn().mockRejectedValue(new Error('db unavailable')),
    } as unknown as jest.Mocked<Pick<RagService, 'retrieve'>>;

    const service = new AgentsService(
      ai as unknown as CloudflareAiService,
      rag as unknown as RagService,
      runRepo as any,
      stepRepo as any,
    );

    await expect(service.run('user-1', 'Will this fail?')).rejects.toThrow('db unavailable');

    expect(runRepo.save).toHaveBeenCalledTimes(1);
    const savedRun = runRepo.save.mock.calls[0][0];
    expect(savedRun.status).toBe('failed');
    expect(savedRun.userId).toBe('user-1');
    expect(savedRun.question).toBe('Will this fail?');
    expect(stepRepo.save).not.toHaveBeenCalled();
  });
});
