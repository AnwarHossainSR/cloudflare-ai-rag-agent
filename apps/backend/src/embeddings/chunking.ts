import { getEncoding } from 'js-tiktoken';

const enc = getEncoding('cl100k_base');

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
}

export function chunkText(
  text: string,
  opts?: { chunkTokens?: number; overlapTokens?: number },
): TextChunk[] {
  const chunkTokens = opts?.chunkTokens ?? 850;
  const overlap = opts?.overlapTokens ?? 120;
  const step = Math.max(1, chunkTokens - overlap);
  const tokens = enc.encode(text);
  const out: TextChunk[] = [];

  for (let start = 0, index = 0; start < tokens.length; start += step, index++) {
    const window = tokens.slice(start, start + chunkTokens);
    const content = enc.decode(window).trim();
    if (content) out.push({ content, index, tokenCount: window.length });
    if (start + chunkTokens >= tokens.length) break;
  }

  return out.length ? out : [{ content: text.trim(), index: 0, tokenCount: tokens.length }];
}
