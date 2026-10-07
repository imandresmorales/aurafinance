import { describe, it, expect } from 'vitest';
import {
  calculateCompoundGrowth,
  compareGrowthRates,
} from '../compoundInterestEngine';

describe('compoundInterestEngine', () => {
  it('calculates pure principal compound growth accurately', () => {
    // $10,000 at 7% for 10 years without monthly contributions
    // A = 10000 * (1 + 0.07/12)^(120) = $20,096.61
    const result = calculateCompoundGrowth({
      principal: 10000,
      annualRate: 0.07,
      years: 10,
      monthlyContribution: 0,
    });

    expect(result.totalDeposited).toBe(10000);
    expect(result.futureValueNominal).toBeCloseTo(20096.61, 0);
    expect(result.totalInterestEarned).toBeCloseTo(10096.61, 0);
    expect(result.interestMultiplier).toBeCloseTo(2.01, 1);
    expect(result.ruleOf72Years).toBeCloseTo(10.3, 1);
    expect(result.schedule).toHaveLength(10);
  });

  it('calculates compound growth with monthly deposits', () => {
    // $0 initial, $500/mo at 8% for 20 years
    // Total deposited = $120,000
    // Expected FV approx $294,500+
    const result = calculateCompoundGrowth({
      principal: 0,
      annualRate: 0.08,
      years: 20,
      monthlyContribution: 500,
    });

    expect(result.totalDeposited).toBe(120000);
    expect(result.futureValueNominal).toBeGreaterThan(290000);
    expect(result.totalInterestEarned).toBeGreaterThan(170000);
    expect(result.schedule).toHaveLength(20);
    expect(result.schedule[19].endingBalance).toBe(result.futureValueNominal);
  });

  it('calculates real purchasing power with inflation discounting', () => {
    const result = calculateCompoundGrowth({
      principal: 10000,
      annualRate: 0.07,
      years: 10,
      monthlyContribution: 200,
      annualInflationRate: 0.03, // 3% inflation
    });

    expect(result.futureValueNominal).toBeGreaterThan(result.futureValueReal);
    expect(result.schedule[9].realPurchasingPower).toBeLessThan(result.schedule[9].endingBalance);
  });

  it('compares multiple investment growth rates side-by-side', () => {
    const comparisons = compareGrowthRates({
      principal: 5000,
      monthlyContribution: 300,
      years: 15,
      rates: [0.0, 0.02, 0.07, 0.10],
    });

    expect(comparisons).toHaveLength(4);

    // Passive 0% vs 10%
    const zeroRate = comparisons.find((c) => c.rate === 0.0);
    const highRate = comparisons.find((c) => c.rate === 0.10);

    expect(zeroRate.futureValue).toBe(5000 + 300 * 180); // exactly $59,000
    expect(zeroRate.interestEarned).toBe(0);
    expect(highRate.futureValue).toBeGreaterThan(120000);
    expect(highRate.interestEarned).toBeGreaterThan(60000);
  });
});
