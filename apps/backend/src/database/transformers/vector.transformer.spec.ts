import { vectorTransformer } from './vector.transformer';

describe('vectorTransformer', () => {
  it('serializes a number array to a pgvector literal', () => {
    expect(vectorTransformer.to([0.1, 0.2, 0.3])).toBe('[0.1,0.2,0.3]');
  });
  it('parses a pgvector literal back to numbers', () => {
    expect(vectorTransformer.from('[0.1,0.2,0.3]')).toEqual([0.1, 0.2, 0.3]);
  });
  it('round-trips null', () => {
    expect(vectorTransformer.to(null as any)).toBeNull();
    expect(vectorTransformer.from(null as any)).toBeNull();
  });
});
