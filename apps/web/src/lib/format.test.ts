import { describe, expect, it } from 'vitest';
import {
  count,
  formatAverage,
  formatDate,
  releaseLabel,
  releaseShort,
  seniorityLabel,
  serviceLeftLabel,
  updatedLabel,
} from './format';

const today = '2026-10-08';

describe('Hebrew counts', () => {
  it('uses the dual form for two', () => {
    expect(count(1, ['יום', 'יומיים', 'ימים'])).toBe('יום');
    expect(count(2, ['יום', 'יומיים', 'ימים'])).toBe('יומיים');
    expect(count(7, ['יום', 'יומיים', 'ימים'])).toBe('7 ימים');
  });
});

describe('dates', () => {
  it('formats short dates', () => {
    expect(formatDate('2026-10-08')).toBe('08.10.26');
    expect(formatDate(null)).toBe('');
  });

  it('formats averages to one decimal', () => {
    expect(formatAverage(6.55)).toBe('6.6');
    expect(formatAverage(7)).toBe('7.0');
  });
});

describe('release labels', () => {
  it('switches from months to days near the end', () => {
    expect(releaseLabel({ daysLeft: 130, released: false, severity: 'warning' })).toBe(
      'שחרור בעוד 4 חודשים',
    );
    expect(releaseLabel({ daysLeft: 2, released: false, severity: 'critical' })).toBe(
      'שחרור בעוד יומיים',
    );
    expect(releaseLabel({ daysLeft: -3, released: true, severity: 'critical' })).toBe('השתחרר');
    expect(releaseShort({ daysLeft: 70, released: false, severity: 'critical' })).toBe('בעוד 2 ח׳');
  });

  it('describes remaining service', () => {
    expect(serviceLeftLabel('2027-08-08', today)).toBe('נשאר עוד 10 חודשים');
    expect(serviceLeftLabel(null, today)).toBe('אין תאריך שחרור');
  });
});

describe('seniority', () => {
  it('reads naturally', () => {
    expect(seniorityLabel('2026-09-20', today)).toBe('חדש בצוות');
    expect(seniorityLabel('2026-04-08', today)).toBe('ותק 6 חודשים');
    expect(seniorityLabel('2025-08-08', today)).toBe('ותק שנה וחודשיים');
    expect(seniorityLabel('2023-10-08', today)).toBe('ותק 3 שנים');
    expect(seniorityLabel('2026-11-01', today)).toBe('מתחיל בקרוב');
  });
});

describe('updated label', () => {
  it('rounds to the nearest sensible unit', () => {
    expect(updatedLabel(today, today)).toBe('עודכן היום');
    expect(updatedLabel('2026-10-07', today)).toBe('עודכן אתמול');
    expect(updatedLabel('2026-09-17', today)).toBe('עודכן לפני 3 שבועות');
    expect(updatedLabel('2026-06-08', today)).toBe('עודכן לפני 4 חודשים');
  });
});
