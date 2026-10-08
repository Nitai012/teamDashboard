import { describe, expect, it } from 'vitest';
import { average, averageScores, clampScore, normalizeScores } from './scores.js';
import { assessmentInputSchema, backupSchema, memberInputSchema } from './schemas.js';

describe('scores', () => {
  it('clamps and rounds into 1..10', () => {
    expect(clampScore(0)).toBe(1);
    expect(clampScore(11)).toBe(10);
    expect(clampScore(6.6)).toBe(7);
    expect(clampScore('x')).toBe(5);
  });

  it('normalizes to six axes', () => {
    expect(normalizeScores([3, 12])).toEqual([3, 10, 5, 5, 5, 5]);
    expect(normalizeScores(null)).toEqual([5, 5, 5, 5, 5, 5]);
  });

  it('averages per axis', () => {
    expect(average([])).toBe(0);
    expect(
      averageScores([
        [2, 4, 6, 8, 10, 1],
        [4, 4, 4, 4, 4, 4],
      ]),
    ).toEqual([3, 4, 5, 6, 7, 2.5]);
  });
});

describe('schemas', () => {
  it('trims and defaults member input', () => {
    expect(memberInputSchema.parse({ name: '  נועה  ' })).toEqual({
      name: 'נועה',
      role: '',
      startDate: null,
      releaseDate: null,
      notes: '',
      personalAxis: '',
    });
  });

  it('rejects impossible dates and out-of-range scores', () => {
    expect(memberInputSchema.safeParse({ name: 'x', releaseDate: '2026-02-31' }).success).toBe(
      false,
    );
    expect(assessmentInputSchema.safeParse({ scores: [1, 2, 3, 4, 5, 11] }).success).toBe(false);
    expect(assessmentInputSchema.safeParse({ scores: [1, 2, 3] }).success).toBe(false);
  });

  it('accepts the original single-page backup format', () => {
    const legacy = {
      app: 'team-radar',
      version: 2,
      axes: ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
      members: [
        {
          id: 'm1',
          name: 'חבר צוות',
          expertise: ['React'],
          otherLabel: 'Networking',
          startDate: '',
        },
      ],
      assessments: [
        { id: 'a1', memberId: 'm1', kind: 'self', date: '2026-10-06', scores: [7, 6, 7, 8, 5, 6] },
      ],
    };
    expect(backupSchema.safeParse(legacy).success).toBe(true);
  });
});
