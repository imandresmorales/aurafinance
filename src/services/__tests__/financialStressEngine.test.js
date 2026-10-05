import { describe, it, expect } from 'vitest';
import {
  STRESS_SCENARIOS,
  STRESS_TIERS,
  simulateFinancialStress,
} from '../financialStressEngine';

describe('financialStressEngine', () => {
  const startDate = '2026-10-01';

  it('simulates income delay shock and detects cash flow insolvency', () => {
    const baseLiquidBalance = 1000;
    const recurringIncomes = [
      { id: 'inc-1', name: 'Nómina', amount: 2500, frequency: 'monthly', nextDate: '2026-10-05' },
    ];
    const recurringExpenses = [
      { id: 'exp-1', name: 'Alquiler', amount: 1200, frequency: 'monthly', nextDate: '2026-10-02' },
      { id: 'exp-2', name: 'Servicios', amount: 300, frequency: 'monthly', nextDate: '2026-10-10' },
    ];

    // Simulate 30 days income delay
    const result = simulateFinancialStress({
      baseLiquidBalance,
      recurringIncomes,
      recurringExpenses,
      dailyDiscretionaryBurn: 10,
      scenarioType: STRESS_SCENARIOS.INCOME_DELAY,
      scenarioParams: { delayDays: 30 },
      horizonDays: 60,
      startDate,
    });

    expect(result.hasInsolvencyRisk).toBe(true);
    expect(result.insolvencyDate).toBeDefined();
    expect(result.maxDeficit).toBeGreaterThan(0);
    expect(result.daysInNegative).toBeGreaterThan(0);
    expect(result.resilienceScore).toBeLessThan(70);
    expect(result.recommendedMitigations.length).toBeGreaterThan(0);
  });

  it('simulates emergency expense shock on high-liquidity reserve', () => {
    const baseLiquidBalance = 10000;
    const recurringIncomes = [
      { id: 'inc-1', amount: 3000, frequency: 'monthly', nextDate: '2026-10-15' },
    ];
    const recurringExpenses = [
      { id: 'exp-1', amount: 1500, frequency: 'monthly', nextDate: '2026-10-05' },
    ];

    // Shock: $2,500 emergency repair on day 10
    const result = simulateFinancialStress({
      baseLiquidBalance,
      recurringIncomes,
      recurringExpenses,
      scenarioType: STRESS_SCENARIOS.EMERGENCY_EXPENSE,
      scenarioParams: { emergencyCost: 2500, emergencyDayOffset: 10 },
      horizonDays: 60,
      startDate,
    });

    expect(result.hasInsolvencyRisk).toBe(false);
    expect(result.maxDeficit).toBe(0);
    expect(result.daysInNegative).toBe(0);
    expect(result.resilienceScore).toBeGreaterThanOrEqual(80);
    expect(result.resilienceTier).toMatch(/RESILIENT|FORTRESS/);
  });

  it('simulates combined crisis (income cut + delay + inflation)', () => {
    const baseLiquidBalance = 2000;
    const recurringIncomes = [
      { id: 'inc-1', amount: 4000, frequency: 'monthly', nextDate: '2026-10-01' },
    ];
    const recurringExpenses = [
      { id: 'exp-1', amount: 2000, frequency: 'monthly', nextDate: '2026-10-03' },
    ];

    const result = simulateFinancialStress({
      baseLiquidBalance,
      recurringIncomes,
      recurringExpenses,
      scenarioType: STRESS_SCENARIOS.COMBINED_CRISIS,
      scenarioParams: {
        incomeCutPct: 50,
        delayDays: 20,
        inflationSurgePct: 25,
        emergencyCost: 1000,
        emergencyDayOffset: 5,
      },
      horizonDays: 90,
      startDate,
    });

    expect(result.hasInsolvencyRisk).toBe(true);
    expect(result.stressedTrajectory.length).toBe(91);
    expect(result.baselineTrajectory.length).toBe(91);
    expect(result.finalStressedBalance).toBeLessThan(result.finalBaselineBalance);
  });
});
