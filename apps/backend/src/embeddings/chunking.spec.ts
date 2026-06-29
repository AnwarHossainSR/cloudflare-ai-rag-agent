import { chunkText } from './chunking';

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const out = chunkText('hello world');
    expect(out).toHaveLength(1);
    expect(out[0].index).toBe(0);
    expect(out[0].content).toContain('hello world');
  });

  it('splits long text into overlapping windows with sequential indexes', () => {
    const long = Array.from({ length: 4000 }, (_, i) => `word${i}`).join(' ');
    const out = chunkText(long, { chunkTokens: 200, overlapTokens: 40 });
    expect(out.length).toBeGreaterThan(1);
    expect(out.map((c) => c.index)).toEqual(out.map((_, i) => i));
    expect(out.every((c) => c.tokenCount <= 200)).toBe(true);
  });
});
