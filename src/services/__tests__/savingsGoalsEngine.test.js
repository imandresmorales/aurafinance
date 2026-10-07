import { describe, it, expect } from 'vitest';
import {
  calculateRequiredMonthlySavings,
  calculateProjectedCompletionDate,
  evaluateGoalProgress,
  distributeSurplusAmongGoals,
  getSavingsGoalsSummary,
  GOAL_STATUS,
} from '../savingsGoalsEngine';

describe('savingsGoalsEngine', () => {
  const asOfDate = '2026-01-01';

  it('calculates required monthly savings accurately for fixed deadlines', () => {
    // Target $6,000 in 12 months (starts with $0) -> $500/mo
    const req1 = calculateRequiredMonthlySavings({
      targetAmount: 6000,
      currentAmount: 0,
      targetDate: '2027-01-01',
      asOfDate,
    });
    expect(req1).toBeCloseTo(500, 0);

    // Target $6,000 in 12 months with $1,200 already saved -> $400/mo
    const req2 = calculateRequiredMonthlySavings({
      targetAmount: 6000,
      currentAmount: 1200,
      targetDate: '2027-01-01',
      asOfDate,
    });
    expect(req2).toBeCloseTo(400, 0);
  });

  it('computes projected completion date based on contribution pace', () => {
    // Target $5,000, currently $1,000, saving $500/mo -> 8 months needed (2026-09-01)
    const result = calculateProjectedCompletionDate({
      targetAmount: 5000,
      currentAmount: 1000,
      monthlyContribution: 500,
      asOfDate,
    });

    expect(result.monthsNeeded).toBe(8);
    expect(result.projectedDate).toBe('2026-09-01');
  });


  it('evaluates individual goal progress and assigns correct status', () => {
    const goal1 = {
      id: 'g1',
      name: 'Fondo Emergencia',
      targetAmount: 10000,
      currentAmount: 4000,
      monthlyContribution: 500,
      targetDate: '2027-01-01', // 12 months -> requires $500/mo
      category: 'EMERGENCY',
      priority: 'HIGH',
    };

    const evaluated = evaluateGoalProgress(goal1, asOfDate);
    expect(evaluated.percentage).toBe(40);
    expect(evaluated.remainingAmount).toBe(6000);
    expect(evaluated.status).toBe(GOAL_STATUS.ON_TRACK);
    expect(evaluated.categoryMeta.label).toBe('Fondo de Emergencia');
  });

  it('distributes monthly surplus among goals according to PRIORITY strategy', () => {
    const goals = [
      { id: 'low', name: 'Viaje Japón', targetAmount: 3000, currentAmount: 500, priority: 'LOW', targetDate: '2027-01-01' },
      { id: 'high', name: 'Fondo Reserva', targetAmount: 5000, currentAmount: 2000, priority: 'HIGH', targetDate: '2026-07-01' },
    ];

    const distribution = distributeSurplusAmongGoals(goals, 600, 'PRIORITY');
    const highAlloc = distribution.find((d) => d.goalId === 'high');
    const lowAlloc = distribution.find((d) => d.goalId === 'low');

    // High priority gets funded first
    expect(highAlloc.allocatedMonthly).toBeGreaterThan(0);
    expect(highAlloc.allocatedMonthly).toBeLessThanOrEqual(600);
  });

  it('generates accurate portfolio-level summary across all goals', () => {
    const goals = [
      { id: '1', targetAmount: 10000, currentAmount: 10000 }, // completed
      { id: '2', targetAmount: 5000, currentAmount: 2500, monthlyContribution: 250, targetDate: '2026-11-01' },
    ];

    const summary = getSavingsGoalsSummary(goals, asOfDate);
    expect(summary.totalGoalsCount).toBe(2);
    expect(summary.completedCount).toBe(1);
    expect(summary.activeCount).toBe(1);
    expect(summary.totalTarget).toBe(15000);
    expect(summary.totalSaved).toBe(12500);
    expect(summary.overallPercentage).toBeCloseTo(83.3, 1);
  });
});
