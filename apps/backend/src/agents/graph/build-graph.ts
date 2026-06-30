import { StateGraph, START, END } from '@langchain/langgraph';
import { CloudflareAiService } from '../../cloudflare-ai/cloudflare-ai.service';
import { RagService } from '../../rag/rag.service';
import { createNodes } from './nodes';
import { AgentState } from './state';

type State = typeof AgentState.State;

export function buildAgentGraph(deps: { ai: CloudflareAiService; rag: RagService }) {
  const n = createNodes(deps);
  const g = new StateGraph(AgentState)
    .addNode('classifyQuestion', n.classifyQuestion)
    .addNode('rewriteQuery', n.rewriteQuery)
    .addNode('retrieveContext', n.retrieveContext)
    .addNode('evaluateContext', n.evaluateContext)
    .addNode('retryRetrieval', n.retryRetrieval)
    .addNode('generateAnswer', n.generateAnswer)
    .addNode('verifyAnswer', n.verifyAnswer)
    .addNode('finalResponse', n.finalResponse)
    .addEdge(START, 'classifyQuestion')
    .addEdge('classifyQuestion', 'rewriteQuery')
    .addEdge('rewriteQuery', 'retrieveContext')
    .addEdge('retrieveContext', 'evaluateContext')
    .addConditionalEdges(
      'evaluateContext',
      (s: State) => (s.contextSufficient || s.retryCount >= 2 ? 'generateAnswer' : 'retryRetrieval'),
      { generateAnswer: 'generateAnswer', retryRetrieval: 'retryRetrieval' },
    )
    .addEdge('retryRetrieval', 'retrieveContext')
    .addEdge('generateAnswer', 'verifyAnswer')
    .addConditionalEdges(
      'verifyAnswer',
      (s: State) => (s.verified || s.retryCount >= 2 ? 'finalResponse' : 'retryRetrieval'),
      { finalResponse: 'finalResponse', retryRetrieval: 'retryRetrieval' },
    )
    .addEdge('finalResponse', END);
  return g.compile();
}
