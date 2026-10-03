import { describe, it, expect } from 'vitest';
import { analyzeWindfallCorrelations } from '../correlationEngine';

describe('Correlation Engine - Extraordinary Income & Spending Velocity', () => {
  const transactions = [
    { id: '1', type: 'INCOME', amount: 1000, date: '2026-01-01' },
    { id: '2', type: 'INCOME', amount: 1000, date: '2026-02-01' },
    // Windfall event (>1.4x median)
    { id: '3', type: 'INCOME', amount: 5000, date: '2026-03-01', notes: 'Bono Anual' },
    // Trailing expenses in 14 days
    { id: '4', type: 'EXPENSE', amount: 1500, date: '2026-03-05' },
    { id: '5', type: 'EXPENSE', amount: 500, date: '2026-03-10' },
  ];

  it('identifies windfall events and computes retention rate', () => {
    const analysis = analyzeWindfallCorrelations(transactions);

    expect(analysis.windfallEvents).toHaveLength(1);
    const event = analysis.windfallEvents[0];
    expect(event.amount).toBe(5000);
    expect(event.trailingSpent14d).toBe(2000);
    expect(event.retainedAmount).toBe(3000);
    expect(event.retentionRate).toBe(60);
    expect(analysis.overallRetentionRate).toBe(60);
    expect(analysis.lifestyleInflationIndex).toBe(40);
  });

  it('handles empty transactions safely', () => {
    const analysis = analyzeWindfallCorrelations([]);
    expect(analysis.windfallEvents).toHaveLength(0);
    expect(analysis.overallRetentionRate).toBe(100);
  });
});
