import { type ComponentProps, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  block,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        styles.button,
        styles[variant],
        size === 'sm' && styles.sm,
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ComponentProps<'button'> {
  label: string;
}

export function IconButton({ label, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(styles.icon, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
