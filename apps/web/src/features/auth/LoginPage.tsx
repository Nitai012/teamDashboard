import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Field';
import { LoadingState } from '../../components/Layout';
import { Radar } from '../../components/Radar';
import { ApiError, errorMessage } from '../../lib/api';
import { useLogin, useSession } from '../../lib/queries';
import styles from './LoginPage.module.css';

const DEMO_SHAPE = [8, 6, 7, 8, 5, 7];

export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (session.isPending) return <LoadingState />;
  if (session.data) return <Navigate to={from} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;
    login.mutate(password, { onSuccess: () => navigate(from, { replace: true }) });
  };

  const error =
    login.error instanceof ApiError && login.error.status === 401
      ? 'הסיסמה לא נכונה'
      : login.error
        ? errorMessage(login.error)
        : undefined;

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={submit} noValidate>
        <Radar
          className={styles.art}
          variant="mini"
          label="מפת התפתחות"
          layers={[{ id: 'demo', scores: DEMO_SHAPE, tone: 'self', filled: true }]}
        />
        <div className={styles.heading}>
          <h1 className={styles.title}>מפת התפתחות הצוות</h1>
          <p className={styles.subtitle}>הנתונים של הצוות שמורים מאחורי סיסמה.</p>
        </div>
        <TextField
          label="סיסמה"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error}
        />
        <Button type="submit" variant="primary" block disabled={!password || login.isPending}>
          {login.isPending ? 'מתחבר…' : 'כניסה'}
        </Button>
      </form>
    </main>
  );
}
