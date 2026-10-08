import {
  daysOfServiceLeft,
  isInTraining,
  isLeavingWithin,
  type MemberDto,
  releaseStatus,
  skillCoverage,
  type SkillDto,
  skillLevel,
  type SkillLevel,
  SKILL_LEVELS,
} from '@team-radar/shared';
import { type FormEvent, useState } from 'react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { TextField } from '../../components/Field';
import { IconCheck } from '../../components/Icons';
import { Pill } from '../../components/Pill';
import { ApiError, errorMessage } from '../../lib/api';
import { cx } from '../../lib/cx';
import { COVERAGE_LABEL, horizonLabel, releaseShort, serviceLeftLabel } from '../../lib/format';
import {
  useCreateSkill,
  useDeleteSkill,
  useRenameSkill,
  useSetMemberSkill,
} from '../../lib/queries';
import { useToast } from '../../lib/toast';
import styles from './SkillsPage.module.css';

const sameName = (a: string, b: string) =>
  a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();

/* ---------- level picker ---------- */

interface LevelDialogProps {
  open: boolean;
  onClose: () => void;
  member: MemberDto | undefined;
  skill: SkillDto | undefined;
  today: string;
}

export function LevelDialog({ open, onClose, member, skill, today }: LevelDialogProps) {
  return (
    <Dialog
      open={open && Boolean(member && skill)}
      onClose={onClose}
      title={member?.name ?? ''}
      description={
        member &&
        skill && (
          <>
            הרמה ב־<bdi>{skill.name}</bdi> · {serviceLeftLabel(member.releaseDate, today)}
          </>
        )
      }
    >
      {member && skill && <LevelPicker member={member} skill={skill} onDone={onClose} />}
    </Dialog>
  );
}

function LevelPicker({
  member,
  skill,
  onDone,
}: {
  member: MemberDto;
  skill: SkillDto;
  onDone: () => void;
}) {
  const setSkill = useSetMemberSkill();
  const toast = useToast();
  const level = skillLevel(member, skill.id);
  const training = isInTraining(member, skill.id);

  const save = (next: { level: SkillLevel; inTraining: boolean }, message: string) =>
    setSkill.mutate(
      { memberId: member.id, skillId: skill.id, input: next },
      {
        onSuccess: () => {
          toast(message);
          onDone();
        },
        onError: (error) => toast(errorMessage(error), 'error'),
      },
    );

  return (
    <>
      <div className={styles.levels} role="radiogroup" aria-label={`הרמה ב־${skill.name}`}>
        {SKILL_LEVELS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === level}
            className={cx(styles.levelOption, option.value === level && styles.levelOn)}
            disabled={setSkill.isPending}
            onClick={() =>
              save(
                { level: option.value, inTraining: training },
                `${member.name}: ${option.label} ב־${skill.name}`,
              )
            }
          >
            <i className={cx(styles.levelSwatch, styles[`lv${option.value}`])} aria-hidden="true" />
            <span>
              <b>{option.label}</b>
              <small>{option.description}</small>
            </span>
            {option.value === level && <IconCheck className={styles.levelCheck} />}
          </button>
        ))}
      </div>
      <Button
        variant={training ? 'primary' : 'secondary'}
        block
        disabled={setSkill.isPending}
        icon={training ? <IconCheck /> : undefined}
        onClick={() =>
          save(
            { level, inTraining: !training },
            training ? 'סימון ההכשרה הוסר' : `${member.name} סומן להכשרה ב־${skill.name}`,
          )
        }
      >
        {training ? 'מסומן להכשרה בתחום הזה' : 'סימון להכשרה בתחום הזה'}
      </Button>
    </>
  );
}

/* ---------- skill details ---------- */

interface SkillDialogProps {
  open: boolean;
  onClose: () => void;
  skill: SkillDto | undefined;
  skills: SkillDto[];
  team: MemberDto[];
  today: string;
  horizon: number;
}

export function SkillDialog({
  open,
  onClose,
  skill,
  skills,
  team,
  today,
  horizon,
}: SkillDialogProps) {
  return (
    <Dialog open={open && Boolean(skill)} onClose={onClose} title={skill?.name ?? ''}>
      {skill && (
        <SkillDetails
          skill={skill}
          skills={skills}
          team={team}
          today={today}
          horizon={horizon}
          onDone={onClose}
        />
      )}
    </Dialog>
  );
}

function SkillDetails({
  skill,
  skills,
  team,
  today,
  horizon,
  onDone,
}: Omit<SkillDialogProps, 'open' | 'onClose' | 'skill'> & { skill: SkillDto; onDone: () => void }) {
  const [name, setName] = useState(skill.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rename = useRenameSkill();
  const remove = useDeleteSkill();
  const toast = useToast();

  const coverage = skillCoverage(skill.id, team, today, horizon);
  const holders = team
    .filter((m) => skillLevel(m, skill.id) > 0 || isInTraining(m, skill.id))
    .sort(
      (a, b) =>
        skillLevel(b, skill.id) - skillLevel(a, skill.id) ||
        daysOfServiceLeft(b.releaseDate, today) - daysOfServiceLeft(a.releaseDate, today),
    );
  const mergeTarget = skills.find((s) => s.id !== skill.id && sameName(s.name, name));

  const submitRename = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || name.trim() === skill.name) return;
    rename.mutate(
      { id: skill.id, name: name.trim() },
      {
        onSuccess: () => {
          toast(mergeTarget ? `התחומים אוחדו ל־${mergeTarget.name}` : 'השם עודכן');
          onDone();
        },
        onError: (error) => toast(errorMessage(error), 'error'),
      },
    );
  };

  const deleteSkill = () =>
    remove.mutate(skill.id, {
      onSuccess: () => {
        toast(`התחום ${skill.name} נמחק`);
        onDone();
      },
      onError: (error) => toast(errorMessage(error), 'error'),
    });

  return (
    <>
      <div className={styles.skillSummary}>
        <Pill tone={coverage.severity}>{COVERAGE_LABEL[coverage.status]}</Pill>
        <span>
          עצמאיים ומעלה היום: <b className="num">{coverage.capableNow.length}</b> · אחרי{' '}
          {horizonLabel(horizon)}: <b className="num">{coverage.capableAfter.length}</b>
        </span>
      </div>

      {holders.length > 0 ? (
        <ul className={styles.holders}>
          {holders.map((m) => {
            const status = releaseStatus(m.releaseDate, today);
            const leaving = isLeavingWithin(m.releaseDate, today, horizon);
            return (
              <li key={m.id}>
                <span>
                  <b>{m.name}</b> · {SKILL_LEVELS[skillLevel(m, skill.id)]?.label}
                  {isInTraining(m, skill.id) && (
                    <span className={styles.trainingTag}> · בהכשרה</span>
                  )}
                </span>
                <Pill tone={leaving && status ? status.severity : 'neutral'}>
                  {status ? releaseShort(status) : 'אין תאריך'}
                </Pill>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.muted}>אף חייל עוד לא מסומן בתחום הזה.</p>
      )}

      <form className={styles.inlineForm} onSubmit={submitRename}>
        <TextField
          label="שינוי שם"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="off"
          hint={
            mergeTarget
              ? `קיים תחום בשם ${mergeTarget.name}. השמירה תאחד את שניהם, וכל חייל ישמור את הרמה הגבוהה מביניהן.`
              : undefined
          }
        />
        <Button
          type="submit"
          disabled={rename.isPending || !name.trim() || name.trim() === skill.name}
        >
          {mergeTarget ? 'איחוד' : 'שינוי'}
        </Button>
      </form>

      <div className={styles.dangerRow}>
        {confirmDelete ? (
          <>
            <span>התחום יימחק מכל החיילים.</span>
            <Button
              variant="danger-solid"
              size="sm"
              onClick={deleteSkill}
              disabled={remove.isPending}
            >
              למחוק
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              ביטול
            </Button>
          </>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            מחיקת התחום
          </Button>
        )}
      </div>
    </>
  );
}

/* ---------- add skill ---------- */

export function AddSkillDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="תחום חדש">
      <AddSkillForm onDone={onClose} />
    </Dialog>
  );
}

function AddSkillForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const create = useCreateSkill();
  const toast = useToast();

  const error =
    create.error instanceof ApiError && create.error.status === 409
      ? 'התחום הזה כבר קיים בטבלה'
      : create.error
        ? errorMessage(create.error)
        : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    create.mutate(name.trim(), {
      onSuccess: (skill) => {
        toast(`התחום ${skill.name} נוסף`);
        onDone();
      },
    });
  };

  return (
    <form className={styles.addForm} onSubmit={submit} noValidate>
      <TextField
        label="שם התחום"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (create.error) create.reset();
        }}
        placeholder="למשל: DevOps, Kubernetes, React"
        maxLength={40}
        autoComplete="off"
        autoFocus
        error={error}
        hint="אחרי ההוספה הקש על המשבצות בטבלה כדי לסמן לכל חייל את הרמה שלו."
      />
      <div className={styles.addActions}>
        <Button variant="ghost" onClick={onDone}>
          ביטול
        </Button>
        <Button type="submit" variant="primary" disabled={!name.trim() || create.isPending}>
          הוספה
        </Button>
      </div>
    </form>
  );
}
