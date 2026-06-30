import { FormEvent, useState } from 'react';
import { useMessages, usePostMessage } from '../api/chat';
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

export function ChatWindow({ sessionId }: ChatWindowProps) {
  const messages = useMessages(sessionId);
  const postMessage = usePostMessage(sessionId ?? '');
  const [question, setQuestion] = useState('');

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || !sessionId) return;
    await postMessage.mutateAsync(trimmed);
    setQuestion('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send(question);
  }

  const renderedMessages: ChatMessage[] = (messages.data ?? []).map((message) => ({
    ...message,
    confidence: message.confidence ?? undefined,
  }));

  return (
    <section className="ui-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="ui-eyebrow inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-accent">
          <span aria-hidden="true">◆</span> Grounded RAG
        </span>
        <span className="text-xs text-muted">Answers cite retrieved chunks when context exists.</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.isLoading ? (
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
              <h2 className="text-base font-semibold text-ink">Ask from your documents</h2>
              <p className="mt-1 text-sm text-secondary">
                {sessionId
                  ? 'Answers use retrieved chunks and show citations when context exists.'
                  : 'Create or select a chat to start asking from your documents.'}
              </p>
            </div>
            {sessionId ? (
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-secondary transition hover:border-accent/50 hover:text-ink"
                    disabled={postMessage.isPending}
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
            disabled={!sessionId || postMessage.isPending}
            placeholder="Ask a question from uploaded docs"
          />
          <button
            type="submit"
            disabled={!sessionId || postMessage.isPending}
            className="ui-button-primary disabled:opacity-60"
          >
            {postMessage.isPending ? <LoadingState className="text-white" label="Searching" /> : 'Send'}
          </button>
        </div>
        {postMessage.isError ? <p className="text-sm font-medium text-danger">Question failed. Try again.</p> : null}
      </form>
    </section>
  );
}
