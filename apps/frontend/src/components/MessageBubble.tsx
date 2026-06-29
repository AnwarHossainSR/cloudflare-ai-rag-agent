import { Confidence, SourceCitation } from '../api/rag';
import { SourceCitationList } from './SourceCitationList';
import { StatusBadge } from './StatusBadge';

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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <article
      className={`rounded-md border p-4 ${
        isUser ? 'border-cyan-700/20 bg-cyan-700/5' : 'border-line bg-panel'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          {isUser ? 'You' : 'DevDocs AI'}
        </span>
        {message.confidence ? <StatusBadge label={message.confidence} /> : null}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p>
      {message.citations ? <SourceCitationList citations={message.citations} /> : null}
    </article>
  );
}
