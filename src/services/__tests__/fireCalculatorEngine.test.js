import { describe, it, expect } from 'vitest';
import { calculateFireMetrics } from '../fireCalculatorEngine';

describe('fireCalculatorEngine', () => {
  it('calculates Standard, Lean, Fat, Coast and Barista FIRE numbers accurately using 4% rule', () => {
    const report = calculateFireMetrics({
      currentNetWorth: 50000,
      annualExpenses: 40000,
      annualSavings: 15000,
      safeWithdrawalRate: 0.04, // 25x
      expectedAnnualReturn: 0.08,
      annualInflation: 0.03,
      currentAge: 30,
      targetRetirementAge: 60,
    });

    // Standard FIRE = 40,000 / 0.04 = $1,000,000
    expect(report.targets.standardFire.number).toBe(1000000);
    // Lean FIRE (60% of 40k = 24k) / 0.04 = $600,000
    expect(report.targets.leanFire.number).toBe(600000);
    // Fat FIRE (150% of 40k = 60k) / 0.04 = $1,500,000
    expect(report.targets.fatFire.number).toBe(1500000);
    // Barista FIRE (60% of 40k) / 0.04 = $600,000
    expect(report.targets.baristaFire.number).toBe(600000);

    // Coast FIRE target is substantially lower due to 30 years of compounding
    expect(report.targets.coastFire.number).toBeLessThan(report.targets.standardFire.number);

    // Progress
    expect(report.currentProgressPct).toBe(5); // 50,000 / 1,000,000 = 5%
    expect(report.yearsToFire).toBeGreaterThan(10);
    expect(report.yearsToFire).toBeLessThan(35);
  });

  it('identifies already achieved FIRE milestone when net worth exceeds target', () => {
    const report = calculateFireMetrics({
      currentNetWorth: 1200000,
      annualExpenses: 30000, // Standard FIRE = 750,000
      annualSavings: 10000,
    });

    expect(report.currentProgressPct).toBe(100);
    expect(report.targets.standardFire.isAchieved).toBe(true);
    expect(report.targets.leanFire.isAchieved).toBe(true);
    expect(report.yearsToFire).toBe(0);
    expect(report.passiveIncome.coveragePct).toBeGreaterThanOrEqual(100);
  });
});
