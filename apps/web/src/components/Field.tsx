import { type ComponentProps, type ReactNode, useId } from 'react';
import { cx } from '../lib/cx';
import styles from './Field.module.css';

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (props: { id: string; describedBy: string | undefined }) => ReactNode;
}

function FieldShell({ label, hint, error, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = error || hint ? hintId : undefined;
  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({ id, describedBy })}
      {(error || hint) && (
        <span id={hintId} className={cx(styles.hint, error ? styles.error : undefined)}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

type Common = { label: ReactNode; hint?: ReactNode; error?: ReactNode; className?: string };

export function TextField({
  label,
  hint,
  error,
  className,
  ...input
}: Common & ComponentProps<'input'>) {
  return (
    <FieldShell label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={styles.control}
          {...input}
        />
      )}
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className,
  ...input
}: Common & ComponentProps<'textarea'>) {
  return (
    <FieldShell label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cx(styles.control, styles.textarea)}
          {...input}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...select
}: Common & ComponentProps<'select'>) {
  return (
    <FieldShell label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          className={cx(styles.control, styles.select)}
          {...select}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}
