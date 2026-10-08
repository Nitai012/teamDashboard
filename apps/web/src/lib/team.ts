import { type AssessmentDto, type MemberDto, PERSONAL_AXIS_INDEX } from '@team-radar/shared';

/** Placements for one soldier, oldest first. */
export function placementsFor(
  memberId: string,
  assessments: readonly AssessmentDto[],
): AssessmentDto[] {
  return assessments
    .filter((a) => a.memberId === memberId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

/** The most recent placement of every soldier. */
export function latestPlacements(
  assessments: readonly AssessmentDto[],
): Map<string, AssessmentDto> {
  const latest = new Map<string, AssessmentDto>();
  for (const a of assessments) {
    const current = latest.get(a.memberId);
    if (!current || a.date > current.date) latest.set(a.memberId, a);
  }
  return latest;
}

/** Axis labels for one soldier, with their personal sixth axis. */
export function axisLabelsFor(
  member: Pick<MemberDto, 'personalAxis'>,
  axes: readonly string[],
): string[] {
  const labels = [...axes];
  if (member.personalAxis) labels[PERSONAL_AXIS_INDEX] = member.personalAxis;
  return labels;
}

/** Axis labels for team-wide views, where the sixth axis differs per soldier. */
export function teamAxisLabels(axes: readonly string[]): string[] {
  const labels = [...axes];
  labels[PERSONAL_AXIS_INDEX] = 'ציר אישי';
  return labels;
}

/** The label a placement was made with. */
export function placementPersonalAxis(assessment: AssessmentDto, axes: readonly string[]): string {
  return assessment.personalAxis || axes[PERSONAL_AXIS_INDEX] || '';
}
