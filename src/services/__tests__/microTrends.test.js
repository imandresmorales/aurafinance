import { describe, it, expect } from 'vitest';
import { calculateMicroTrends } from '../microTrendsEngine';

describe('Micro Trends Engine - Statistical Spending Shifts', () => {
  const transactions = [
    // Current month (2026-06)
    { id: '1', type: 'EXPENSE', amount: 300, date: '2026-06-05' },
    { id: '2', type: 'EXPENSE', amount: 300, date: '2026-06-15' },
    // Baseline months
    { id: '3', type: 'EXPENSE', amount: 200, date: '2026-05-10' },
    { id: '4', type: 'EXPENSE', amount: 200, date: '2026-04-10' },
  ];

  it('calculates statistical shifts across rolling baseline', () => {
    const trends = calculateMicroTrends(transactions, '2026-06');

    expect(trends.period).toBe('2026-06');
    expect(trends.metrics).toHaveLength(3);

    const dailyBurn = trends.metrics.find((m) => m.id === 'daily-burn');
    expect(dailyBurn).toBeDefined();
    expect(dailyBurn.currentValue).toBeGreaterThan(0);
    expect(dailyBurn.diffPercent).toBeDefined();
  });

  it('handles empty datasets safely without NaN', () => {
    const trends = calculateMicroTrends([], '2026-06');
    expect(trends.metrics).toHaveLength(3);
    expect(trends.metrics[0].currentValue).toBe(0);
    expect(trends.metrics[0].diffPercent).toBe(0);
  });
});
