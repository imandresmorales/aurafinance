/**
 * goalRecalculatorEngine.js
 * Dynamic Goal Recalculation Engine for Extraordinary Deposits & Emergency Withdrawals for AuraFinance.
 * Computes time acceleration (months saved), deadline shifts, and revised monthly requirements.
 * Zero-Knowledge local processing.
 */

import {
  evaluateGoalProgress,
  calculateProjectedCompletionDate,
  calculateRequiredMonthlySavings,
} from './savingsGoalsEngine';
import { parseCivilDate, calculateCivilDaysDiff } from './timezoneSafeScheduler';

/**
 * Simulates the impact of a single extraordinary deposit (windfall) or emergency withdrawal on a goal.
 * @param {Object} goal - Goal object
 * @param {number} deltaAmount - Positive for extra deposit, negative for withdrawal
 * @param {Object} [options]
 * @param {string|Date} [options.asOfDate=new Date()]
 * @returns {Object} Comprehensive before/after recalculation report
 */
export function recalculateGoalDelta(goal = {}, deltaAmount = 0, options = {}) {
  const asOf = options.asOfDate || new Date();
  const baseEvaluation = evaluateGoalProgress(goal, asOf);

  const delta = Number(deltaAmount) || 0;
  const originalCurrent = baseEvaluation.currentAmount;
  const newCurrent = Math.max(0, originalCurrent + delta);
  const target = baseEvaluation.targetAmount;
  const contribution = Number(goal.monthlyContribution) || 0;
  const returnRate = Number(goal.annualReturnRate) || 0;

  // New projection at current monthly pace
  const updatedGoal = {
    ...goal,
    currentAmount: newCurrent,
  };
  const newEvaluation = evaluateGoalProgress(updatedGoal, asOf);

  // Time difference in months & days
  const originalMonthsNeeded = baseEvaluation.monthsToFinishAtCurrentPace;
  const newMonthsNeeded = newEvaluation.monthsToFinishAtCurrentPace;

  let timeSavedMonths = 0;
  let timeSavedDays = 0;

  if (Number.isFinite(originalMonthsNeeded) && Number.isFinite(newMonthsNeeded)) {
    timeSavedMonths = Math.round((originalMonthsNeeded - newMonthsNeeded) * 10) / 10;
    timeSavedDays = Math.round(timeSavedMonths * 30.4375);
  }

  // Monthly relief if keeping original target date
  let monthlySavingsRelief = 0;
  let revisedRequiredMonthly = newEvaluation.requiredMonthlySavings;

  if (goal.targetDate) {
    monthlySavingsRelief = Math.round((baseEvaluation.requiredMonthlySavings - newEvaluation.requiredMonthlySavings) * 100) / 100;
  }

  const isWindfall = delta > 0;
  const isWithdrawal = delta < 0;

  let summaryText = '';
  if (isWindfall) {
    if (newEvaluation.isCompleted) {
      summaryText = `¡Aporte de $${Math.abs(delta).toFixed(2)} completa la meta al 100%!`;
    } else if (timeSavedMonths > 0) {
      summaryText = `Aporte de $${Math.abs(delta).toFixed(2)} adelanta tu meta en ${timeSavedMonths} meses (Nueva fecha: ${newEvaluation.projectedCompletionDate}).`;
    } else {
      summaryText = `Aporte de $${Math.abs(delta).toFixed(2)} reduce la cuota mensual requerida en $${monthlySavingsRelief.toFixed(2)}/mes.`;
    }
  } else if (isWithdrawal) {
    const delayMonths = Math.abs(timeSavedMonths);
    summaryText = `Retiro de $${Math.abs(delta).toFixed(2)} retrasa la meta en ${delayMonths} meses o requiere aumentar el aporte a $${revisedRequiredMonthly.toFixed(2)}/mes.`;
  } else {
    summaryText = 'Sin cambio en los fondos de la meta.';
  }

  return {
    goalId: goal.id,
    goalName: goal.name,
    deltaAmount: delta,
    isWindfall,
    isWithdrawal,
    originalState: {
      currentAmount: originalCurrent,
      percentage: baseEvaluation.percentage,
      projectedDate: baseEvaluation.projectedCompletionDate,
      monthsNeeded: originalMonthsNeeded,
      requiredMonthlySavings: baseEvaluation.requiredMonthlySavings,
    },
    newState: {
      currentAmount: newCurrent,
      percentage: newEvaluation.percentage,
      projectedDate: newEvaluation.projectedCompletionDate,
      monthsNeeded: newMonthsNeeded,
      requiredMonthlySavings: revisedRequiredMonthly,
      isCompleted: newEvaluation.isCompleted,
    },
    impact: {
      timeSavedMonths,
      timeSavedDays,
      monthlySavingsRelief,
      percentageGain: Math.round((newEvaluation.percentage - baseEvaluation.percentage) * 10) / 10,
    },
    summaryText,
  };
}

/**
 * Rebalances a lump-sum windfall across multiple active goals.
 * @param {Array<Object>} goals
 * @param {number} windfallAmount - One-time lump sum (e.g. bonus $2,000)
 * @param {'PRIORITY'|'PROPORTIONAL'|'SNOWBALL'} [strategy='PRIORITY']
 * @returns {Array<Object>} Rebalance allocations and collective time saved
 */
export function rebalanceWindfallAcrossGoals(goals = [], windfallAmount = 0, strategy = 'PRIORITY') {
  const activeGoals = goals
    .map((g) => evaluateGoalProgress(g))
    .filter((g) => !g.isCompleted);

  if (activeGoals.length === 0 || windfallAmount <= 0) {
    return [];
  }

  let remainingWindfall = Math.max(0, Number(windfallAmount));
  const allocations = [];

  if (strategy === 'PRIORITY') {
    const sorted = [...activeGoals].sort((a, b) => b.priorityMeta.weight - a.priorityMeta.weight);
    for (const goal of sorted) {
      if (remainingWindfall <= 0) break;
      const needed = goal.remainingAmount;
      const allocate = Math.min(remainingWindfall, needed);
      remainingWindfall -= allocate;

      allocations.push({
        goalId: goal.id,
        goalName: goal.name,
        allocatedAmount: Math.round(allocate * 100) / 100,
        recalculation: recalculateGoalDelta(goal, allocate),
      });
    }
  } else if (strategy === 'PROPORTIONAL') {
    const totalRemaining = activeGoals.reduce((sum, g) => sum + g.remainingAmount, 0) || 1;
    activeGoals.forEach((goal) => {
      const share = Math.min(goal.remainingAmount, (goal.remainingAmount / totalRemaining) * remainingWindfall);
      allocations.push({
        goalId: goal.id,
        goalName: goal.name,
        allocatedAmount: Math.round(share * 100) / 100,
        recalculation: recalculateGoalDelta(goal, share),
      });
    });
  } else {
    // SNOWBALL (Smallest deficit first)
    const sorted = [...activeGoals].sort((a, b) => a.remainingAmount - b.remainingAmount);
    for (const goal of sorted) {
      if (remainingWindfall <= 0) break;
      const allocate = Math.min(remainingWindfall, goal.remainingAmount);
      remainingWindfall -= allocate;

      allocations.push({
        goalId: goal.id,
        goalName: goal.name,
        allocatedAmount: Math.round(allocate * 100) / 100,
        recalculation: recalculateGoalDelta(goal, allocate),
      });
    }
  }

  return allocations;
}
