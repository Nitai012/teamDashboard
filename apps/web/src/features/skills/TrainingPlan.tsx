import {
  isInTraining,
  type MemberDto,
  releaseStatus,
  type SkillCoverage,
  type SkillDto,
  skillLevel,
  SKILL_LEVELS,
  trainingCandidates,
} from '@team-radar/shared';
import { type CSSProperties } from 'react';
import { IconCheck } from '../../components/Icons';
import { Pill } from '../../components/Pill';
import { errorMessage } from '../../lib/api';
import { cx } from '../../lib/cx';
import { COVERAGE_LABEL, releaseShort, serviceLeftLabel } from '../../lib/format';
import { useSetMemberSkill } from '../../lib/queries';
import { useToast } from '../../lib/toast';
import styles from './SkillsPage.module.css';

const MAX_CANDIDATES = 3;

interface TrainingPlanProps {
  coverage: SkillCoverage<MemberDto>[];
  skillById: Map<string, SkillDto>;
  team: MemberDto[];
  today: string;
  horizon: number;
}

export function TrainingPlan({ coverage, skillById, team, today, horizon }: TrainingPlanProps) {
  const setSkill = useSetMemberSkill();
  const toast = useToast();
  const risky = coverage.filter((c) => c.status !== 'covered');

  if (risky.length === 0) {
    return (
      <p className={styles.allCovered}>
        <b>כל התחומים מכוסים.</b> בכל תחום יש לפחות שני חיילים עצמאיים שנשארים גם אחרי האופק.
      </p>
    );
  }

  const toggleTraining = (member: MemberDto, skillId: string, skillName: string) => {
    const inTraining = !isInTraining(member, skillId);
    setSkill.mutate(
      { memberId: member.id, skillId, input: { level: skillLevel(member, skillId), inTraining } },
      {
        onSuccess: () =>
          toast(inTraining ? `${member.name} סומן להכשרה ב־${skillName}` : 'סימון ההכשרה הוסר'),
        onError: (error) => toast(errorMessage(error), 'error'),
      },
    );
  };

  return (
    <ul className={styles.plan}>
      {risky.map((c, index) => {
        const name = skillById.get(c.skillId)?.name ?? '';
        const candidates = trainingCandidates(c.skillId, team, today, horizon).slice(
          0,
          MAX_CANDIDATES,
        );
        return (
          <li
            key={c.skillId}
            className={cx(styles.planItem, 'rise')}
            style={{ '--i': index } as CSSProperties}
          >
            <div className={styles.planHead}>
              <span className={styles.planSkill}>{name}</span>
              <Pill tone={c.severity}>{COVERAGE_LABEL[c.status]}</Pill>
            </div>
            <p className={styles.planText}>
              {c.leaving.length > 0 && (
                <>
                  עוזבים עם הידע:{' '}
                  {c.leaving.map((m, i) => {
                    const status = releaseStatus(m.releaseDate, today);
                    return (
                      <span key={m.id}>
                        {i > 0 && ', '}
                        <b>{m.name}</b> ({SKILL_LEVELS[skillLevel(m, c.skillId)]?.label}
                        {status ? `, ${releaseShort(status)}` : ''})
                      </span>
                    );
                  })}
                  .{' '}
                </>
              )}
              נשארים עצמאיים:{' '}
              {c.capableAfter.length ? (
                c.capableAfter.map((m, i) => (
                  <span key={m.id}>
                    {i > 0 && ', '}
                    <b>{m.name}</b>
                  </span>
                ))
              ) : (
                <b>אף אחד</b>
              )}
              .
            </p>
            <div className={styles.candidates}>
              <span className={styles.candidatesLabel}>
                {candidates.length ? 'מועמדים להכשרה:' : 'אין מועמדים שנשארים אחרי האופק.'}
              </span>
              {candidates.map((m) => {
                const active = isInTraining(m, c.skillId);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={cx(styles.candidate, active && styles.candidateOn)}
                    aria-pressed={active}
                    disabled={setSkill.isPending}
                    onClick={() => toggleTraining(m, c.skillId, name)}
                  >
                    {active && <IconCheck width={15} height={15} />}
                    <span>{m.name}</span>
                    <small>
                      {SKILL_LEVELS[skillLevel(m, c.skillId)]?.label} ·{' '}
                      {serviceLeftLabel(m.releaseDate, today)}
                    </small>
                  </button>
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
