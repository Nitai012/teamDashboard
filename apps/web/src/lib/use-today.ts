import { todayIso } from '@team-radar/shared';
import { useEffect, useState } from 'react';

/** Today's local date, refreshed when the app returns to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(todayIso);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setToday(todayIso());
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  return today;
}
