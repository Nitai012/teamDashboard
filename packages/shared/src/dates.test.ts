import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  daysOfServiceLeft,
  isIsoDate,
  isLeavingWithin,
  monthsBetween,
  releaseStatus,
  todayIso,
} from './dates.js';

describe('isIsoDate', () => {
  it('accepts real calendar dates only', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-2-3')).toBe(false);
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe('todayIso', () => {
  it('formats the local date', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('daysBetween', () => {
  it('counts whole days across a DST change', () => {
    expect(daysBetween('2026-03-26', '2026-03-28')).toBe(2);
    expect(daysBetween('2026-10-08', '2026-10-01')).toBe(-7);
  });

  it('rejects invalid input', () => {
    expect(() => daysBetween('nope', '2026-01-01')).toThrow(RangeError);
  });
});

describe('monthsBetween', () => {
  it('counts completed months', () => {
    expect(monthsBetween('2025-08-15', '2026-10-14')).toBe(13);
    expect(monthsBetween('2025-08-15', '2026-10-15')).toBe(14);
    expect(monthsBetween('2026-10-15', '2026-10-01')).toBe(0);
  });
});

describe('releaseStatus', () => {
  const today = '2026-10-08';

  it('returns null without a valid date', () => {
    expect(releaseStatus(null, today)).toBeNull();
    expect(releaseStatus('soon', today)).toBeNull();
  });

  it('grades severity by days left', () => {
    expect(releaseStatus('2026-12-01', today)?.severity).toBe('critical');
    expect(releaseStatus('2027-03-01', today)?.severity).toBe('warning');
    expect(releaseStatus('2027-10-01', today)?.severity).toBe('ok');
  });

  it('marks past dates as released', () => {
    expect(releaseStatus('2026-10-07', today)).toMatchObject({ released: true, daysLeft: -1 });
    expect(releaseStatus('2026-10-08', today)).toMatchObject({ released: false, daysLeft: 0 });
  });
});

describe('isLeavingWithin', () => {
  it('only counts soldiers still serving', () => {
    expect(isLeavingWithin('2026-12-01', '2026-10-08', 92)).toBe(true);
    expect(isLeavingWithin('2027-06-01', '2026-10-08', 92)).toBe(false);
    expect(isLeavingWithin('2026-01-01', '2026-10-08', 92)).toBe(false);
    expect(isLeavingWithin(null, '2026-10-08', 92)).toBe(false);
  });
});

describe('daysOfServiceLeft', () => {
  it('treats a missing release date as staying', () => {
    expect(daysOfServiceLeft(null, '2026-10-08')).toBe(Number.POSITIVE_INFINITY);
    expect(daysOfServiceLeft('2026-10-18', '2026-10-08')).toBe(10);
  });
});
