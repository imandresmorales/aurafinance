import { describe, it, expect } from 'vitest';
import {
  getDateRangeBounds,
  filterTransactionsByDateRange,
  DATE_PRESETS,
} from '../dateRangeEngine';

describe('Date Range Engine - Unified Multi-Period Selector', () => {
  const refDate = new Date('2026-06-15T12:00:00Z');

  it('calculates 7D range correctly', () => {
    const bounds = getDateRangeBounds('7D', null, null, refDate);
    expect(bounds.startDate).toBe('2026-06-09');
    expect(bounds.endDate).toBe('2026-06-15');
    expect(bounds.isWithinRange('2026-06-10')).toBe(true);
    expect(bounds.isWithinRange('2026-06-08')).toBe(false);
  });

  it('calculates CURRENT_MONTH range correctly', () => {
    const bounds = getDateRangeBounds('CURRENT_MONTH', null, null, refDate);
    expect(bounds.startDate).toBe('2026-06-01');
    expect(bounds.endDate).toBe('2026-06-30');
    expect(bounds.isWithinRange('2026-06-15')).toBe(true);
    expect(bounds.isWithinRange('2026-05-31')).toBe(false);
  });

  it('calculates QUARTER range for Q2 (June)', () => {
    const bounds = getDateRangeBounds('QUARTER', null, null, refDate);
    expect(bounds.startDate).toBe('2026-04-01');
    expect(bounds.endDate).toBe('2026-06-30');
    expect(bounds.label).toContain('Q2');
  });

  it('filters transactions accurately with bounds object', () => {
    const txList = [
      { id: '1', date: '2026-06-10', amount: 100 },
      { id: '2', date: '2026-05-15', amount: 200 },
      { id: '3', date: '2026-06-25', amount: 300 },
    ];

    const bounds = getDateRangeBounds('CURRENT_MONTH', null, null, refDate);
    const filtered = filterTransactionsByDateRange(txList, bounds);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((t) => t.id)).toEqual(['1', '3']);
  });
});
