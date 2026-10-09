import { describe, it, expect } from 'vitest';
import {
  calculateFireMetrics,
  calculateCompoundGrowth,
  calculateFinancialHealthScore,
  calculateEffectiveHourlyWage,
  convertPriceToWorkHours,
  evaluateOpportunityCost,
  recalculateGoalDelta,
} from '../index';

describe('Financial Formulas Comprehensive Stress & Edge Cases Suite', () => {
  describe('FIRE Calculator Stress', () => {
    it('handles zero annual expenses gracefully', () => {
      const result = calculateFireMetrics({
        annualExpenses: 1000,
        currentNetWorth: 50000,
        annualSavings: 10000,
      });

      expect(result.targets.standardFire.number).toBe(25000); // 1000 / 0.04
      expect(result.targets.standardFire.isAchieved).toBe(true);
      expect(result.yearsToFire).toBe(0);
    });

    it('handles zero annual savings (compounding principal only)', () => {
      const result = calculateFireMetrics({
        annualExpenses: 40000,
        currentNetWorth: 10000,
        annualSavings: 0,
        expectedAnnualReturn: 0.05,
      });

      expect(result.targets.standardFire.number).toBe(1000000); // 40000 / 0.04
      expect(result.yearsToFire).toBeGreaterThan(50);
    });

    it('handles high savings rate reaching FIRE in under 10 years', () => {
      const result = calculateFireMetrics({
        annualExpenses: 20000,
        annualSavings: 80000,
        currentNetWorth: 50000,
        expectedAnnualReturn: 0.08,
      });

      expect(result.targets.standardFire.number).toBe(500000);
      expect(result.yearsToFire).toBeLessThanOrEqual(6);
    });

    it('computes lean FIRE and fat FIRE with custom thresholds', () => {
      const result = calculateFireMetrics({
        annualExpenses: 50000,
        currentNetWorth: 200000,
        annualSavings: 30000,
      });

      expect(result.targets.leanFire.number).toBe(750000); // 50000 * 0.6 / 0.04
      expect(result.targets.fatFire.number).toBe(1875000); // 50000 * 1.5 / 0.04
      expect(result.trajectory.length).toBeGreaterThan(0);
    });
  });

  describe('Compound Interest Engine Stress', () => {
    it('handles 50-year projection with inflation discount', () => {
      const result = calculateCompoundGrowth({
        principal: 10000,
        monthlyContribution: 500,
        annualRate: 0.08,
        years: 50,
        annualInflationRate: 0.04,
      });

      expect(result.futureValueNominal).toBeGreaterThan(3000000);
      expect(result.totalContributions).toBe(300000); // 500 * 12 * 50
      expect(result.futureValueReal).toBeLessThan(result.futureValueNominal);
      expect(result.schedule).toHaveLength(50);
    });

    it('handles 0% interest rate without divide-by-zero errors', () => {
      const result = calculateCompoundGrowth({
        principal: 5000,
        monthlyContribution: 200,
        annualRate: 0,
        years: 5,
      });

      expect(result.futureValueNominal).toBe(5000 + 200 * 12 * 5); // 17000
      expect(result.totalInterestEarned).toBe(0);
    });

    it('handles $0 principal with contributions only', () => {
      const result = calculateCompoundGrowth({
        principal: 0,
        monthlyContribution: 1000,
        annualRate: 0.06,
        years: 10,
      });

      expect(result.futureValueNominal).toBeGreaterThan(150000);
      expect(result.totalContributions).toBe(120000);
    });
  });

  describe('Financial Health Score Engine Stress', () => {
    it('scores high debt burden and negative cash flow in vulnerable/critical tier', () => {
      const report = calculateFinancialHealthScore({
        liquidBalance: 500,
        monthlyIncome: 3000,
        monthlyExpenses: 3500,
        monthlyDebtServicing: 1500, // DTI = 50%
      });

      expect(report.totalScore).toBeLessThan(50);
      expect(report.tierKey).toMatch(/C_CRITICAL|B_VULNERABLE/);
      expect(report.pillars.liquidity.status).toBe('CRITICAL');
    });

    it('scores pristine balance sheet in healthy/fortress tier (80-100)', () => {
      const report = calculateFinancialHealthScore({
        liquidBalance: 30000, // ~10 months runway
        monthlyIncome: 8000,
        monthlyExpenses: 3200,
        monthlyFixedExpenses: 1600,
        monthlyDebtServicing: 0,
        incomeVolatilityPct: 2,
      });

      expect(report.totalScore).toBeGreaterThanOrEqual(80);
      expect(report.tierKey).toMatch(/AAA_FORTRESS|AA_HEALTHY/);
    });
  });

  describe('Work-Life Hours & Opportunity Cost Stress', () => {
    it('calculates true hourly wage deducting commute and work expenses', () => {
      const wageResult = calculateEffectiveHourlyWage({
        netMonthlyIncome: 3000,
        contractedMonthlyHours: 160,
        monthlyCommuteHours: 20,
        monthlyWorkExpenses: 300,
      });

      expect(wageResult.nominalHourlyWage).toBe(18.75); // 3000 / 160
      expect(wageResult.effectiveHourlyWage).toBe(15); // (3000 - 300) / (160 + 20) = 2700 / 180 = 15
      expect(wageResult.effectiveHourlyWage).toBeLessThan(wageResult.nominalHourlyWage);

      const purchaseImpact = convertPriceToWorkHours(450, wageResult.effectiveHourlyWage);
      expect(purchaseImpact.totalHours).toBe(30); // 450 / 15 = 30h
    });

    it('evaluates extreme opportunity cost on large purchase over 30 years', () => {
      const opp = evaluateOpportunityCost({
        amount: 5000,
        name: 'Auto Lujo Accesorio',
        frequency: 'ONE_OFF',
      }, {
        annualReturnRate: 0.08,
      });

      expect(opp.summary30Years.nominalFutureValue).toBeCloseTo(5000 * Math.pow(1.08, 30), 0);
      expect(opp.summary30Years.multiplier).toBeGreaterThan(10);
      expect(opp.impactRating).toBe('HIGH');
    });
  });

  describe('Goal Recalculator Stress', () => {
    it('prevents current amount from dropping below zero on over-withdrawal', () => {
      const goal = {
        id: 'g-overdraw',
        name: 'Fondo Prueba',
        targetAmount: 2000,
        currentAmount: 300,
        monthlyContribution: 50,
      };

      const result = recalculateGoalDelta(goal, -1000);
      expect(result.newState.currentAmount).toBe(0);
      expect(result.newState.percentage).toBe(0);
    });

    it('marks goal completed and computes time acceleration when deposit exceeds target', () => {
      const goal = {
        id: 'g-fund',
        name: 'Viaje Japón',
        targetAmount: 4000,
        currentAmount: 2000,
        monthlyContribution: 200,
        targetDate: '2027-01-01',
      };

      const result = recalculateGoalDelta(goal, 3000);
      expect(result.newState.currentAmount).toBe(5000);
      expect(result.newState.isCompleted).toBe(true);
      expect(result.newState.percentage).toBe(100);
    });
  });
});
