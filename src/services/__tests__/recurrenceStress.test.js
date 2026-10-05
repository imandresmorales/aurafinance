import { describe, it, expect } from 'vitest';
import { calculateCashFlowForecast } from '../cashFlowForecastEngine';
import { calculateFinancialRunway } from '../runwayCalculatorEngine';
import {
  parseCivilDate,
  formatCivilDate,
  addCivilInterval,
  generateNextCivilOccurrences,
  calculateCivilDaysDiff,
} from '../timezoneSafeScheduler';
import {
  estimateVariableBillAmount,
  generateInflationAdjustedProjections,
} from '../variableRecurringEngine';

describe('Recurrence & Cash Flow Stress Testing Suite', () => {
  const baseStartDate = '2026-01-01';

  describe('Long-range Multi-Horizon Cash Flow Projections', () => {
    it('accurately projects 90-day balance trajectory with recurring income and expense streams', () => {
      const currentLiquidBalance = 10000;
      const recurringRules = [
        { id: 'inc-salary', type: 'income', amount: 3000, frequency: 'monthly', nextDueDate: '2026-01-15' },
        { id: 'exp-rent', type: 'expense', amount: 1200, frequency: 'monthly', nextDueDate: '2026-01-05' },
        { id: 'exp-groceries', type: 'expense', amount: 150, frequency: 'weekly', nextDueDate: '2026-01-02' },
        { id: 'exp-utils', type: 'expense', amount: 180, frequency: 'monthly', nextDueDate: '2026-01-20' },
        { id: 'exp-cloud', type: 'expense', amount: 85, frequency: 'monthly', nextDueDate: '2026-01-28' },
      ];

      const forecast = calculateCashFlowForecast({
        currentLiquidBalance,
        recurringRules,
        horizonDays: 90,
        startDate: baseStartDate,
      });

      expect(forecast.timeline).toHaveLength(91); // Day 0 to Day 90
      expect(forecast.initialBalance).toBe(10000);

      // Verify no NaN or undefined values exist throughout the projection
      forecast.timeline.forEach((point) => {
        expect(Number.isFinite(point.balance)).toBe(true);
        expect(Number.isFinite(point.inflow)).toBe(true);
        expect(Number.isFinite(point.outflow)).toBe(true);
        expect(point.date).toBeDefined();
      });

      // Verify metrics
      expect(forecast.balanceAt90).toBeGreaterThan(0);
      expect(forecast.minBalance).toBeGreaterThan(0);
      expect(forecast.hasDeficitRisk).toBe(false);
    });

    it('handles heavy volume stress test (50 concurrent recurring commitments)', () => {
      const currentLiquidBalance = 50000;
      const heavyRules = [];

      for (let i = 0; i < 50; i++) {
        heavyRules.push({
          id: `item-${i}`,
          type: i % 4 === 0 ? 'income' : 'expense',
          amount: 50 + (i * 10),
          frequency: i % 2 === 0 ? 'monthly' : 'weekly',
          nextDueDate: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
        });
      }

      const t0 = performance.now();
      const forecast = calculateCashFlowForecast({
        currentLiquidBalance,
        recurringRules: heavyRules,
        horizonDays: 90,
        startDate: baseStartDate,
      });
      const durationMs = performance.now() - t0;

      expect(forecast.timeline).toHaveLength(91);
      expect(durationMs).toBeLessThan(500); // Sub-second performance
    });
  });

  describe('Calendar Boundary & Leap Year Stress', () => {
    it('properly preserves Feb 28/29 transitions across leap year 2028', () => {
      // 2028 is a leap year with Feb 29
      const jan31 = '2028-01-31';
      const feb29 = addCivilInterval(jan31, 1, 'months', true);
      expect(formatCivilDate(feb29)).toBe('2028-02-29');

      // Add 1 more month -> Mar 31
      const mar31 = addCivilInterval(feb29, 1, 'months', true);
      expect(formatCivilDate(mar31)).toBe('2028-03-31');

      // Non-leap year 2029 -> Feb 28
      const jan31_2029 = '2029-01-31';
      const feb28_2029 = addCivilInterval(jan31_2029, 1, 'months', true);
      expect(formatCivilDate(feb28_2029)).toBe('2029-02-28');
    });

    it('generates 60 monthly occurrences without date drift or skipping months', () => {
      const occurrences = generateNextCivilOccurrences(
        { frequency: 'monthly' },
        '2026-01-15',
        60,
        '2026-01-15'
      );

      expect(occurrences).toHaveLength(60);
      expect(occurrences[0]).toBe('2026-01-15');
      expect(occurrences[59]).toBe('2030-12-15'); // 5 years later

      // Ensure every month has day === 15
      occurrences.forEach((occ) => {
        const d = parseCivilDate(occ);
        expect(d.getDate()).toBe(15);
      });
    });

    it('stress tests rapid day differences across 1,000 pairs of dates', () => {
      for (let i = 1; i <= 1000; i++) {
        const d1 = addCivilInterval('2026-01-01', i, 'days');
        const diff = calculateCivilDaysDiff(d1, '2026-01-01');
        expect(diff).toBe(i);
      }
    });
  });

  describe('Variable Compound Inflation & Runway Stress', () => {
    it('projects 10 years of compounding inflation without floating point drift', () => {
      const rule = { name: 'Cloud Infrastructure', amount: 100, frequency: 'monthly' };
      const projections = generateInflationAdjustedProjections(rule, 10, 0.04);

      expect(projections).toHaveLength(10);
      expect(projections[0].estimatedAmount).toBe(104);
      expect(projections[9].estimatedAmount).toBeGreaterThan(140);

      projections.forEach((p) => {
        expect(Number.isFinite(p.estimatedAmount)).toBe(true);
        expect(Number.isFinite(p.annualTotalCost)).toBe(true);
      });
    });

    it('stress tests runway calculator under severe zero-income burn conditions', () => {
      const runway = calculateFinancialRunway({
        liquidBalance: 15000,
        monthlyFixedBurn: 1500,
        monthlyDiscretionaryBurn: 1000,
        subscriptions: [{ amount: 50, frequency: 'monthly' }],
        asOfDate: '2026-01-01',
      });

      // Total standard burn = 1500 + 1000 + 50 = 2550
      // Standard runway = 15000 / 2550 = 5.9 months (rounded to 1 dec)
      expect(runway.standardRunwayMonths).toBe(5.9);
      // Survival runway = 15000 / 1500 = 10 months
      expect(runway.survivalRunwayMonths).toBe(10);
      expect(runway.tier).toBe('moderate');
      expect(runway.extraMonthsFromDiscretionary).toBe(4.1);
    });
  });
});
