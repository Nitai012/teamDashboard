import { type CSSProperties, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Button } from './Button';
import styles from './Layout.module.css';

export function PageHeader({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeading}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1 className={styles.pageTitle}>{title}</h1>
        {children}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </header>
  );
}

/** A bordered surface. `index` staggers its entrance animation. */
export function Panel({
  title,
  aside,
  children,
  className,
  index,
  as: Tag = 'section',
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  index?: number;
  as?: 'section' | 'div';
}) {
  return (
    <Tag
      className={cx(styles.panel, index !== undefined && 'rise', className)}
      style={index !== undefined ? ({ '--i': index } as CSSProperties) : undefined}
    >
      {(title || aside) && (
        <div className={styles.panelHead}>
          {title && <h2 className={styles.panelTitle}>{title}</h2>}
          {aside && <div className={styles.panelAside}>{aside}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}

export function SectionHeader({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({
  art,
  title,
  children,
  action,
}: {
  art?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cx(styles.empty, 'rise')}>
      {art && <div className={styles.emptyArt}>{art}</div>}
      <h2 className={styles.emptyTitle}>{title}</h2>
      {children && <p className={styles.emptyText}>{children}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = 'טוען…' }: { label?: string }) {
  return (
    <div className={styles.loading} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="לא הצלחנו לטעון את הנתונים"
      action={
        <Button variant="primary" onClick={onRetry}>
          ניסיון נוסף
        </Button>
      }
    >
      בדוק שהשרת פועל ושיש חיבור לרשת.
    </EmptyState>
  );
}

export function StatGrid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={cx(styles.stats, styles[`cols${columns}`])}>{children}</div>;
}

export function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'warning' | 'critical';
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={cx(styles.statValue, tone && styles[tone])}>{value}</span>
      {detail && <span className={styles.statDetail}>{detail}</span>}
    </div>
  );
}
