import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryKeys = {
  session: ['session'],
  members: ['members'],
  skills: ['skills'],
  assessments: ['assessments'],
  settings: ['settings'],
} as const;

function handleUnauthorized(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(queryKeys.session, false);
  }
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 2,
    },
  },
});
