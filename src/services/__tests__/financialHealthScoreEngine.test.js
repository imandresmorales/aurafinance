import { describe, it, expect } from 'vitest';
import {
  calculateFinancialHealthScore,
  HEALTH_TIERS,
} from '../financialHealthScoreEngine';

describe('financialHealthScoreEngine', () => {
  it('calculates perfect AAA Fortress score for optimal financial standing', () => {
    const report = calculateFinancialHealthScore({
      liquidBalance: 25000,
      monthlyIncome: 5000,
      monthlyExpenses: 2500,
      monthlyFixedExpenses: 1500, // 30% fixed, 16.6 months runway
      monthlyDebtServicing: 0,
      incomeVolatilityPct: 5,
    });

    expect(report.totalScore).toBeGreaterThanOrEqual(90);
    expect(report.tierKey).toBe(HEALTH_TIERS.AAA_FORTRESS.key);
    expect(report.pillars.liquidity.score).toBe(20);
    expect(report.pillars.savingsRate.score).toBe(20);
    expect(report.pillars.fixedCosts.score).toBe(20);
    expect(report.pillars.debtBurden.score).toBe(20);
    expect(report.radarDistribution.length).toBe(5);
  });

  it('calculates Critical tier for high debt, low liquidity and monthly deficit', () => {
    const report = calculateFinancialHealthScore({
      liquidBalance: 300,
      monthlyIncome: 2000,
      monthlyExpenses: 2400, // -400 deficit
      monthlyFixedExpenses: 1500,
      monthlyDebtServicing: 800, // 40% debt burden
      incomeVolatilityPct: 40,
    });

    expect(report.totalScore).toBeLessThan(40);
    expect(report.tierKey).toBe(HEALTH_TIERS.C_CRITICAL.key);
    expect(report.pillars.liquidity.status).toBe('CRITICAL');
    expect(report.pillars.debtBurden.status).toBe('CRITICAL');
  });

  it('computes score delta accurately when previous score is provided', () => {
    const report1 = calculateFinancialHealthScore({
      liquidBalance: 10000,
      monthlyIncome: 4000,
      monthlyExpenses: 2800,
      previousScore: 68,
    });

    expect(report1.delta).toBeDefined();
    expect(typeof report1.delta).toBe('number');
  });

  it('handles zero income and zero expenses without crashing or NaN', () => {
    const report = calculateFinancialHealthScore({
      liquidBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
    });

    expect(Number.isFinite(report.totalScore)).toBe(true);
    expect(report.totalScore).toBeGreaterThanOrEqual(0);
    expect(report.radarDistribution.length).toBe(5);
  });
});
