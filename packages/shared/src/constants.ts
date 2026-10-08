/** Number of axes on the self-assessment hexagon. */
export const AXIS_COUNT = 6;

/** Index of the sixth axis, which each soldier personalises. */
export const PERSONAL_AXIS_INDEX = 5;

export const DEFAULT_AXES: readonly string[] = [
  'מקצועיות',
  'יוזמה',
  'עצמאות',
  'עבודת צוות',
  'מוצר',
  'אחר',
];

/** Suggested labels for the personal axis. Free text is also allowed. */
export const PERSONAL_AXIS_OPTIONS: readonly string[] = [
  'Networking',
  'Work-life balance',
  'סקרנות טכנולוגית',
  'ניהול',
  'הדרכה והעברת ידע',
  'תקשורת והצגה',
  'ארכיטקטורה ותכנון',
  'הבנה מבצעית',
  'איכות ובדיקות',
  'אבטחת מידע',
];

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_DEFAULT = 5;

export type SkillLevel = 0 | 1 | 2 | 3;

export interface SkillLevelInfo {
  value: SkillLevel;
  label: string;
  description: string;
}

export const SKILL_LEVELS: readonly SkillLevelInfo[] = [
  { value: 0, label: 'לא מכיר', description: 'לא עבד עם זה' },
  { value: 1, label: 'לומד', description: 'מכיר, עדיין צריך ליווי' },
  { value: 2, label: 'עצמאי', description: 'עובד לבד בביטחון' },
  { value: 3, label: 'מומחה', description: 'מוביל ויכול ללמד אחרים' },
];

/** The minimum level at which a soldier can carry a skill alone. */
export const CAPABLE_LEVEL: SkillLevel = 2;

export interface PlanningHorizon {
  days: number;
  label: string;
}

export const PLANNING_HORIZONS: readonly PlanningHorizon[] = [
  { days: 92, label: '3 חודשים' },
  { days: 183, label: 'חצי שנה' },
  { days: 365, label: 'שנה' },
];

export const DEFAULT_HORIZON_DAYS = 183;

/** Release within this many days is shown as critical, then as a warning. */
export const RELEASE_CRITICAL_DAYS = 92;
export const RELEASE_WARNING_DAYS = 183;

/** A placement older than this is flagged for an update. */
export const ASSESSMENT_STALE_DAYS = 90;
