import { describe, it, expect } from 'vitest';
import { buildSpendingHeatmap, DAYS_OF_WEEK } from '../spendingHeatmapEngine';

describe('Spending Heatmap Engine - Behavioral Consumption Matrix', () => {
  const transactions = [
    // Friday afternoon
    { id: 't1', type: 'EXPENSE', amount: 300, date: '2026-03-06T14:00:00Z', createdAt: '2026-03-06T14:00:00Z' },
    { id: 't2', type: 'EXPENSE', amount: 200, date: '2026-03-06T15:30:00Z', createdAt: '2026-03-06T15:30:00Z' },
    // Monday morning
    { id: 't3', type: 'EXPENSE', amount: 50, date: '2026-03-02T08:00:00Z', createdAt: '2026-03-02T08:00:00Z' },
  ];

  it('builds a 7x4 matrix and correctly calculates peak spending habits', () => {
    const heatmap = buildSpendingHeatmap(transactions);

    expect(heatmap.matrix).toHaveLength(7);
    expect(heatmap.matrix[0]).toHaveLength(4);
    expect(heatmap.grandTotalSpent).toBe(550);
    expect(heatmap.totalExpensesCount).toBe(3);

    // Peak cell should be Friday (dayIndex 4) afternoon (slotIndex 1)
    expect(heatmap.peakCell).not.toBeNull();
    expect(heatmap.peakCell.dayName).toBe('Viernes');
    expect(heatmap.peakCell.totalAmount).toBe(500);
    expect(heatmap.peakCell.intensity).toBe(1);
    expect(heatmap.insight).toContain('Viernes');
  });

  it('handles empty transaction sets without breaking', () => {
    const heatmap = buildSpendingHeatmap([]);

    expect(heatmap.matrix).toHaveLength(7);
    expect(heatmap.grandTotalSpent).toBe(0);
    expect(heatmap.peakCell).toBeNull();
    expect(heatmap.insight).toContain('uniformemente');
  });
});
