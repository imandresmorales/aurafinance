import { describe, it, expect } from 'vitest';
import {
  computeStatisticalParameters,
  calculateCategorySpendingBaselines,
  detectStandardDeviationAnomalies,
  detectMonthlyMacroAnomalies,
  ANOMALY_SEVERITY,
} from '../spendingAnomalyEngine';

describe('spendingAnomalyEngine', () => {
  it('computes mean, sample standard deviation and median accurately', () => {
    const data = [10, 20, 20, 40, 50, 60, 80]; // sum = 280, n=7, mean=40, median=40
    const stats = computeStatisticalParameters(data);

    expect(stats.count).toBe(7);
    expect(stats.mean).toBe(40);
    expect(stats.median).toBe(40);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(80);
    expect(stats.stdDev).toBeGreaterThan(20);
  });

  it('detects statistical Z-score outliers on high variance transactions', () => {
    // Normal restaurant expenses between $20 and $35, with one huge outlier of $250
    const transactions = [
      { id: '1', type: 'EXPENSE', category: 'Restaurantes', amount: 22, concept: 'Almuerzo' },
      { id: '2', type: 'EXPENSE', category: 'Restaurantes', amount: 28, concept: 'Cena' },
      { id: '3', type: 'EXPENSE', category: 'Restaurantes', amount: 25, concept: 'Cafetería' },
      { id: '4', type: 'EXPENSE', category: 'Restaurantes', amount: 30, concept: 'Brunch' },
      { id: '5', type: 'EXPENSE', category: 'Restaurantes', amount: 24, concept: 'Piqueo' },
      { id: '6', type: 'EXPENSE', category: 'Restaurantes', amount: 260, concept: 'Banquete Lujoso' }, // High Outlier
    ];

    const anomalies = detectStandardDeviationAnomalies(transactions, { minZScore: 2.0 });

    expect(anomalies.length).toBe(1);
    expect(anomalies[0].transactionId).toBe('6');
    expect(anomalies[0].concept).toBe('Banquete Lujoso');
    expect(anomalies[0].zScore).toBeGreaterThanOrEqual(2.0);
    expect(anomalies[0].severity).toMatch(/MODERATE|HIGH|CRITICAL/);
    expect(anomalies[0].pctOverMean).toBeGreaterThan(100);
  });

  it('ignores normal transactions and returns empty array when no outliers exist', () => {
    const transactions = [
      { id: '1', type: 'EXPENSE', category: 'Supermercado', amount: 100 },
      { id: '2', type: 'EXPENSE', category: 'Supermercado', amount: 110 },
      { id: '3', type: 'EXPENSE', category: 'Supermercado', amount: 95 },
      { id: '4', type: 'EXPENSE', category: 'Supermercado', amount: 105 },
    ];

    const anomalies = detectStandardDeviationAnomalies(transactions, { minZScore: 2.0 });
    expect(anomalies).toHaveLength(0);
  });

  it('detects monthly macro anomalies on historical monthly totals', () => {
    const monthlySpend = {
      '2026-01': 1500,
      '2026-02': 1550,
      '2026-03': 1480,
      '2026-04': 1520,
      '2026-05': 1510,
      '2026-06': 3800, // Spike month
    };

    const anomalies = detectMonthlyMacroAnomalies(monthlySpend);
    expect(anomalies.length).toBe(1);
    expect(anomalies[0].month).toBe('2026-06');
    expect(anomalies[0].zScore).toBeGreaterThan(1.8);
    expect(anomalies[0].pctOverAverage).toBeGreaterThan(80);
  });
});
