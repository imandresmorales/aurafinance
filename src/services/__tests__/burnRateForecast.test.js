import { describe, it, expect } from 'vitest';
import { calculateBurnRateForecast } from '../burnRateForecastEngine';

describe('Burn Rate & Month-End Forecast Engine', () => {
  // Use a fixed reference date: September 15th, 2026 (15 elapsed, 15 remaining in a 30-day month)
  const refDate = new Date('2026-09-15T12:00:00Z');

  const mockBudgets = [
    { id: 'b1', name: 'Alimentación', limit: 600 },
    { id: 'b2', name: 'Servicios', limit: 400 },
  ]; // Total budget = 1000

  it('calculates daily burn rate and safe daily allowance accurately for on-track budget', () => {
    // Spent 450 in 15 days -> 30/day -> projected 30 * 30 = 900 <= 1000
    const mockTx = [
      { id: '1', type: 'expense', amount: 300, date: '2026-09-05' },
      { id: '2', type: 'expense', amount: 150, date: '2026-09-10' },
      { id: '3', type: 'income', amount: 2000, date: '2026-09-01' },
    ];

    const result = calculateBurnRateForecast(mockTx, mockBudgets, refDate);

    expect(result.daysInMonth).toBe(30);
    expect(result.currentDay).toBe(15);
    expect(result.remainingDays).toBe(15);
    expect(result.monthProgressPercent).toBe(50);
    expect(result.totalSpentSoFar).toBe(450);
    expect(result.currentDailyBurnRate).toBe(30); // 450 / 15
    expect(result.projectedMonthEndExpense).toBe(900); // 30 * 30
    expect(result.budgetRemaining).toBe(550); // 1000 - 450
    expect(result.recommendedDailyAllowance).toBe(36.67); // 550 / 15
    expect(result.projectedVariance).toBe(100); // 1000 - 900 (favorable)
    expect(result.status).toBe('on_track');
  });

  it('identifies overspending and calculates strict daily allowance', () => {
    // Spent 800 in 15 days -> 53.33/day -> projected 1600 > 1000 * 1.1 (1100)
    const mockTx = [
      { id: '1', type: 'expense', amount: 800, date: '2026-09-05' },
    ];

    const result = calculateBurnRateForecast(mockTx, mockBudgets, refDate);

    expect(result.currentDailyBurnRate).toBe(53.33);
    expect(result.projectedMonthEndExpense).toBe(1600);
    expect(result.budgetRemaining).toBe(200);
    expect(result.recommendedDailyAllowance).toBe(13.33); // 200 / 15
    expect(result.projectedVariance).toBe(-600);
    expect(result.status).toBe('overspending');
    expect(result.message).toContain('Alerta: A este ritmo');
  });

  it('handles empty transactions or no budgets without division by zero errors', () => {
    const result = calculateBurnRateForecast([], [], refDate);
    expect(result.totalSpentSoFar).toBe(0);
    expect(result.currentDailyBurnRate).toBe(0);
    expect(result.projectedMonthEndExpense).toBe(0);
    expect(result.status).toBe('on_track');
  });
});
