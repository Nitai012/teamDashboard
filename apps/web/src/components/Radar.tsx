import { AXIS_COUNT, SCORE_MAX, SCORE_MIN } from '@team-radar/shared';
import { type PointerEvent, useRef } from 'react';
import { cx } from '../lib/cx';
import styles from './Radar.module.css';

export type RadarTone = 'self' | 'compare' | 'training';

export interface RadarLayer {
  id: string;
  scores: readonly number[];
  tone: RadarTone;
  dashed?: boolean;
  filled?: boolean;
}

interface RadarProps {
  layers: readonly RadarLayer[];
  /** Axis labels, drawn in the full variant only. */
  labels?: readonly string[];
  variant?: 'full' | 'mini';
  /** Accessible summary of what the chart shows. */
  label: string;
  /** Makes one layer's vertices draggable along their axes. */
  editable?: { layerId: string; onChange: (axis: number, value: number) => void };
  className?: string;
}

const RADIUS = 100;
/** Rings from the original sketch: 1 red at the centre, 10 green at the edge. */
const COLORED_RINGS: Record<number, string> = {
  1: 'var(--ring-1)',
  3: 'var(--ring-3)',
  5: 'var(--ring-5)',
  7: 'var(--ring-7)',
  8: 'var(--ring-8)',
  10: 'var(--ring-10)',
};

const angle = (axis: number) => ((-90 + axis * (360 / AXIS_COUNT)) * Math.PI) / 180;

function point(axis: number, value: number): [number, number] {
  const r = (value / SCORE_MAX) * RADIUS;
  return [r * Math.cos(angle(axis)), r * Math.sin(angle(axis))];
}

const toPoints = (scores: readonly number[]) =>
  scores
    .map((v, i) =>
      point(i, v)
        .map((n) => n.toFixed(2))
        .join(','),
    )
    .join(' ');

/** Splits a long label onto two lines at the space closest to its middle. */
function wrapLabel(text: string): string[] {
  if (text.length <= 12 || !text.includes(' ')) return [text];
  const middle = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ' && (best < 0 || Math.abs(i - middle) < Math.abs(best - middle))) best = i;
  }
  return [text.slice(0, best), text.slice(best + 1)];
}

const LABEL_SPOTS: readonly [x: number, y: number, anchor: 'start' | 'middle' | 'end'][] = [
  [0, -116, 'middle'],
  [98, -58, 'start'],
  [98, 58, 'start'],
  [0, 122, 'middle'],
  [-98, 58, 'end'],
  [-98, -58, 'end'],
];

const LINE_HEIGHT = 13;

export function Radar({
  layers,
  labels,
  variant = 'full',
  label,
  editable,
  className,
}: RadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragAxis = useRef<number | null>(null);
  const full = variant === 'full';

  const valueAt = (event: PointerEvent<SVGSVGElement>, axis: number): number | null => {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const projected = p.x * Math.cos(angle(axis)) + p.y * Math.sin(angle(axis));
    return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round((projected / RADIUS) * SCORE_MAX)));
  };

  const pointerHandlers = editable && {
    onPointerDown: (event: PointerEvent<SVGSVGElement>) => {
      const matrix = svgRef.current?.getScreenCTM();
      if (!matrix) return;
      const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      if (Math.hypot(p.x, p.y) > RADIUS * 1.15) return;
      const degrees = (Math.atan2(p.y, p.x) * 180) / Math.PI;
      let nearest = 0;
      let nearestGap = Infinity;
      for (let axis = 0; axis < AXIS_COUNT; axis++) {
        const gap = Math.abs(((((degrees - (-90 + axis * 60)) % 360) + 540) % 360) - 180);
        if (gap < nearestGap) [nearest, nearestGap] = [axis, gap];
      }
      dragAxis.current = nearest;
      event.currentTarget.setPointerCapture(event.pointerId);
      const value = valueAt(event, nearest);
      if (value !== null) editable.onChange(nearest, value);
      event.preventDefault();
    },
    onPointerMove: (event: PointerEvent<SVGSVGElement>) => {
      if (dragAxis.current === null) return;
      const value = valueAt(event, dragAxis.current);
      if (value !== null) editable.onChange(dragAxis.current, value);
    },
    onPointerUp: () => {
      dragAxis.current = null;
    },
    onPointerCancel: () => {
      dragAxis.current = null;
    },
  };

  const editableLayer = editable && layers.find((l) => l.id === editable.layerId);

  return (
    <svg
      ref={svgRef}
      className={cx(
        styles.radar,
        full ? styles.full : styles.mini,
        editable && styles.editable,
        className,
      )}
      viewBox={full ? '-172 -140 344 282' : '-104 -104 208 208'}
      role="img"
      aria-label={label}
      {...pointerHandlers}
    >
      {Array.from({ length: SCORE_MAX }, (_, i) => i + 1).map((ring) => {
        const color = COLORED_RINGS[ring];
        if (!full && !color) return null;
        return (
          <circle
            key={ring}
            r={(ring / SCORE_MAX) * RADIUS}
            fill="none"
            stroke={color ?? 'var(--ring-faint)'}
            strokeWidth={color ? (full ? 1.5 : 2.6) : 0.9}
          />
        );
      })}

      {Array.from({ length: AXIS_COUNT }, (_, axis) => {
        const [x, y] = point(axis, SCORE_MAX);
        return (
          <line
            key={axis}
            x2={x}
            y2={y}
            stroke="var(--spoke)"
            strokeWidth={full ? 1.6 : 2.4}
            strokeLinecap="round"
          />
        );
      })}

      {layers.map((layer) => (
        <polygon
          key={layer.id}
          className={cx(styles.shape, styles[layer.tone], layer.filled && styles.filled)}
          points={toPoints(layer.scores)}
          strokeWidth={full ? (layer.dashed ? 2.2 : 3.2) : 5.5}
          strokeDasharray={layer.dashed ? '4 4' : undefined}
        />
      ))}

      {editableLayer &&
        editableLayer.scores.map((value, axis) => {
          const [x, y] = point(axis, value);
          return <circle key={axis} className={styles.handle} cx={x} cy={y} r={7.5} />;
        })}

      {full &&
        labels?.slice(0, AXIS_COUNT).map((text, axis) => {
          const [x, y, anchor] = LABEL_SPOTS[axis]!;
          const lines = wrapLabel(text);
          // Top labels grow upwards, bottom labels downwards, side labels around their spot.
          const firstY =
            axis === 0
              ? y - (lines.length - 1) * LINE_HEIGHT
              : axis === 3
                ? y
                : y - ((lines.length - 1) * LINE_HEIGHT) / 2;
          return (
            <text key={axis} className={styles.label} x={x} y={firstY} textAnchor={anchor}>
              {lines.map((line, i) => (
                <tspan key={i} x={x} dy={i === 0 ? 0 : LINE_HEIGHT}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
    </svg>
  );
}
