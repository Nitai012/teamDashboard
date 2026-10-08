import {
  type CoverageStatus,
  daysBetween,
  isIsoDate,
  monthsBetween,
  PLANNING_HORIZONS,
  releaseStatus,
  type ReleaseStatus,
} from '@team-radar/shared';

type Forms = readonly [one: string, two: string, many: string];

const DAYS: Forms = ['יום', 'יומיים', 'ימים'];
const WEEKS: Forms = ['שבוע', 'שבועיים', 'שבועות'];
const MONTHS: Forms = ['חודש', 'חודשיים', 'חודשים'];
const YEARS: Forms = ['שנה', 'שנתיים', 'שנים'];

/** Hebrew counted noun: "יום", "יומיים", "5 ימים". */
export function count(n: number, [one, two, many]: Forms): string {
  if (n === 1) return one;
  if (n === 2) return two;
  return `${n} ${many}`;
}

export const days = (n: number) => count(n, DAYS);
export const weeks = (n: number) => count(n, WEEKS);
export const months = (n: number) => count(n, MONTHS);
export const years = (n: number) => count(n, YEARS);

/** 2026-10-08 → 08.10.26 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso || !isIsoDate(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y?.slice(2)}`;
}

export function formatAverage(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

const monthsLeft = (daysLeft: number) => Math.max(1, Math.round(daysLeft / 30.44));

/** "שחרור בעוד 4 חודשים" */
export function releaseLabel(status: ReleaseStatus): string {
  if (status.released) return 'השתחרר';
  if (status.daysLeft === 0) return 'משתחרר היום';
  if (status.daysLeft <= 31) return `שחרור בעוד ${days(status.daysLeft)}`;
  return `שחרור בעוד ${months(monthsLeft(status.daysLeft))}`;
}

/** Compact form for table cells: "בעוד 4 ח׳". */
export function releaseShort(status: ReleaseStatus): string {
  if (status.released) return 'השתחרר';
  if (status.daysLeft === 0) return 'היום';
  if (status.daysLeft <= 31) return `בעוד ${days(status.daysLeft)}`;
  return `בעוד ${monthsLeft(status.daysLeft)} ח׳`;
}

/** "נשאר עוד 10 חודשים" */
export function serviceLeftLabel(releaseDate: string | null, today: string): string {
  const status = releaseStatus(releaseDate, today);
  if (!status) return 'אין תאריך שחרור';
  if (status.released) return 'השתחרר';
  if (status.daysLeft <= 31) return `נשאר ${days(status.daysLeft)}`;
  return `נשאר עוד ${months(monthsLeft(status.daysLeft))}`;
}

/** "ותק שנה ו־3 חודשים" */
export function seniorityLabel(startDate: string | null, today: string): string | null {
  if (!startDate || !isIsoDate(startDate)) return null;
  if (daysBetween(startDate, today) < 0) return 'מתחיל בקרוב';
  const total = monthsBetween(startDate, today);
  if (total < 1) return 'חדש בצוות';
  if (total < 12) return `ותק ${months(total)}`;
  const y = Math.floor(total / 12);
  const m = total % 12;
  const rest = m === 0 ? '' : m === 1 ? ' וחודש' : m === 2 ? ' וחודשיים' : ` ו־${m} חודשים`;
  return `ותק ${years(y)}${rest}`;
}

/** "עודכן לפני 3 שבועות" */
export function updatedLabel(date: string, today: string): string {
  const n = daysBetween(date, today);
  if (n <= 0) return 'עודכן היום';
  if (n === 1) return 'עודכן אתמול';
  if (n < 14) return `עודכן לפני ${days(n)}`;
  if (n < 60) return `עודכן לפני ${weeks(Math.round(n / 7))}`;
  return `עודכן לפני ${months(Math.round(n / 30.44))}`;
}

export const COVERAGE_LABEL: Record<CoverageStatus, string> = {
  covered: 'מכוסה',
  single: 'מחזיק יחיד',
  training: 'מכשירים מחליף',
  leaving: 'הידע עוזב',
  uncovered: 'אין כיסוי',
};

export function horizonLabel(horizonDays: number): string {
  return PLANNING_HORIZONS.find((h) => h.days === horizonDays)?.label ?? days(horizonDays);
}
