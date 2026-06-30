import { FormEvent, useState } from 'react';
import { useAgentQuery } from '../api/agents';
import { useMessages, usePostMessage } from '../api/chat';
import { useUiStore } from '../stores/ui';
import { LoadingState } from './LoadingState';
import { ChatMessage, MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  sessionId?: string;
}

const SUGGESTED_PROMPTS = [
  "What's in my knowledge base?",
  'Summarize my most recently uploaded document.',
  'List the key topics covered across my documents.',
];

let localMessageCounter = 0;
function nextLocalId() {
  localMessageCounter += 1;
  return `agent-local-${Date.now()}-${localMessageCounter}`;
}

export function ChatWindow({ sessionId }: ChatWindowProps) {
  const agentMode = useUiStore((s) => s.agentMode);
  const setAgentMode = useUiStore((s) => s.setAgentMode);

  const messages = useMessages(sessionId);
  const postMessage = usePostMessage(sessionId ?? '');
  const agentQuery = useAgentQuery();

  const [question, setQuestion] = useState('');
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);

  const isPending = agentMode ? agentQuery.isPending : postMessage.isPending;

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    if (agentMode) {
      const userMessage: ChatMessage = { id: nextLocalId(), role: 'user', content: trimmed };
      setAgentMessages((prev) => [...prev, userMessage]);
      setQuestion('');
      try {
        const result = await agentQuery.mutateAsync({ question: trimmed, sessionId });
        const assistantMessage: ChatMessage = {
          id: nextLocalId(),
          role: 'assistant',
          content: result.answer,
          confidence: result.confidence,
          citations: result.citations,
          runId: result.runId,
        };
        setAgentMessages((prev) => [...prev, assistantMessage]);
      } catch {
        // Error surfaced via agentQuery.isError below; keep the user's message visible.
      }
      return;
    }

    if (!sessionId) return;
    await postMessage.mutateAsync(trimmed);
    setQuestion('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send(question);
  }

  const persistedMessages: ChatMessage[] = (messages.data ?? []).map((message) => ({
    ...message,
    confidence: message.confidence ?? undefined,
  }));

  const renderedMessages = agentMode ? agentMessages : persistedMessages;
  const canSend = agentMode ? !isPending : Boolean(sessionId) && !isPending;

  return (
    <section className="ui-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="ui-eyebrow inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-accent">
          <span aria-hidden="true">◆</span> {agentMode ? 'Agent mode' : 'Grounded RAG'}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            {agentMode
              ? 'Runs the multi-step LangGraph agent; not saved to chat history.'
              : 'Answers cite retrieved chunks when context exists.'}
          </span>
          <button
            aria-pressed={agentMode}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-ring ${
              agentMode
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-secondary hover:border-accent/40 hover:text-ink'
            }`}
            onClick={() => setAgentMode(!agentMode)}
            type="button"
          >
            {agentMode ? 'Agent mode: On' : 'Agent mode: Off'}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {!agentMode && messages.isLoading ? (
          <LoadingState label="Loading chat" />
        ) : renderedMessages.length ? (
          <div className="mx-auto max-w-3xl space-y-5">
            {renderedMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-lg border border-dashed border-line bg-paper p-8 text-center">
            <div>
              <h2 className="text-base font-semibold text-ink">
                {agentMode ? 'Ask the agent' : 'Ask from your documents'}
              </h2>
              <p className="mt-1 text-sm text-secondary">
                {agentMode
                  ? 'The agent classifies, retrieves, verifies, and answers in multiple steps. Open the run details to see the full timeline.'
                  : sessionId
                    ? 'Answers use retrieved chunks and show citations when context exists.'
                    : 'Create or select a chat to start asking from your documents.'}
              </p>
            </div>
            {agentMode || sessionId ? (
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-secondary transition hover:border-accent/50 hover:text-ink"
                    disabled={isPending}
                    key={prompt}
                    onClick={() => void send(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form className="flex flex-col gap-2 border-t border-line px-5 py-4" onSubmit={submit}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="rag-question">
            Question
          </label>
          <input
            id="rag-question"
            className="ui-input flex-1"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={!canSend}
            placeholder={agentMode ? 'Ask the agent a question' : 'Ask a question from uploaded docs'}
          />
          <button type="submit" disabled={!canSend} className="ui-button-primary disabled:opacity-60">
            {isPending ? (
              <LoadingState className="text-white" label={agentMode ? 'Running agent' : 'Searching'} />
            ) : (
              'Send'
            )}
          </button>
        </div>
        {!agentMode && postMessage.isError ? (
          <p className="text-sm font-medium text-danger">Question failed. Try again.</p>
        ) : null}
        {agentMode && agentQuery.isError ? (
          <p className="text-sm font-medium text-danger">Agent run failed. Try again.</p>
        ) : null}
      </form>
    </section>
  );
}
