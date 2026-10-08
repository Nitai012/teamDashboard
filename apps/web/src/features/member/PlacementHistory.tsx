import { type AssessmentDto, average } from '@team-radar/shared';
import { useState } from 'react';
import { Button, IconButton } from '../../components/Button';
import { IconClose } from '../../components/Icons';
import { Panel } from '../../components/Layout';
import { Radar } from '../../components/Radar';
import { errorMessage } from '../../lib/api';
import { cx } from '../../lib/cx';
import { formatAverage, formatDate } from '../../lib/format';
import { useDeleteAssessment } from '../../lib/queries';
import { placementPersonalAxis } from '../../lib/team';
import { useToast } from '../../lib/toast';
import styles from './MemberPage.module.css';

interface PlacementHistoryProps {
  placements: AssessmentDto[];
  axes: string[];
  /** The soldier's current personal axis, to flag placements made with another one. */
  currentAxis: string;
  compareId: string | null;
  onCompare: (id: string) => void;
}

export function PlacementHistory({
  placements,
  axes,
  currentAxis,
  compareId,
  onCompare,
}: PlacementHistoryProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const remove = useDeleteAssessment();
  const toast = useToast();

  if (placements.length === 0) {
    return (
      <Panel title="היסטוריה" index={1}>
        <p className={styles.muted}>
          עוד אין מיקומים שמורים. המיקום הראשון שתשמור יהיה נקודת הפתיחה.
        </p>
      </Panel>
    );
  }

  const newestFirst = [...placements].reverse();

  return (
    <Panel title="היסטוריה" aside="הקש על שורה כדי להשוות על המפה" index={1}>
      <ul className={styles.history}>
        {newestFirst.map((placement, i) => {
          if (confirmId === placement.id) {
            return (
              <li key={placement.id} className={cx(styles.historyRow, styles.confirmRow)}>
                <span>
                  למחוק את המיקום מ־<span className="num">{formatDate(placement.date)}</span>?
                </span>
                <span className={styles.confirmButtons}>
                  <Button
                    variant="danger-solid"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(placement.id, {
                        onSuccess: () => {
                          setConfirmId(null);
                          toast('המיקום נמחק');
                        },
                        onError: (error) => toast(errorMessage(error), 'error'),
                      })
                    }
                  >
                    מחיקה
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                    ביטול
                  </Button>
                </span>
              </li>
            );
          }

          const previous = newestFirst[i + 1];
          const delta = previous ? average(placement.scores) - average(previous.scores) : 0;
          const axis = placementPersonalAxis(placement, axes);
          const notes = [
            axis !== currentAxis ? `ציר אישי: ${axis}` : null,
            placement.goal ? `יעד: ${placement.goal}` : null,
          ].filter(Boolean);

          return (
            <li
              key={placement.id}
              className={cx(styles.historyRow, compareId === placement.id && styles.comparing)}
            >
              <button
                type="button"
                className={styles.historyMain}
                aria-pressed={compareId === placement.id}
                onClick={() => onCompare(placement.id)}
              >
                <Radar
                  className={styles.historyRadar}
                  variant="mini"
                  label={`מיקום מ־${formatDate(placement.date)}`}
                  layers={[
                    { id: placement.id, scores: placement.scores, tone: 'self', filled: true },
                  ]}
                />
                <span className={styles.historyText}>
                  <span className={styles.historyLine}>
                    <span className={cx(styles.historyDate, 'num')}>
                      {formatDate(placement.date)}
                    </span>
                    <span className={styles.historyAvg}>
                      ממוצע <span className="num">{formatAverage(average(placement.scores))}</span>
                    </span>
                    {Math.abs(delta) >= 0.05 && (
                      <span
                        className={cx(styles.delta, delta > 0 ? styles.up : styles.down, 'num')}
                      >
                        {delta > 0 ? '▲' : '▼'} {formatAverage(Math.abs(delta))}
                      </span>
                    )}
                  </span>
                  {notes.length > 0 && (
                    <span className={styles.historyNotes}>{notes.join(' · ')}</span>
                  )}
                </span>
              </button>
              <IconButton
                label={`מחיקת המיקום מ־${formatDate(placement.date)}`}
                onClick={() => setConfirmId(placement.id)}
              >
                <IconClose width={16} height={16} />
              </IconButton>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
