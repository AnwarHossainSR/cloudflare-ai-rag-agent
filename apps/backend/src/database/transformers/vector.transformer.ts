import { ValueTransformer } from 'typeorm';

export const vectorTransformer: ValueTransformer = {
  to: (value: number[] | null) => (value == null ? null : `[${value.join(',')}]`),
  from: (value: string | null) => (value == null ? null : (JSON.parse(value) as number[])),
};
