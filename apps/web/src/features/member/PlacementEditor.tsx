import {
  type AssessmentDto,
  average,
  type MemberDto,
  normalizeScores,
  PERSONAL_AXIS_INDEX,
  PERSONAL_AXIS_OPTIONS,
  SCORE_MAX,
  SCORE_MIN,
} from '@team-radar/shared';
import { type CSSProperties, type FormEvent, useState } from 'react';
import { Button } from '../../components/Button';
import { SelectField, TextArea, TextField } from '../../components/Field';
import { Panel } from '../../components/Layout';
import { Radar, type RadarLayer } from '../../components/Radar';
import { errorMessage } from '../../lib/api';
import { formatAverage, formatDate } from '../../lib/format';
import { useSaveAssessment, useUpdateMember } from '../../lib/queries';
import { useToast } from '../../lib/toast';
import styles from './MemberPage.module.css';

interface PlacementEditorProps {
  member: MemberDto;
  placements: AssessmentDto[];
  axes: string[];
  labels: string[];
  compare: AssessmentDto | undefined;
  today: string;
}

/** Ring colour of a score, matching the bands on the chart. */
function bandColor(value: number): string {
  if (value <= 1) return 'var(--ring-1)';
  if (value <= 3) return 'var(--ring-3)';
  if (value <= 5) return 'var(--ring-5)';
  if (value <= 7) return 'var(--ring-7)';
  if (value <= 8) return 'var(--ring-8)';
  return 'var(--ring-10)';
}

export function PlacementEditor({
  member,
  placements,
  axes,
  labels,
  compare,
  today,
}: PlacementEditorProps) {
  const latest = placements.at(-1);
  const findOn = (date: string) => placements.find((p) => p.date === date);

  const [date, setDate] = useState(today);
  const [scores, setScores] = useState(() => normalizeScores((findOn(today) ?? latest)?.scores));
  const [goal, setGoal] = useState(() => findOn(today)?.goal ?? '');
  const [dirty, setDirty] = useState(false);

  const save = useSaveAssessment();
  const toast = useToast();
  const existing = findOn(date);

  const setScore = (axis: number, value: number) => {
    setScores((prev) =>
      prev[axis] === value ? prev : prev.map((v, i) => (i === axis ? value : v)),
    );
    setDirty(true);
  };

  const changeDate = (next: string) => {
    setDate(next);
    const placement = findOn(next);
    // Picking a date that already has a placement opens it, unless there are unsaved edits.
    if (placement && !dirty) {
      setScores(normalizeScores(placement.scores));
      setGoal(placement.goal);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!date) return;
    save.mutate(
      { memberId: member.id, date, input: { scores, goal: goal.trim() } },
      {
        onSuccess: () => {
          setDirty(false);
          toast(existing ? 'המיקום עודכן' : 'המיקום נשמר');
        },
        onError: (error) => toast(errorMessage(error), 'error'),
      },
    );
  };

  const layers: RadarLayer[] = [];
  if (compare)
    layers.push({
      id: `compare-${compare.id}`,
      scores: compare.scores,
      tone: 'compare',
      dashed: true,
    });
  layers.push({ id: 'draft', scores, tone: 'self', filled: true });

  return (
    <Panel className={styles.editor} index={0}>
      <form className={styles.editorForm} onSubmit={submit}>
        <PersonalAxisPicker member={member} defaultLabel={axes[PERSONAL_AXIS_INDEX] ?? ''} />

        <Radar
          label={labels.map((l, i) => `${l} ${scores[i]}`).join(', ')}
          labels={labels}
          layers={layers}
          editable={{ layerId: 'draft', onChange: setScore }}
        />

        <div className={styles.chartLegend}>
          <span>
            <i className={styles.swatchSelf} aria-hidden="true" />
            המיקום עכשיו
          </span>
          {compare && (
            <span>
              <i className={styles.swatchCompare} aria-hidden="true" />
              השוואה ל־<span className="num">{formatDate(compare.date)}</span>
            </span>
          )}
        </div>
        <p className={styles.hint}>
          החייל גורר כל נקודה לאורך הקו, או מזיז את הסרגלים. {SCORE_MIN} במרכז, {SCORE_MAX} בטבעת
          החיצונית.
        </p>

        <div className={styles.sliders}>
          {labels.map((label, axis) => (
            <label key={axis} className={styles.slider}>
              <span className={styles.sliderName}>{label}</span>
              <input
                type="range"
                min={SCORE_MIN}
                max={SCORE_MAX}
                step={1}
                value={scores[axis]}
                onChange={(e) => setScore(axis, Number(e.target.value))}
              />
              <span className={styles.sliderValue}>
                <i
                  style={{ '--band': bandColor(scores[axis] ?? SCORE_MIN) } as CSSProperties}
                  aria-hidden="true"
                />
                <span className="num">{scores[axis]}</span>
              </span>
            </label>
          ))}
        </div>

        {latest?.goal && (
          <p className={styles.previousGoal}>
            <b>
              היעד שנקבע ב־<span className="num">{formatDate(latest.date)}</span>:
            </b>{' '}
            {latest.goal}
          </p>
        )}

        <div className={styles.dateRow}>
          <TextField
            label="תאריך"
            type="date"
            value={date}
            max={today}
            onChange={(e) => changeDate(e.target.value)}
          />
          <div className={styles.average}>
            <span>ממוצע</span>
            <strong className="num">{formatAverage(average(scores))}</strong>
          </div>
        </div>

        <TextArea
          label="יעד לתקופה הקרובה"
          value={goal}
          rows={2}
          maxLength={500}
          placeholder="על מה הוא רוצה לעבוד עד הפגישה הבאה?"
          onChange={(e) => {
            setGoal(e.target.value);
            setDirty(true);
          }}
        />

        <div className={styles.saveBar}>
          <span className={styles.dirty} aria-live="polite">
            {dirty ? 'יש שינויים שלא נשמרו' : ''}
          </span>
          <Button type="submit" variant="primary" disabled={save.isPending || !date}>
            {save.isPending ? 'שומר…' : existing ? 'עדכון המיקום מהתאריך הזה' : 'שמירת המיקום'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

const CUSTOM = '__custom';

function PersonalAxisPicker({ member, defaultLabel }: { member: MemberDto; defaultLabel: string }) {
  const update = useUpdateMember();
  const toast = useToast();
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState('');

  const current = member.personalAxis;
  const isCustomValue = current !== '' && !PERSONAL_AXIS_OPTIONS.includes(current);

  const saveLabel = (personalAxis: string) =>
    update.mutate(
      { id: member.id, input: { personalAxis } },
      {
        onSuccess: () => {
          setCustomMode(false);
          setCustom('');
          toast(personalAxis ? `הציר האישי: ${personalAxis}` : 'הציר האישי חזר לברירת המחדל');
        },
        onError: (error) => toast(errorMessage(error), 'error'),
      },
    );

  return (
    <div className={styles.personal}>
      <SelectField
        label={`הציר האישי של ${member.name}`}
        hint="הציר השישי. כל חייל בוחר במה הוא רוצה להתפתח."
        value={customMode ? CUSTOM : current}
        disabled={update.isPending}
        onChange={(e) => {
          if (e.target.value === CUSTOM) setCustomMode(true);
          else saveLabel(e.target.value);
        }}
      >
        <option value="">{defaultLabel} (ברירת המחדל)</option>
        {PERSONAL_AXIS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        {isCustomValue && <option value={current}>{current}</option>}
        <option value={CUSTOM}>משהו אחר… (כתיבה חופשית)</option>
      </SelectField>
      {customMode && (
        <div className={styles.customAxis}>
          <TextField
            label="שם הציר"
            value={custom}
            maxLength={40}
            autoFocus
            placeholder="למשל: יזמות, כתיבה טכנית"
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (custom.trim()) saveLabel(custom.trim());
              }
            }}
          />
          <Button
            variant="primary"
            disabled={!custom.trim() || update.isPending}
            onClick={() => saveLabel(custom.trim())}
          >
            שמירה
          </Button>
          <Button variant="ghost" onClick={() => setCustomMode(false)}>
            ביטול
          </Button>
        </div>
      )}
    </div>
  );
}
