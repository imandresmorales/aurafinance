import { describe, it, expect } from 'vitest';
import {
  parseCivilDate,
  formatCivilDate,
  isSameCivilDay,
  calculateCivilDaysDiff,
  addCivilInterval,
  generateNextCivilOccurrences,
  detectTimezoneOffsetDrift,
} from '../timezoneSafeScheduler';

describe('timezoneSafeScheduler', () => {
  it('parses civil date string correctly without midnight shift', () => {
    const d = parseCivilDate('2026-10-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9); // October is 9 (0-indexed)
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(12);
  });

  it('formats dates consistently to YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 5, 23, 59, 59); // Jan 5
    expect(formatCivilDate(d)).toBe('2026-01-05');

    const dStr = formatCivilDate('2026-11-20');
    expect(dStr).toBe('2026-11-20');
  });

  it('verifies same civil day comparison regardless of hours', () => {
    const a = new Date(2026, 5, 10, 1, 0, 0);
    const b = new Date(2026, 5, 10, 23, 30, 0);
    const c = new Date(2026, 5, 11, 0, 1, 0);

    expect(isSameCivilDay(a, b)).toBe(true);
    expect(isSameCivilDay(a, c)).toBe(false);
  });

  it('calculates civil days difference accurately across months and leap years', () => {
    expect(calculateCivilDaysDiff('2026-10-20', '2026-10-15')).toBe(5);
    expect(calculateCivilDaysDiff('2026-10-10', '2026-10-15')).toBe(-5);
    expect(calculateCivilDaysDiff('2026-10-15', '2026-10-15')).toBe(0);

    // Cross-month difference
    expect(calculateCivilDaysDiff('2026-11-01', '2026-10-31')).toBe(1);
  });

  it('adds intervals correctly with month end boundary handling', () => {
    // Normal month addition
    const res1 = addCivilInterval('2026-01-15', 1, 'months');
    expect(formatCivilDate(res1)).toBe('2026-02-15');

    // End of month rollover (Jan 31 -> Feb 28 in non-leap year 2027)
    const res2 = addCivilInterval('2027-01-31', 1, 'months');
    expect(formatCivilDate(res2)).toBe('2027-02-28');

    // Week addition
    const res3 = addCivilInterval('2026-05-01', 2, 'weeks');
    expect(formatCivilDate(res3)).toBe('2026-05-15');

    // Year addition
    const res4 = addCivilInterval('2026-03-10', 3, 'years');
    expect(formatCivilDate(res4)).toBe('2029-03-10');
  });

  it('generates upcoming recurring occurrences safely', () => {
    const ruleMonthly = { frequency: 'monthly' };
    const occurrences = generateNextCivilOccurrences(ruleMonthly, '2026-06-15', 4, '2026-06-15');

    expect(occurrences).toEqual([
      '2026-06-15',
      '2026-07-15',
      '2026-08-15',
      '2026-09-15',
    ]);

    const ruleWeekly = { frequency: 'weekly' };
    const weeklyOccurrences = generateNextCivilOccurrences(ruleWeekly, '2026-10-01', 3, '2026-10-01');

    expect(weeklyOccurrences).toEqual([
      '2026-10-01',
      '2026-10-08',
      '2026-10-15',
    ]);
  });

  it('detects timezone metadata cleanly without crash', () => {
    const diag = detectTimezoneOffsetDrift();
    expect(diag).toHaveProperty('timezone');
    expect(diag).toHaveProperty('offsetMinutes');
    expect(typeof diag.isDst).toBe('boolean');
    expect(diag.isoLocalSample).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
