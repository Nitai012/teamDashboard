import { AXIS_COUNT, SCORE_DEFAULT, SCORE_MAX, SCORE_MIN } from './constants.js';

export function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return SCORE_DEFAULT;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(n)));
}

/** Coerces any input into exactly AXIS_COUNT valid scores. */
export function normalizeScores(input: unknown): number[] {
  const source = Array.isArray(input) ? input : [];
  return Array.from({ length: AXIS_COUNT }, (_, i) =>
    i < source.length ? clampScore(source[i]) : SCORE_DEFAULT,
  );
}

export function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Per-axis average across several score vectors. */
export function averageScores(vectors: readonly (readonly number[])[]): number[] {
  return Array.from({ length: AXIS_COUNT }, (_, axis) =>
    average(vectors.map((scores) => scores[axis] ?? SCORE_DEFAULT)),
  );
}
