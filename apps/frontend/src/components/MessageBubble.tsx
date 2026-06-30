import { Link } from 'react-router-dom';
import { Confidence, SourceCitation } from '../api/rag';
import { SourceCitationList } from './SourceCitationList';
import { StatusBadge } from './StatusBadge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: Confidence;
  citations?: SourceCitation[];
  /** Present on agent-mode assistant messages; links to the persisted agent run. */
  runId?: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isUser ? 'bg-accent/15 text-accent' : 'bg-panel2 text-secondary'
        }`}
        aria-hidden="true"
      >
        {isUser ? 'You' : 'AI'}
      </span>
      <article
        className={`max-w-[75%] rounded-lg border p-4 ${
          isUser ? 'border-accent/20 bg-accent/5' : 'border-line bg-panel'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{isUser ? 'You' : 'DevDocs AI'}</span>
          {message.confidence ? <StatusBadge label={message.confidence} /> : null}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary">{message.content}</p>
        {message.citations ? <SourceCitationList citations={message.citations} /> : null}
        {message.runId ? (
          <Link
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            to={`/agents/${message.runId}`}
          >
            View run details →
          </Link>
        ) : null}
      </article>
    </div>
  );
}
