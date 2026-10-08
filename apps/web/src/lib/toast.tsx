import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cx } from './cx';
import styles from './toast.module.css';

type Tone = 'default' | 'error';

interface ToastState {
  id: number;
  message: string;
  tone: Tone;
}

type ShowToast = (message: string, tone?: Tone) => void;

const ToastContext = createContext<ShowToast | null>(null);

const VISIBLE_MS = 2800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const show = useCallback<ShowToast>((message, tone = 'default') => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toast && (
          <span key={toast.id} className={cx(styles.toast, toast.tone === 'error' && styles.error)}>
            {toast.message}
          </span>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
