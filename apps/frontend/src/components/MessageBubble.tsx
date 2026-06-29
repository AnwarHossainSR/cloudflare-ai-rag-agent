import { Confidence, SourceCitation } from '../api/rag';
import { SourceCitationList } from './SourceCitationList';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: Confidence;
  citations?: SourceCitation[];
}

interface MessageBubbleProps {
  message: ChatMessage;
}

const confidenceStyles: Record<Confidence, string> = {
  High: 'bg-emerald-50 text-emerald-800',
  Medium: 'bg-amber-50 text-amber-800',
  Low: 'bg-red-50 text-red-800',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <article
      className={`rounded-lg border p-4 ${
        isUser ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-950">
          {isUser ? 'You' : 'DevDocs AI'}
        </span>
        {message.confidence ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${confidenceStyles[message.confidence]}`}>
            {message.confidence}
          </span>
        ) : null}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p>
      {message.citations ? <SourceCitationList citations={message.citations} /> : null}
    </article>
  );
}
