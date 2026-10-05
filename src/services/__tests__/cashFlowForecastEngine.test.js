import { describe, it, expect } from 'vitest';
import { calculateCashFlowForecast } from '../cashFlowForecastEngine';

describe('cashFlowForecastEngine - 30/60/90 Day Cash Flow Forecasting', () => {
  it('projects daily cash flow trajectory over 90 days', () => {
    const recurringRules = [
      { id: 'r1', name: 'Salario', amount: 3000, type: 'income', frequency: 'monthly', startDate: '2026-10-01' },
      { id: 'r2', name: 'Alquiler', amount: 1000, type: 'expense', frequency: 'monthly', startDate: '2026-10-05' },
    ];

    const forecast = calculateCashFlowForecast({
      currentLiquidBalance: 2000,
      recurringRules,
      recentTransactions: [],
      startDate: '2026-10-01',
      safetyThreshold: 500,
      horizonDays: 90,
    });

    expect(forecast.initialBalance).toBe(2000);
    expect(forecast.timeline).toHaveLength(91); // Day 0 to 90
    expect(forecast.balanceAt30).toBeGreaterThan(forecast.initialBalance);
    expect(forecast.hasDeficitRisk).toBe(false);
    expect(forecast.isHealthy).toBe(true);
  });

  it('detects deficit and safety buffer breaches when expenses exceed funds', () => {
    const recurringRules = [
      { id: 'r1', name: 'Alquiler Caro', amount: 3500, type: 'expense', frequency: 'monthly', startDate: '2026-10-05' },
    ];

    const forecast = calculateCashFlowForecast({
      currentLiquidBalance: 1000,
      recurringRules,
      recentTransactions: [],
      startDate: '2026-10-01',
      safetyThreshold: 500,
      horizonDays: 30,
    });

    expect(forecast.hasDeficitRisk).toBe(true);
    expect(forecast.hasSafetyRisk).toBe(true);
    expect(forecast.deficitDate).toBe('2026-10-05');
    expect(forecast.minBalance).toBeLessThan(0);
  });

  it('incorporates discretionary daily burn rate from past transactions', () => {
    const recentTransactions = [
      { id: 't1', amount: 300, type: 'expense', date: '2026-09-01' },
      { id: 't2', amount: 300, type: 'expense', date: '2026-09-30' },
    ];

    const forecast = calculateCashFlowForecast({
      currentLiquidBalance: 5000,
      recurringRules: [],
      recentTransactions,
      startDate: '2026-10-01',
      horizonDays: 30,
    });

    expect(forecast.dailyDiscretionaryBurn).toBeGreaterThan(0);
    expect(forecast.balanceAt30).toBeLessThan(5000);
  });
});
