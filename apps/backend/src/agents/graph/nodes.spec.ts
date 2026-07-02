import { AgentStepName, Confidence } from '@devdocs/shared';
import { CloudflareAiService } from '../../cloudflare-ai/cloudflare-ai.service';
import { RagService, RetrievedChunk } from '../../rag/rag.service';
import { createNodes } from './nodes';
import { AgentState } from './state';

type State = typeof AgentState.State;

function baseState(overrides: Partial<State> = {}): State {
  return {
    userId: 'user-1',
    question: 'How do I upload docs?',
    documentIds: [],
    classification: '',
    searchQuery: '',
    retrieved: [],
    contextSufficient: false,
    retryCount: 0,
    answer: '',
    citations: [],
    confidence: Confidence.MEDIUM,
    verified: false,
    steps: [],
    ...overrides,
  };
}

const sampleChunk: RetrievedChunk = {
  documentId: 'doc-1',
  documentName: 'guide.md',
  chunkIndex: 0,
  content: 'Upload docs with POST /documents/upload.',
  score: 0.9,
};

describe('agent graph nodes', () => {
  let ai: jest.Mocked<Pick<CloudflareAiService, 'chat' | 'embed'>>;
  let rag: jest.Mocked<Pick<RagService, 'retrieve'>>;
  let nodes: ReturnType<typeof createNodes>;

  beforeEach(() => {
    ai = {
      chat: jest.fn().mockResolvedValue({ text: '' }),
      embed: jest.fn().mockResolvedValue([[0.1]]),
    };
    rag = {
      retrieve: jest.fn().mockResolvedValue([]),
    };
    nodes = createNodes({
      ai: ai as unknown as CloudflareAiService,
      rag: rag as unknown as RagService,
    });
  });

  describe('classifyQuestion', () => {
    it('maps model output to a known classification and logs one step', async () => {
      ai.chat.mockResolvedValue({ text: 'technical' });

      const update = await nodes.classifyQuestion(baseState());

      expect(update.classification).toBe('technical');
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.CLASSIFY);
      expect(update.steps![0].input).toBeDefined();
      expect(update.steps![0].output).toBeDefined();
      expect(typeof update.steps![0].latencyMs).toBe('number');
    });

    it('falls back to "simple" when the model output does not match a known category', async () => {
      ai.chat.mockResolvedValue({ text: 'something unexpected' });

      const update = await nodes.classifyQuestion(baseState());

      expect(update.classification).toBe('simple');
    });

    it.each(['simple', 'document', 'technical', 'multi-step'])(
      'recognizes "%s" classification',
      async (label) => {
        ai.chat.mockResolvedValue({ text: `Classification: ${label}` });

        const update = await nodes.classifyQuestion(baseState());

        expect(update.classification).toBe(label);
      },
    );
  });

  describe('rewriteQuery', () => {
    it('sets searchQuery from the model output and logs one step', async () => {
      ai.chat.mockResolvedValue({ text: 'upload documents endpoint API' });

      const update = await nodes.rewriteQuery(baseState());

      expect(update.searchQuery).toBe('upload documents endpoint API');
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.REWRITE);
    });

    it('falls back to the raw question if the model returns empty text', async () => {
      ai.chat.mockResolvedValue({ text: '   ' });

      const update = await nodes.rewriteQuery(baseState({ question: 'raw question?' }));

      expect(update.searchQuery).toBe('raw question?');
    });
  });

  describe('retrieveContext', () => {
    it('calls rag.retrieve(userId, searchQuery) and stores chunks', async () => {
      rag.retrieve.mockResolvedValue([sampleChunk]);

      const update = await nodes.retrieveContext(
        baseState({ userId: 'user-9', searchQuery: 'upload api' }),
      );

      expect(rag.retrieve).toHaveBeenCalledWith('user-9', 'upload api', undefined, []);
      expect(update.retrieved).toEqual([sampleChunk]);
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.RETRIEVE);
    });

    it('passes selected document ids to RAG retrieval', async () => {
      await nodes.retrieveContext(
        baseState({ userId: 'user-9', searchQuery: 'upload api', documentIds: ['doc-1'] } as any),
      );

      expect(rag.retrieve).toHaveBeenCalledWith('user-9', 'upload api', undefined, ['doc-1']);
    });
  });

  describe('evaluateContext', () => {
    it('sets contextSufficient=false when chunks are empty, without calling the model', async () => {
      const update = await nodes.evaluateContext(baseState({ retrieved: [] }));

      expect(update.contextSufficient).toBe(false);
      expect(ai.chat).not.toHaveBeenCalled();
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.EVALUATE);
    });

    it('sets contextSufficient=false when the top score is below the threshold, without calling the model', async () => {
      const update = await nodes.evaluateContext(
        baseState({ retrieved: [{ ...sampleChunk, score: 0.1 }] }),
      );

      expect(update.contextSufficient).toBe(false);
      expect(ai.chat).not.toHaveBeenCalled();
    });

    it('asks the model when the heuristic is inconclusive and respects SUFFICIENT', async () => {
      ai.chat.mockResolvedValue({ text: 'SUFFICIENT' });

      const update = await nodes.evaluateContext(
        baseState({ retrieved: [{ ...sampleChunk, score: 0.8 }] }),
      );

      expect(ai.chat).toHaveBeenCalled();
      expect(update.contextSufficient).toBe(true);
    });

    it('asks the model when the heuristic is inconclusive and respects INSUFFICIENT', async () => {
      ai.chat.mockResolvedValue({ text: 'INSUFFICIENT' });

      const update = await nodes.evaluateContext(
        baseState({ retrieved: [{ ...sampleChunk, score: 0.8 }] }),
      );

      expect(ai.chat).toHaveBeenCalled();
      expect(update.contextSufficient).toBe(false);
    });
  });

  describe('retryRetrieval', () => {
    it('increments retryCount and rewrites the query', async () => {
      ai.chat.mockResolvedValue({ text: 'broader upload docs query' });

      const update = await nodes.retryRetrieval(
        baseState({ retryCount: 1, searchQuery: 'upload api' }),
      );

      expect(update.retryCount).toBe(2);
      expect(update.searchQuery).toBe('broader upload docs query');
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.RETRY);

      const [messages] = ai.chat.mock.calls[0];
      const promptText = messages.map((m: { content: string }) => m.content).join(' ');
      expect(promptText).toContain('upload api');
    });
  });

  describe('generateAnswer', () => {
    it('builds the grounded prompt from retrieved chunks and sets answer + citations', async () => {
      ai.chat.mockResolvedValue({ text: 'You can upload via POST /documents/upload. Confidence: High' });

      const update = await nodes.generateAnswer(
        baseState({ question: 'How do I upload docs?', retrieved: [sampleChunk] }),
      );

      expect(update.answer).toContain('upload via POST /documents/upload');
      expect(update.citations).toEqual([
        {
          documentId: 'doc-1',
          documentName: 'guide.md',
          chunkIndex: 0,
          score: 0.9,
          snippet: 'Upload docs with POST /documents/upload.',
        },
      ]);
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.GENERATE);

      const [messages] = ai.chat.mock.calls[0];
      expect(messages[0].content).toContain('You are DevDocs AI Copilot');
      expect(messages[0].content).toContain('[Doc: guide.md #0]');
    });

    it('handles no retrieved chunks gracefully', async () => {
      ai.chat.mockResolvedValue({ text: 'The documents do not contain enough information.' });

      const update = await nodes.generateAnswer(baseState({ retrieved: [] }));

      expect(update.citations).toEqual([]);
      expect(update.answer).toContain('do not contain enough information');
    });
  });

  describe('verifyAnswer', () => {
    it('sets verified=true and keeps confidence when GROUNDED', async () => {
      ai.chat.mockResolvedValue({ text: 'GROUNDED - the answer matches the cited chunks.' });

      const update = await nodes.verifyAnswer(
        baseState({
          answer: 'You can upload via POST /documents/upload.',
          retrieved: [sampleChunk],
          confidence: Confidence.HIGH,
        }),
      );

      expect(update.verified).toBe(true);
      expect(update.confidence).toBe(Confidence.HIGH);
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.VERIFY);
    });

    it('sets verified=false and downgrades confidence when UNGROUNDED', async () => {
      ai.chat.mockResolvedValue({ text: 'UNGROUNDED - the answer invents details not in context.' });

      const update = await nodes.verifyAnswer(
        baseState({
          answer: 'Some unsupported claim.',
          retrieved: [sampleChunk],
          confidence: Confidence.HIGH,
        }),
      );

      expect(update.verified).toBe(false);
      expect(update.confidence).toBe(Confidence.LOW);
    });
  });

  describe('finalResponse', () => {
    it('passes through without calling ai or rag, logging one step', async () => {
      const update = await nodes.finalResponse(
        baseState({ answer: 'Final answer.', confidence: Confidence.HIGH }),
      );

      expect(ai.chat).not.toHaveBeenCalled();
      expect(rag.retrieve).not.toHaveBeenCalled();
      expect(update.steps).toHaveLength(1);
      expect(update.steps![0].name).toBe(AgentStepName.FINAL);
    });
  });
});
