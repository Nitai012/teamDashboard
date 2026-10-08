import { cx } from '../lib/cx';
import styles from './Segmented.module.css';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string | number> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  block?: boolean;
  disabled?: boolean;
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  block,
  disabled,
}: SegmentedProps<T>) {
  return (
    <div className={cx(styles.group, block && styles.block)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={option.value === value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
