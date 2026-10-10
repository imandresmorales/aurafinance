import { describe, it, expect } from 'vitest';
import {
  generateAmortizationSchedule,
  compareAmortizationSystems,
  AMORTIZATION_SYSTEMS
} from '../amortizationEngine.js';
import {
  simulatePayoffStrategy,
  compareDebtPayoffStrategies
} from '../debtPayoffStrategiesEngine.js';
import {
  calculateEarlyPrincipalPayoff
} from '../earlyPrincipalPayoffEngine.js';
import {
  calculateEffectiveAPR,
  rankDebtsByTrueCost
} from '../effectiveRateEngine.js';

describe('Commit 137: Amortization Formulas and Payment Optimization Stress Tests', () => {
  describe('Amortization Engine Edge Cases & Mathematical Invariants', () => {
    it('verifies exact balance reduction to zero across all three systems', () => {
      const systems = ['FRENCH', 'GERMAN', 'AMERICAN'];
      systems.forEach((system) => {
        const scheduleData = generateAmortizationSchedule({
          principal: 15000,
          annualRate: 0.12,
          termMonths: 24,
          system
        });

        expect(scheduleData.schedule).toHaveLength(24);
        const lastEntry = scheduleData.schedule[scheduleData.schedule.length - 1];
        expect(lastEntry.endingBalance).toBe(0);
        expect(scheduleData.totalPaid).toBeCloseTo(scheduleData.principal + scheduleData.totalInterestPaid, 2);
      });
    });

    it('handles 0% interest rate without divide-by-zero errors', () => {
      const res = generateAmortizationSchedule({
        principal: 6000,
        annualRate: 0,
        termMonths: 12,
        system: 'FRENCH'
      });

      expect(res.totalInterestPaid).toBe(0);
      expect(res.totalPaid).toBe(6000);
      expect(res.firstPaymentAmount).toBe(500); // 6000 / 12
      expect(res.schedule[11].endingBalance).toBe(0);
    });

    it('correctly models ultra-short term (1 month) and long term (360 months)', () => {
      // 1 month
      const shortTerm = generateAmortizationSchedule({
        principal: 1000,
        annualRate: 0.05,
        termMonths: 1,
        system: 'FRENCH'
      });
      expect(shortTerm.schedule).toHaveLength(1);
      expect(shortTerm.schedule[0].endingBalance).toBe(0);

      // 360 months (30 year mortgage)
      const longTerm = generateAmortizationSchedule({
        principal: 200000,
        annualRate: 0.065,
        termMonths: 360,
        system: 'FRENCH'
      });
      expect(longTerm.schedule).toHaveLength(360);
      expect(longTerm.schedule[359].endingBalance).toBe(0);
      expect(longTerm.totalPaid).toBeGreaterThan(longTerm.principal);
    });

    it('compares all three amortization systems and proves German is cheapest in total interest', () => {
      const comparison = compareAmortizationSystems(50000, 0.10, 48);

      expect(comparison.cheapestSystem).toBe('GERMAN');
      expect(comparison.systems.german.totalInterest).toBeLessThan(comparison.systems.french.totalInterest);
      expect(comparison.systems.french.totalInterest).toBeLessThan(comparison.systems.american.totalInterest);
      expect(comparison.systems.german.interestSavingsVsFrench).toBeGreaterThan(0);
      expect(comparison.systems.american.extraInterestVsFrench).toBeGreaterThan(0);
    });
  });

  describe('Early Principal Payoff Stress & Accelerations', () => {
    it('calculates interest saved and months reduced with monthly extra payments', () => {
      const res = calculateEarlyPrincipalPayoff(
        { principal: 20000, annualRate: 0.12, remainingMonths: 48 },
        { type: 'RECURRING_MONTHLY', amount: 200, strategy: 'REDUCE_TERM' }
      );

      expect(res.loan.remainingMonths).toBe(48);
      expect(res.results.monthsSaved).toBeGreaterThan(0);
      expect(res.results.interestSaved).toBeGreaterThan(0);
      expect(res.results.newTotalInterest).toBeLessThan(res.loan.baselineTotalInterest);
    });

    it('calculates lump-sum prepayment impact accurately', () => {
      const res = calculateEarlyPrincipalPayoff(
        { principal: 30000, annualRate: 0.08, remainingMonths: 60 },
        { type: 'LUMP_SUM', amount: 5000, appliedAtMonth: 6, strategy: 'REDUCE_TERM' }
      );

      expect(res.results.monthsSaved).toBeGreaterThan(0);
      expect(res.results.interestSaved).toBeGreaterThan(0);
    });
  });

  describe('Debt Payoff Optimization: Snowball vs Avalanche Dynamics', () => {
    const portfolio = [
      { id: 'card', name: 'Credit Card', principalBalance: 3000, interestRate: 0.24, minimumMonthlyPayment: 90 },
      { id: 'personal', name: 'Personal Loan', principalBalance: 8000, interestRate: 0.14, minimumMonthlyPayment: 220 },
      { id: 'car', name: 'Car Loan', principalBalance: 12000, interestRate: 0.07, minimumMonthlyPayment: 280 }
    ];

    it('demonstrates mathematical superiority of Avalanche over Snowball', () => {
      const report = compareDebtPayoffStrategies(portfolio, 200);

      const avalanche = report.strategies.avalanche;
      const snowball = report.strategies.snowball;

      // Avalanche must pay equal or less total interest than Snowball
      expect(avalanche.totalInterestPaid).toBeLessThanOrEqual(snowball.totalInterestPaid);
      // Both must be significantly faster than minimum payments only
      expect(avalanche.monthsToDebtFree).toBeLessThan(report.strategies.minimumOnly.monthsToDebtFree);
      expect(snowball.monthsToDebtFree).toBeLessThan(report.strategies.minimumOnly.monthsToDebtFree);

      // Verify payoff order
      // Avalanche targets highest rate first (24% Card, then 14% Personal, then 7% Car)
      expect(avalanche.payoffOrder[0].debtId).toBe('card');
      expect(avalanche.payoffOrder[1].debtId).toBe('personal');
      expect(avalanche.payoffOrder[2].debtId).toBe('car');

      // Snowball targets lowest balance first (3000 Card, then 8000 Personal, then 12000 Car)
      expect(snowball.payoffOrder[0].debtId).toBe('card');
      expect(snowball.payoffOrder[1].debtId).toBe('personal');
      expect(snowball.payoffOrder[2].debtId).toBe('car');
    });

    it('handles empty debts or debt portfolio with zero balances gracefully', () => {
      const emptySim = simulatePayoffStrategy([], 'AVALANCHE', 100);
      expect(emptySim.monthsToDebtFree).toBe(0);
      expect(emptySim.totalInterestPaid).toBe(0);
      expect(emptySim.payoffOrder).toHaveLength(0);

      const zeroBalSim = simulatePayoffStrategy([
        { id: '1', name: 'Zero Debt', principalBalance: 0, interestRate: 0.1, minimumMonthlyPayment: 20 }
      ], 'SNOWBALL', 50);
      expect(zeroBalSim.monthsToDebtFree).toBe(0);
      expect(zeroBalSim.totalInterestPaid).toBe(0);
    });
  });

  describe('Rate Conversion & Weighted APR Invariants', () => {
    it('computes effective CAT/APR including origination and recurring fees', () => {
      const cat = calculateEffectiveAPR({
        principal: 10000,
        nominalAnnualRate: 0.16,
        termMonths: 24,
        originationFeePct: 0.03, // 3%
        monthlyInsuranceFee: 15
      });

      expect(cat.effectiveAPRPct).toBeGreaterThan(16); // True cost exceeds nominal 16%
      expect(cat.feesBreakdown.originationFee).toBe(300);
      expect(cat.feesBreakdown.totalRecurringFees).toBe(360);
      expect(cat.severity).toBeDefined();
    });

    it('ranks debts portfolio by true annual cost', () => {
      const debts = [
        { id: '1', name: 'Low Rate No Fee', interestRate: 0.08, principalBalance: 5000, termMonths: 12 },
        { id: '2', name: 'High Rate With Fees', interestRate: 0.22, principalBalance: 5000, termMonths: 12, originationFeePct: 0.05 }
      ];
      const ranked = rankDebtsByTrueCost(debts);
      expect(ranked).toHaveLength(2);
      expect(ranked[0].debtId).toBe('2'); // Higher true cost ranked first
      expect(ranked[1].debtId).toBe('1');
    });
  });
});
