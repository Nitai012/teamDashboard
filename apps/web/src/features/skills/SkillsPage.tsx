import {
  activeMembers,
  DEFAULT_HORIZON_DAYS,
  daysOfServiceLeft,
  isInTraining,
  isLeavingWithin,
  type MemberDto,
  PLANNING_HORIZONS,
  rankCoverage,
  releaseStatus,
  type SkillCoverage,
  type SkillDto,
  skillLevel,
  SKILL_LEVELS,
} from '@team-radar/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/Button';
import { IconPlus } from '../../components/Icons';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionHeader,
  Stat,
  StatGrid,
} from '../../components/Layout';
import { Pill } from '../../components/Pill';
import { Segmented } from '../../components/Segmented';
import { cx } from '../../lib/cx';
import { COVERAGE_LABEL, horizonLabel, releaseShort } from '../../lib/format';
import { useTeamData } from '../../lib/queries';
import { useToday } from '../../lib/use-today';
import { AddSkillDialog, LevelDialog, SkillDialog } from './SkillDialogs';
import { TrainingPlan } from './TrainingPlan';
import styles from './SkillsPage.module.css';

const HORIZON_OPTIONS = PLANNING_HORIZONS.map((h) => ({ value: h.days, label: h.label }));

export function SkillsPage() {
  const data = useTeamData();
  const today = useToday();
  const [horizon, setHorizon] = useState(DEFAULT_HORIZON_DAYS);
  const [cell, setCell] = useState<{ memberId: string; skillId: string } | null>(null);
  const [openSkillId, setOpenSkillId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (data.status === 'loading') return <LoadingState />;
  if (data.status === 'error') return <ErrorState onRetry={data.retry} />;

  const { members, skills } = data;
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const team = activeMembers(members, today).sort(
    (a, b) =>
      daysOfServiceLeft(a.releaseDate, today) - daysOfServiceLeft(b.releaseDate, today) ||
      a.name.localeCompare(b.name, 'he'),
  );
  const coverage = rankCoverage(
    skills.map((s) => s.id),
    team,
    today,
    horizon,
  );

  const atRisk = coverage.filter((c) => c.severity === 'critical').length;
  const leavingCount = team.filter((m) => isLeavingWithin(m.releaseDate, today, horizon)).length;
  const trainingMarks = team.reduce(
    (sum, m) => sum + m.skills.filter((s) => s.inTraining).length,
    0,
  );

  const selectedMember = cell ? members.find((m) => m.id === cell.memberId) : undefined;
  const selectedSkill = cell ? skillById.get(cell.skillId) : undefined;
  const openSkill = openSkillId ? skillById.get(openSkillId) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="מי מקצועי במה · ומתי הוא משתחרר"
        title="מקצועיות ושחרורים"
        actions={
          <Button icon={<IconPlus />} onClick={() => setAdding(true)}>
            הוספת תחום
          </Button>
        }
      />

      {team.length === 0 ? (
        <EmptyState title="עוד אין חיילים פעילים" action={<Link to="/">למסך הצוות</Link>}>
          הוסף חיילים במסך הצוות, ואז סמן כאן את רמת המקצועיות של כל אחד.
        </EmptyState>
      ) : skills.length === 0 ? (
        <EmptyState
          title="עוד אין תחומים"
          action={
            <Button variant="primary" icon={<IconPlus />} onClick={() => setAdding(true)}>
              הוספת התחום הראשון
            </Button>
          }
        >
          הוסף תחום (למשל DevOps, React או Kafka) וסמן לכל חייל את הרמה שלו. הטבלה תראה איזה ידע
          עוזב עם השחרורים ואת מי כדאי להכשיר.
        </EmptyState>
      ) : (
        <>
          <div className={styles.controls}>
            <span className={styles.controlLabel}>אופק תכנון</span>
            <Segmented
              label="אופק תכנון"
              options={HORIZON_OPTIONS}
              value={horizon}
              onChange={setHorizon}
            />
          </div>

          <StatGrid columns={3}>
            <Stat
              label="תחומים בסיכון"
              value={<span className="num">{atRisk}</span>}
              tone={atRisk ? 'critical' : undefined}
              detail="אף אחד עצמאי לא נשאר"
            />
            <Stat
              label={`משתחררים בתוך ${horizonLabel(horizon)}`}
              value={<span className="num">{leavingCount}</span>}
              tone={leavingCount ? 'warning' : undefined}
              detail={`מתוך ${team.length} חיילים`}
            />
            <Stat
              label="בהכשרה"
              value={<span className="num">{trainingMarks}</span>}
              detail="סימוני הכשרה פעילים"
            />
          </StatGrid>

          <Legend horizon={horizon} />

          <SkillMatrix
            team={team}
            coverage={coverage}
            skillById={skillById}
            today={today}
            horizon={horizon}
            onCell={(memberId, skillId) => setCell({ memberId, skillId })}
            onSkill={setOpenSkillId}
          />

          <SectionHeader title="את מי להכשיר" />
          <TrainingPlan
            coverage={coverage}
            skillById={skillById}
            team={team}
            today={today}
            horizon={horizon}
          />
        </>
      )}

      <LevelDialog
        open={Boolean(selectedMember && selectedSkill)}
        onClose={() => setCell(null)}
        member={selectedMember}
        skill={selectedSkill}
        today={today}
      />
      <SkillDialog
        open={Boolean(openSkill)}
        onClose={() => setOpenSkillId(null)}
        skill={openSkill}
        skills={skills}
        team={team}
        today={today}
        horizon={horizon}
      />
      <AddSkillDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function Legend({ horizon }: { horizon: number }) {
  return (
    <div className={styles.legend}>
      {SKILL_LEVELS.map((level) => (
        <span key={level.value}>
          <i className={cx(styles.swatch, styles[`lv${level.value}`])} aria-hidden="true" />
          {level.label}
        </span>
      ))}
      <span>
        <i className={cx(styles.swatch, styles.swatchTraining)} aria-hidden="true" />
        בהכשרה
      </span>
      <span>
        <i className={cx(styles.swatch, styles.swatchLeaving)} aria-hidden="true" />
        משתחרר בתוך האופק
      </span>
      <span className={styles.legendNote}>
        מעל כל תחום: עצמאיים היום ← אחרי {horizonLabel(horizon)}
      </span>
    </div>
  );
}

const CELL_TEXT = ['·', 'לומד', 'עצמאי', 'מומחה'];

interface SkillMatrixProps {
  team: MemberDto[];
  coverage: SkillCoverage<MemberDto>[];
  skillById: Map<string, SkillDto>;
  today: string;
  horizon: number;
  onCell: (memberId: string, skillId: string) => void;
  onSkill: (skillId: string) => void;
}

function SkillMatrix({
  team,
  coverage,
  skillById,
  today,
  horizon,
  onCell,
  onSkill,
}: SkillMatrixProps) {
  return (
    <div className={styles.matrixWrap}>
      <table className={styles.matrix}>
        <caption className="visually-hidden">רמת המקצועיות של כל חייל בכל תחום</caption>
        <thead>
          <tr>
            <th scope="col" className={cx(styles.rowHead, styles.corner)}>
              חייל · שחרור
            </th>
            {coverage.map((c) => {
              const name = skillById.get(c.skillId)?.name ?? '';
              return (
                <th key={c.skillId} scope="col">
                  <button
                    type="button"
                    className={styles.colHead}
                    onClick={() => onSkill(c.skillId)}
                    title={`${COVERAGE_LABEL[c.status]}: ${c.capableNow.length} עצמאיים היום, ${c.capableAfter.length} אחרי האופק`}
                  >
                    <span className={styles.colName}>{name}</span>
                    <Pill tone={c.severity}>
                      <span className="num">
                        {c.capableNow.length} ← {c.capableAfter.length}
                      </span>
                    </Pill>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {team.map((member) => {
            const release = releaseStatus(member.releaseDate, today);
            const leaving = isLeavingWithin(member.releaseDate, today, horizon);
            return (
              <tr key={member.id} className={cx(leaving && styles.leaving)}>
                <th scope="row" className={styles.rowHead}>
                  <Link to={`/members/${member.id}`} className={styles.rowName}>
                    {member.name}
                  </Link>
                  <Pill
                    tone={leaving && release ? release.severity : 'neutral'}
                    className={styles.rowRelease}
                  >
                    {release ? releaseShort(release) : 'אין תאריך'}
                  </Pill>
                </th>
                {coverage.map((c) => {
                  const level = skillLevel(member, c.skillId);
                  const training = isInTraining(member, c.skillId);
                  const skillName = skillById.get(c.skillId)?.name ?? '';
                  return (
                    <td key={c.skillId}>
                      <button
                        type="button"
                        className={cx(
                          styles.cell,
                          styles[`lv${level}`],
                          training && styles.training,
                        )}
                        onClick={() => onCell(member.id, c.skillId)}
                        aria-label={`${member.name}, ${skillName}: ${SKILL_LEVELS[level]?.label}${training ? ', בהכשרה' : ''}`}
                      >
                        {training && level === 0 ? 'הכשרה' : CELL_TEXT[level]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
