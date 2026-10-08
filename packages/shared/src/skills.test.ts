import { describe, expect, it } from 'vitest';
import { type SkillLevel } from './constants.js';
import { type CoverageMember, rankCoverage, skillCoverage, trainingCandidates } from './skills.js';

const today = '2026-10-08';
const SIX_MONTHS = 183;

function member(
  id: string,
  releaseDate: string | null,
  skills: Record<string, SkillLevel | [SkillLevel, boolean]> = {},
): CoverageMember {
  return {
    id,
    name: id,
    releaseDate,
    skills: Object.entries(skills).map(([skillId, value]) => {
      const [level, inTraining] = Array.isArray(value) ? value : [value, false];
      return { skillId, level, inTraining };
    }),
  };
}

describe('skillCoverage', () => {
  it('is covered when two capable soldiers stay', () => {
    const team = [member('a', '2028-01-01', { k8s: 2 }), member('b', null, { k8s: 3 })];
    expect(skillCoverage('k8s', team, today, SIX_MONTHS)).toMatchObject({
      status: 'covered',
      severity: 'ok',
    });
  });

  it('flags a single holder as a warning', () => {
    const team = [member('a', '2028-01-01', { k8s: 3 }), member('b', null, { k8s: 1 })];
    expect(skillCoverage('k8s', team, today, SIX_MONTHS).status).toBe('single');
  });

  it('is critical when every holder leaves within the horizon', () => {
    const team = [member('devops', '2026-12-20', { ops: 3 }), member('new', null, { ops: 0 })];
    const coverage = skillCoverage('ops', team, today, SIX_MONTHS);
    expect(coverage.status).toBe('leaving');
    expect(coverage.severity).toBe('critical');
    expect(coverage.leaving.map((m) => m.id)).toEqual(['devops']);
  });

  it('downgrades to a warning once a replacement is in training', () => {
    const team = [
      member('devops', '2026-12-20', { ops: 3 }),
      member('new', null, { ops: [1, true] }),
    ];
    expect(skillCoverage('ops', team, today, SIX_MONTHS).status).toBe('training');
  });

  it('ignores soldiers who already left', () => {
    const team = [member('gone', '2026-01-01', { ops: 3 })];
    expect(skillCoverage('ops', team, today, SIX_MONTHS).status).toBe('uncovered');
  });

  it('treats learners as not capable', () => {
    const team = [member('a', null, { ops: 1 })];
    expect(skillCoverage('ops', team, today, SIX_MONTHS).capableNow).toHaveLength(0);
  });
});

describe('rankCoverage', () => {
  it('lists the riskiest skills first', () => {
    const team = [
      member('a', null, { safe: 3, single: 3 }),
      member('b', null, { safe: 2 }),
      member('c', '2026-11-01', { risky: 3 }),
    ];
    expect(
      rankCoverage(['safe', 'single', 'risky'], team, today, SIX_MONTHS).map((c) => c.skillId),
    ).toEqual(['risky', 'single', 'safe']);
  });
});

describe('trainingCandidates', () => {
  it('prefers trainees, then level, then the longest remaining service', () => {
    const team = [
      member('leaving', '2026-11-01', { ops: 0 }),
      member('expert', null, { ops: 3 }),
      member('short', '2027-06-01', { ops: 1 }),
      member('long', '2028-06-01', { ops: 1 }),
      member('fresh', null, {}),
      member('trainee', '2027-08-01', { ops: [0, true] }),
    ];
    expect(trainingCandidates('ops', team, today, SIX_MONTHS).map((m) => m.id)).toEqual([
      'trainee',
      'long',
      'short',
      'fresh',
    ]);
  });
});
