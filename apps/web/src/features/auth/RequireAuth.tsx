import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ErrorState, LoadingState } from '../../components/Layout';
import { useSession } from '../../lib/queries';

export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) return <LoadingState />;
  if (session.isError) {
    return (
      <div style={{ padding: 16 }}>
        <ErrorState onRetry={() => void session.refetch()} />
      </div>
    );
  }
  if (!session.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
