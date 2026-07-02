import { FocusEvent, useState } from 'react';

export interface LearningHintContent {
  title: string;
  body: string;
  bullets?: string[];
}

interface LearningHintProps {
  content: LearningHintContent;
}

export function LearningHint({ content }: LearningHintProps) {
  const [open, setOpen] = useState(false);

  function closeOnBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }

  return (
    <div
      className="relative"
      onBlur={closeOnBlur}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-expanded={open}
        aria-label="How this page works"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel2 text-xs font-bold text-accent transition hover:border-accent/50 hover:bg-accent/10 focus-ring"
        onClick={() => setOpen((value) => !value)}
        title="How this page works"
        type="button"
      >
        i
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-panel p-4 text-left shadow-xl"
          role="tooltip"
        >
          <p className="text-sm font-semibold text-ink">{content.title}</p>
          <p className="mt-1.5 text-sm leading-5 text-secondary">{content.body}</p>
          {content.bullets?.length ? (
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-muted">
              {content.bullets.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
