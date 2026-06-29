import { FormEvent, useState } from 'react';
import { useRagQuery } from '../api/rag';
import { LoadingState } from './LoadingState';
import { ChatMessage, MessageBubble } from './MessageBubble';

export function ChatWindow() {
  const rag = useRagQuery();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion('');

    const answer = await rag.mutateAsync({ question: trimmed });
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: answer.answer,
        citations: answer.citations,
        confidence: answer.confidence,
      },
    ]);
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        {messages.length ? (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-[#eef3f1] p-5">
            <h2 className="text-base font-semibold text-slate-950">Ask from your documents</h2>
            <p className="mt-1 text-sm text-slate-600">
              Answers use retrieved chunks and show citations when context exists.
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
          className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-950 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question from uploaded docs"
        />
        <button
          type="submit"
          disabled={rag.isPending}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        >
          {rag.isPending ? <LoadingState className="text-white" label="Searching" /> : 'Send'}
        </button>
      </form>

      {rag.isError ? <p className="mt-3 text-sm font-medium text-red-700">Question failed. Try again.</p> : null}
    </section>
  );
}
