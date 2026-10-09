import { describe, it, expect } from 'vitest';
import { simulateDebtConsolidation } from '../debtConsolidationSimulator';

describe('debtConsolidationSimulator', () => {
  const highInterestDebts = [
    {
      id: '1',
      name: 'Tarjeta Oro',
      principalBalance: 5000,
      interestRate: 0.32, // 32%
      minimumMonthlyPayment: 200,
    },
    {
      id: '2',
      name: 'Tarjeta Clásica',
      principalBalance: 3000,
      interestRate: 0.26, // 26%
      minimumMonthlyPayment: 120,
    },
    {
      id: '3',
      name: 'Préstamo Nómina',
      principalBalance: 4000,
      interestRate: 0.22, // 22%
      minimumMonthlyPayment: 180,
    },
  ]; // Total balance: 12,000. Combined monthly minimums: 500. Weighted rate ~27.1%

  it('simulates debt consolidation with massive interest savings and monthly cash flow relief', () => {
    const report = simulateDebtConsolidation(highInterestDebts, {
      newAnnualRate: 0.12, // 12% consolidation loan
      newTermMonths: 36, // 3 years
      originationFeePct: 0.015, // 1.5% fee
    });

    expect(report.isViable).toBe(true);
    expect(report.currentStatusQuo.totalBalance).toBe(12000);
    expect(report.consolidatedOffer.consolidatedPrincipal).toBe(12180); // 12000 + 180 fee
    expect(report.consolidatedOffer.newAnnualRatePct).toBe(12);

    // Interest savings should exceed $2,000+ compared to 27% baseline
    expect(report.comparison.netInterestSavings).toBeGreaterThan(2000);
    expect(report.comparison.rateReductionPct).toBeGreaterThan(10);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('handles empty debts gracefully', () => {
    const report = simulateDebtConsolidation([]);
    expect(report.isViable).toBe(false);
    expect(report.reason).toContain('No hay deudas');
  });
});
