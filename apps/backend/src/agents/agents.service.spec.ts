import { NotFoundException } from '@nestjs/common';
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
  let runRepo: { save: jest.Mock; create: jest.Mock; findOne: jest.Mock; find: jest.Mock };
  let stepRepo: { save: jest.Mock; create: jest.Mock; find: jest.Mock };

  beforeEach(() => {
    runRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'run-1', ...data })),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    stepRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => data),
      find: jest.fn(),
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

  it('passes explicit document scope into graph retrieval', async () => {
    const ai = makeAi();
    const rag = {
      retrieve: jest.fn().mockResolvedValue([strongChunk]),
    } as unknown as jest.Mocked<Pick<RagService, 'retrieve'>>;

    const service = new AgentsService(
      ai as unknown as CloudflareAiService,
      rag as unknown as RagService,
      runRepo as any,
      stepRepo as any,
    );

    await (service.run as any)('user-1', 'How do I upload docs?', 'session-1', ['doc-1']);

    expect(rag.retrieve).toHaveBeenCalledWith('user-1', 'rewritten search query', undefined, [
      'doc-1',
    ]);
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

  describe('getRun', () => {
    function makeService() {
      const ai = makeAi();
      const rag = { retrieve: jest.fn() } as unknown as jest.Mocked<Pick<RagService, 'retrieve'>>;
      return new AgentsService(
        ai as unknown as CloudflareAiService,
        rag as unknown as RagService,
        runRepo as any,
        stepRepo as any,
      );
    }

    it('returns the run with its ordered steps when the run belongs to the requesting user', async () => {
      const run = { id: 'run-1', userId: 'user-1', question: 'How do I upload docs?' } as AgentRun;
      const steps = [
        { id: 'step-1', runId: 'run-1', name: 'classifyQuestion', order: 0 },
        { id: 'step-2', runId: 'run-1', name: 'finalResponse', order: 1 },
      ] as AgentStep[];
      runRepo.findOne.mockResolvedValue(run);
      stepRepo.find.mockResolvedValue(steps);

      const service = makeService();
      const result = await service.getRun('user-1', 'run-1');

      expect(runRepo.findOne).toHaveBeenCalledWith({ where: { id: 'run-1' } });
      expect(stepRepo.find).toHaveBeenCalledWith({
        where: { runId: 'run-1' },
        order: { order: 'ASC' },
      });
      expect(result).toEqual({ ...run, steps });
    });

    it('throws NotFoundException when the run does not exist', async () => {
      runRepo.findOne.mockResolvedValue(null);

      const service = makeService();

      await expect(service.getRun('user-1', 'missing-run')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(stepRepo.find).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the run exists but belongs to a different user', async () => {
      runRepo.findOne.mockResolvedValue({ id: 'run-1', userId: 'user-2' });

      const service = makeService();

      await expect(service.getRun('user-1', 'run-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(stepRepo.find).not.toHaveBeenCalled();
    });
  });

  it('lists recent runs owned by the requesting user', async () => {
    const ai = makeAi();
    const rag = { retrieve: jest.fn() } as unknown as jest.Mocked<Pick<RagService, 'retrieve'>>;
    const runs = [{ id: 'run-1', userId: 'user-1' }] as AgentRun[];
    runRepo.find.mockResolvedValue(runs);

    const service = new AgentsService(
      ai as unknown as CloudflareAiService,
      rag as unknown as RagService,
      runRepo as any,
      stepRepo as any,
    );

    await expect(service.listRuns('user-1')).resolves.toEqual(runs);
    expect(runRepo.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  });
});
