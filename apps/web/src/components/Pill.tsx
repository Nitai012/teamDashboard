import { type ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './Pill.module.css';

export type Tone = 'neutral' | 'ok' | 'warning' | 'critical' | 'accent' | 'training';

export function Pill({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cx(styles.pill, styles[tone], className)}>{children}</span>;
}

/** Outlined label that marks sample data. */
export function ExampleChip() {
  return <span className={styles.chip}>דוגמה</span>;
}
