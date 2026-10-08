import { describe, it, expect } from 'vitest';
import {
  recalculateGoalDelta,
  rebalanceWindfallAcrossGoals,
} from '../goalRecalculatorEngine';

describe('goalRecalculatorEngine', () => {
  const sampleGoal = {
    id: 'g-emergency',
    name: 'Fondo de Emergencia',
    targetAmount: 10000,
    currentAmount: 4000,
    monthlyContribution: 500,
    targetDate: '2027-12-31',
    priority: 'HIGH',
    category: 'EMERGENCY',
  };

  describe('recalculateGoalDelta', () => {
    it('calculates time acceleration from an extraordinary windfall deposit', () => {
      const result = recalculateGoalDelta(sampleGoal, 2000);

      expect(result.goalId).toBe('g-emergency');
      expect(result.isWindfall).toBe(true);
      expect(result.isWithdrawal).toBe(false);
      expect(result.originalState.currentAmount).toBe(4000);
      expect(result.newState.currentAmount).toBe(6000);
      expect(result.newState.percentage).toBe(60);
      expect(result.impact.percentageGain).toBe(20);
      expect(result.impact.timeSavedMonths).toBeGreaterThan(0);
      expect(result.impact.timeSavedDays).toBeGreaterThan(0);
      expect(result.summaryText).toContain('adelanta tu meta');
    });

    it('handles windfall completing the goal 100%', () => {
      const result = recalculateGoalDelta(sampleGoal, 7000);

      expect(result.newState.currentAmount).toBe(11000);
      expect(result.newState.isCompleted).toBe(true);
      expect(result.summaryText).toContain('completa la meta al 100%');
    });

    it('calculates impact of emergency withdrawal with delayed deadline and increased monthly requirement', () => {
      const result = recalculateGoalDelta(sampleGoal, -1500);

      expect(result.isWithdrawal).toBe(true);
      expect(result.newState.currentAmount).toBe(2500);
      expect(result.newState.percentage).toBe(25);
      expect(result.impact.percentageGain).toBe(-15);
      expect(result.summaryText).toContain('Retiro de $1500.00 retrasa la meta');
    });

    it('handles zero delta gracefully', () => {
      const result = recalculateGoalDelta(sampleGoal, 0);

      expect(result.isWindfall).toBe(false);
      expect(result.isWithdrawal).toBe(false);
      expect(result.impact.percentageGain).toBe(0);
      expect(result.summaryText).toBe('Sin cambio en los fondos de la meta.');
    });

    it('handles goal with no targetDate or missing attributes gracefully', () => {
      const minimalGoal = {
        id: 'g-trip',
        name: 'Viaje Europa',
        targetAmount: 3000,
        currentAmount: 1000,
        monthlyContribution: 200,
      };

      const result = recalculateGoalDelta(minimalGoal, 500);
      expect(result.newState.currentAmount).toBe(1500);
      expect(result.newState.percentage).toBe(50);
      expect(result.impact.timeSavedMonths).toBeGreaterThanOrEqual(0);
    });
  });

  describe('rebalanceWindfallAcrossGoals', () => {
    const goals = [
      {
        id: 'g-1',
        name: 'Auto Usado',
        targetAmount: 5000,
        currentAmount: 4000, // needs 1000
        monthlyContribution: 200,
        priority: 'MEDIUM',
      },
      {
        id: 'g-2',
        name: 'Fondo Emergencia',
        targetAmount: 10000,
        currentAmount: 2000, // needs 8000
        monthlyContribution: 500,
        priority: 'CRITICAL',
      },
      {
        id: 'g-3',
        name: 'Laptop Gamer',
        targetAmount: 2000,
        currentAmount: 1500, // needs 500
        monthlyContribution: 100,
        priority: 'LOW',
      },
      {
        id: 'g-completed',
        name: 'Viaje Cusco',
        targetAmount: 1000,
        currentAmount: 1000, // completed (needs 0)
        monthlyContribution: 100,
        priority: 'HIGH',
      },
    ];

    it('returns empty array if no active goals or zero windfall', () => {
      expect(rebalanceWindfallAcrossGoals([], 1000)).toEqual([]);
      expect(rebalanceWindfallAcrossGoals(goals, 0)).toEqual([]);
    });

    it('rebalances via PRIORITY strategy (CRITICAL/HIGH gets funded first)', () => {
      const allocations = rebalanceWindfallAcrossGoals(goals, 3000, 'PRIORITY');

      expect(allocations.length).toBeGreaterThan(0);
      // g-2 has CRITICAL priority so it gets prioritized
      expect(allocations[0].goalId).toBe('g-2');
      expect(allocations[0].allocatedAmount).toBe(3000);
    });

    it('rebalances via PROPORTIONAL strategy', () => {
      const allocations = rebalanceWindfallAcrossGoals(goals, 1900, 'PROPORTIONAL');

      expect(allocations).toHaveLength(3); // 3 non-completed goals
      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(Math.round(totalAllocated)).toBe(1900);
    });

    it('rebalances via SNOWBALL strategy (smallest deficit funded first)', () => {
      const allocations = rebalanceWindfallAcrossGoals(goals, 1200, 'SNOWBALL');

      // Smallest deficit: g-3 (needs 500), then g-1 (needs 1000)
      expect(allocations[0].goalId).toBe('g-3');
      expect(allocations[0].allocatedAmount).toBe(500);
      expect(allocations[1].goalId).toBe('g-1');
      expect(allocations[1].allocatedAmount).toBe(700);
    });
  });
});
