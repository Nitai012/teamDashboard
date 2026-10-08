import { type AssessmentDto, PERSONAL_AXIS_INDEX } from '@team-radar/shared';
import { Panel } from '../../components/Layout';
import { Sparkline } from '../../components/Sparkline';
import { cx } from '../../lib/cx';
import { placementPersonalAxis } from '../../lib/team';
import styles from './MemberPage.module.css';

interface TrendsProps {
  placements: AssessmentDto[];
  axes: string[];
  labels: string[];
}

const time = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export function Trends({ placements, axes, labels }: TrendsProps) {
  if (placements.length < 2) return null;

  const range = [time(placements[0]!.date), time(placements.at(-1)!.date)] as const;

  return (
    <Panel title="מגמה לאורך זמן" aside="שינוי מהמיקום הראשון" index={2}>
      <div className={styles.trends}>
        {labels.map((label, axis) => {
          // The personal axis only compares placements made with the same label.
          const series =
            axis === PERSONAL_AXIS_INDEX
              ? placements.filter((p) => placementPersonalAxis(p, axes) === label)
              : placements;
          const first = series[0]?.scores[axis];
          const last = series.at(-1)?.scores[axis];
          const change =
            series.length >= 2 && first !== undefined && last !== undefined ? last - first : null;

          return (
            <div key={axis} className={styles.trend}>
              <div className={styles.trendHead}>
                <span>{label}</span>
                {change !== null ? (
                  <span
                    className={cx(
                      'num',
                      styles.trendChange,
                      change > 0 && styles.up,
                      change < 0 && styles.down,
                    )}
                    dir="ltr"
                  >
                    {change === 0 ? '±0' : change > 0 ? `+${change}` : `−${Math.abs(change)}`}
                  </span>
                ) : (
                  <span className={styles.trendNew}>ציר חדש</span>
                )}
              </div>
              <Sparkline
                range={range}
                points={series.map((p) => [time(p.date), p.scores[axis] ?? 0] as const)}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
