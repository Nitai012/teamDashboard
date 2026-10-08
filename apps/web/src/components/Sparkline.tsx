import { SCORE_MAX, SCORE_MIN } from '@team-radar/shared';
import styles from './Sparkline.module.css';

interface SparklineProps {
  /** Points as [time in ms, score]. */
  points: readonly (readonly [number, number])[];
  /** Shared time range so all sparklines on a page line up. */
  range: readonly [number, number];
}

const WIDTH = 120;
const HEIGHT = 36;
const PAD = 5;

export function Sparkline({ points, range }: SparklineProps) {
  const [t0, t1] = range;
  const x = (t: number) =>
    t1 === t0 ? WIDTH / 2 : PAD + ((t - t0) / (t1 - t0)) * (WIDTH - PAD * 2);
  const y = (v: number) =>
    HEIGHT - PAD - ((v - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * (HEIGHT - PAD * 2);
  const coords = points.map(([t, v]) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`);
  const last = points.at(-1);
  const midline = y((SCORE_MIN + SCORE_MAX) / 2).toFixed(1);

  return (
    <svg className={styles.spark} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <line className={styles.mid} x1={PAD} x2={WIDTH - PAD} y1={midline} y2={midline} />
      {points.length > 1 && (
        <>
          <polygon
            className={styles.area}
            points={`${x(points[0]![0]).toFixed(1)},${HEIGHT - PAD} ${coords.join(' ')} ${x(last![0]).toFixed(1)},${HEIGHT - PAD}`}
          />
          <polyline className={styles.line} points={coords.join(' ')} />
        </>
      )}
      {last && <circle className={styles.dot} cx={x(last[0])} cy={y(last[1])} r={2.8} />}
    </svg>
  );
}
