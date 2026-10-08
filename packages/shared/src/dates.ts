import { RELEASE_CRITICAL_DAYS, RELEASE_WARNING_DAYS } from './constants.js';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/**
 * Converts a calendar date (YYYY-MM-DD) to a UTC day number. Working in whole
 * days keeps every calculation independent of the viewer's time zone and DST.
 */
function toDayNumber(iso: string): number | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match;
  const time = Date.UTC(Number(y), Number(m) - 1, Number(d));
  const check = new Date(time);
  if (check.getUTCMonth() !== Number(m) - 1 || check.getUTCDate() !== Number(d)) return null;
  return Math.round(time / DAY_MS);
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && toDayNumber(value) !== null;
}

/** Today's date in the local time zone of the runtime, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const a = toDayNumber(from);
  const b = toDayNumber(to);
  if (a === null || b === null) throw new RangeError(`Invalid ISO date: ${a === null ? from : to}`);
  return b - a;
}

/** Whole calendar months from `from` to `to`, never negative. */
export function monthsBetween(from: string, to: string): number {
  if (!isIsoDate(from) || !isIsoDate(to)) throw new RangeError('Invalid ISO date');
  const [fy, fm, fd] = from.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = to.split('-').map(Number) as [number, number, number];
  let months = (ty - fy) * 12 + (tm - fm);
  if (td < fd) months -= 1;
  return Math.max(0, months);
}

export type Severity = 'critical' | 'warning' | 'ok';

export interface ReleaseStatus {
  /** Days until release; negative once released. */
  daysLeft: number;
  released: boolean;
  severity: Severity;
}

export function releaseStatus(releaseDate: string | null, today: string): ReleaseStatus | null {
  if (!releaseDate || !isIsoDate(releaseDate)) return null;
  const daysLeft = daysBetween(today, releaseDate);
  const severity: Severity =
    daysLeft <= RELEASE_CRITICAL_DAYS
      ? 'critical'
      : daysLeft <= RELEASE_WARNING_DAYS
        ? 'warning'
        : 'ok';
  return { daysLeft, released: daysLeft < 0, severity };
}

export function isReleased(releaseDate: string | null, today: string): boolean {
  return releaseStatus(releaseDate, today)?.released ?? false;
}

/** True when the soldier is still serving but leaves within the horizon. */
export function isLeavingWithin(
  releaseDate: string | null,
  today: string,
  horizonDays: number,
): boolean {
  const status = releaseStatus(releaseDate, today);
  return status !== null && !status.released && status.daysLeft <= horizonDays;
}

/** Days of service left, with no release date treated as staying indefinitely. */
export function daysOfServiceLeft(releaseDate: string | null, today: string): number {
  return releaseStatus(releaseDate, today)?.daysLeft ?? Number.POSITIVE_INFINITY;
}
