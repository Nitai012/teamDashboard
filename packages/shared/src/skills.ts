import { CAPABLE_LEVEL, type SkillLevel } from './constants.js';
import { daysOfServiceLeft, isLeavingWithin, isReleased, type Severity } from './dates.js';
import { type MemberDto } from './types.js';

export type CoverageMember = Pick<MemberDto, 'id' | 'name' | 'releaseDate' | 'skills'>;

export type CoverageStatus =
  /** Two or more capable soldiers remain after the horizon. */
  | 'covered'
  /** Exactly one capable soldier remains. */
  | 'single'
  /** Nobody capable remains, but someone who stays is in training. */
  | 'training'
  /** Capable soldiers exist today, but all of them leave within the horizon. */
  | 'leaving'
  /** Nobody on the team is capable. */
  | 'uncovered';

export interface SkillCoverage<M extends CoverageMember = CoverageMember> {
  skillId: string;
  status: CoverageStatus;
  severity: Severity;
  /** Capable (level >= CAPABLE_LEVEL) and still serving today. */
  capableNow: M[];
  /** Capable and still serving after the horizon. */
  capableAfter: M[];
  /** Capable but leaving within the horizon. */
  leaving: M[];
  /** Marked for training and still serving after the horizon. */
  trainees: M[];
}

export function skillLevel(member: CoverageMember, skillId: string): SkillLevel {
  return member.skills.find((s) => s.skillId === skillId)?.level ?? 0;
}

export function isInTraining(member: CoverageMember, skillId: string): boolean {
  return member.skills.some((s) => s.skillId === skillId && s.inTraining);
}

export function activeMembers<M extends CoverageMember>(members: readonly M[], today: string): M[] {
  return members.filter((m) => !isReleased(m.releaseDate, today));
}

const STATUS_SEVERITY: Record<CoverageStatus, Severity> = {
  covered: 'ok',
  single: 'warning',
  training: 'warning',
  leaving: 'critical',
  uncovered: 'critical',
};

export function skillCoverage<M extends CoverageMember>(
  skillId: string,
  members: readonly M[],
  today: string,
  horizonDays: number,
): SkillCoverage<M> {
  const active = activeMembers(members, today);
  const leavesSoon = (m: M) => isLeavingWithin(m.releaseDate, today, horizonDays);

  const capableNow = active.filter((m) => skillLevel(m, skillId) >= CAPABLE_LEVEL);
  const capableAfter = capableNow.filter((m) => !leavesSoon(m));
  const leaving = capableNow.filter(leavesSoon);
  const trainees = active.filter((m) => isInTraining(m, skillId) && !leavesSoon(m));

  let status: CoverageStatus;
  if (capableAfter.length >= 2) status = 'covered';
  else if (capableAfter.length === 1) status = 'single';
  else if (trainees.length > 0) status = 'training';
  else if (capableNow.length > 0) status = 'leaving';
  else status = 'uncovered';

  return {
    skillId,
    status,
    severity: STATUS_SEVERITY[status],
    capableNow,
    capableAfter,
    leaving,
    trainees,
  };
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, ok: 2 };

/** Coverage for every skill, most at-risk first. */
export function rankCoverage<M extends CoverageMember>(
  skillIds: readonly string[],
  members: readonly M[],
  today: string,
  horizonDays: number,
): SkillCoverage<M>[] {
  return skillIds
    .map((id) => skillCoverage(id, members, today, horizonDays))
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.leaving.length - a.leaving.length,
    );
}

/**
 * Who to train in a skill: soldiers who stay past the horizon and are not yet
 * capable. Already-in-training first, then the most advanced, then whoever
 * serves the longest.
 */
export function trainingCandidates<M extends CoverageMember>(
  skillId: string,
  members: readonly M[],
  today: string,
  horizonDays: number,
): M[] {
  return activeMembers(members, today)
    .filter(
      (m) =>
        !isLeavingWithin(m.releaseDate, today, horizonDays) &&
        skillLevel(m, skillId) < CAPABLE_LEVEL,
    )
    .sort(
      (a, b) =>
        Number(isInTraining(b, skillId)) - Number(isInTraining(a, skillId)) ||
        skillLevel(b, skillId) - skillLevel(a, skillId) ||
        daysOfServiceLeft(b.releaseDate, today) - daysOfServiceLeft(a.releaseDate, today),
    );
}
