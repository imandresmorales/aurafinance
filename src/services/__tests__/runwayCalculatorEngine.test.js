import { describe, it, expect } from 'vitest';
import { calculateFinancialRunway, RUNWAY_TIERS } from '../runwayCalculatorEngine';

describe('runwayCalculatorEngine - Financial Runway and Survival Duration', () => {
  it('calculates standard and survival runway accurately', () => {
    const result = calculateFinancialRunway({
      liquidBalance: 6000,
      monthlyFixedBurn: 1000,
      monthlyDiscretionaryBurn: 500,
      subscriptions: [{ name: 'Netflix', amount: 20, frequency: 'monthly', status: 'active' }],
      asOfDate: '2026-10-01',
    });

    expect(result.liquidBalance).toBe(6000);
    expect(result.totalStandardBurn).toBe(1520); // 1000 + 500 + 20
    expect(result.totalSurvivalBurn).toBe(1000);
    expect(result.standardRunwayMonths).toBeCloseTo(3.9, 1);
    expect(result.survivalRunwayMonths).toBe(6.0);
    expect(result.tier).toBe(RUNWAY_TIERS.MODERATE);
    expect(result.extraMonthsFromDiscretionary).toBeGreaterThan(2);
  });

  it('assigns critical tier when runway is under 1 month', () => {
    const result = calculateFinancialRunway({
      liquidBalance: 500,
      monthlyFixedBurn: 1200,
      monthlyDiscretionaryBurn: 400,
    });

    expect(result.tier).toBe(RUNWAY_TIERS.CRITICAL);
    expect(result.standardRunwayMonths).toBeLessThan(1);
  });

  it('assigns fortress tier when liquid runway exceeds 12 months', () => {
    const result = calculateFinancialRunway({
      liquidBalance: 30000,
      monthlyFixedBurn: 1500,
      monthlyDiscretionaryBurn: 500,
    });

    expect(result.tier).toBe(RUNWAY_TIERS.FORTRESS);
    expect(result.standardRunwayMonths).toBe(15.0);
  });
});
