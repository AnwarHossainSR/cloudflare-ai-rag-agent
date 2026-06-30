import { FormEvent, useState } from 'react';
import { useMessages, usePostMessage } from '../api/chat';
import { LoadingState } from './LoadingState';
import { ChatMessage, MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  sessionId?: string;
}

export function ChatWindow({ sessionId }: ChatWindowProps) {
  const messages = useMessages(sessionId);
  const postMessage = usePostMessage(sessionId ?? '');
  const [question, setQuestion] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || !sessionId) return;

    await postMessage.mutateAsync(trimmed);
    setQuestion('');
  }

  const renderedMessages: ChatMessage[] = (messages.data ?? []).map((message) => ({
    ...message,
    confidence: message.confidence ?? undefined,
  }));

  return (
    <section className="ui-panel p-5">
      <div className="space-y-3">
        {messages.isLoading ? (
          <LoadingState label="Loading chat" />
        ) : renderedMessages.length ? (
          renderedMessages.map((message) => <MessageBubble key={message.id} message={message} />)
        ) : (
          <div className="rounded-md border border-dashed border-line bg-paper p-5">
            <h2 className="text-base font-semibold text-slate-950">Ask from your documents</h2>
            <p className="mt-1 text-sm text-slate-600">
              {sessionId
                ? 'Answers use retrieved chunks and show citations when context exists.'
                : 'Create or select a chat to start asking from your documents.'}
            </p>
          </div>
        )}
      </div>

      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <label className="sr-only" htmlFor="rag-question">
          Question
        </label>
        <input
          id="rag-question"
          className="min-h-11 flex-1 rounded-md border border-line px-3 py-2 text-ink focus-ring"
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
      </form>

      {postMessage.isError ? (
        <p className="mt-3 text-sm font-medium text-danger">Question failed. Try again.</p>
      ) : null}
    </section>
  );
}
