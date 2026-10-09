import { describe, it, expect } from 'vitest';
import { calculateAnnualInterestCostSummary } from '../annualInterestCostEngine.js';

describe('annualInterestCostEngine', () => {
  it('returns empty safe defaults when debts array is empty', () => {
    const res = calculateAnnualInterestCostSummary([], 25);
    expect(res.totalBalance).toBe(0);
    expect(res.totalAnnualInterest).toBe(0);
    expect(res.debtsBreakdown).toHaveLength(0);
    expect(res.highestInterestDrainer).toBeNull();
    expect(res.awarenessAlerts[0]).toContain('No tienes deudas activas');
  });

  it('calculates annual interest, monthly interest, and work hours lost accurately', () => {
    const debts = [
      {
        id: 'card-1',
        name: 'Tarjeta Oro',
        type: 'CREDIT_CARD',
        balance: 5000,
        apr: 24, // 5000 * 0.24 = 1200 / yr = 100 / mo
        monthlyPayment: 250,
        annualFee: 50 // Total annual interest/cost = 1250
      },
      {
        id: 'loan-1',
        name: 'Préstamo Auto',
        type: 'AUTO_LOAN',
        balance: 15000,
        apr: 8, // 15000 * 0.08 = 1200 / yr = 100 / mo
        monthlyPayment: 400,
        annualFee: 0
      }
    ];

    // Wage: $25 / hour
    const res = calculateAnnualInterestCostSummary(debts, 25);

    expect(res.totalBalance).toBe(20000);
    expect(res.totalAnnualInterest).toBe(2450); // 1250 + 1200
    expect(res.totalMonthlyInterest).toBeCloseTo(2450 / 12, 2);
    expect(res.totalWorkHoursLost).toBe(98); // 2450 / 25
    expect(res.totalWorkDaysLost).toBe(12.25); // 98 / 8
    expect(res.highestInterestDrainer.name).toBe('Tarjeta Oro');
    expect(res.highestAprDrainer.apr).toBe(24);

    // Card 1 interest ratio: 1250/12 = 104.17 / 250 = 41.7%
    const cardBreakdown = res.debtsBreakdown.find(d => d.id === 'card-1');
    expect(cardBreakdown.interestRatioPercent).toBeCloseTo(41.7, 1);
    expect(cardBreakdown.workHoursLost).toBe(50); // 1250 / 25
  });

  it('computes future opportunity cost projections', () => {
    const debts = [
      {
        id: 'c1',
        name: 'Revolving',
        balance: 10000,
        apr: 20, // 2000/yr
        monthlyPayment: 300
      }
    ];

    const res = calculateAnnualInterestCostSummary(debts, 20, { investmentYieldAnnual: 0.10 });

    expect(res.totalAnnualInterest).toBe(2000);
    // FV for 5 yrs at 10%: 2000 * ((1.10^5 - 1)/0.10) = 2000 * 6.1051 = 12210.20
    expect(res.opportunityCost.in5Years).toBeCloseTo(12210.20, 1);
    expect(res.opportunityCost.in10Years).toBeGreaterThan(res.opportunityCost.in5Years);
    expect(res.awarenessAlerts.length).toBeGreaterThanOrEqual(2);
  });
});
