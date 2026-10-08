/**
 * savingsGoalsEngine.js
 * Savings Goals & Target Planning Engine for AuraFinance.
 * Computes goal completion trajectories, required monthly contributions, completion dates and smart surplus allocation.
 * Zero-Knowledge local processing.
 */

import { parseCivilDate, formatCivilDate, addCivilInterval, calculateCivilDaysDiff } from './timezoneSafeScheduler';

export const GOAL_CATEGORIES = {
  EMERGENCY: { id: 'EMERGENCY', label: 'Fondo de Emergencia', icon: '🛡️', color: '#10b981' },
  HOME: { id: 'HOME', label: 'Vivienda / Entrada Hipoteca', icon: '🏠', color: '#3b82f6' },
  VEHICLE: { id: 'VEHICLE', label: 'Vehículo / Movilidad', icon: '🚗', color: '#8b5cf6' },
  TRAVEL: { id: 'TRAVEL', label: 'Viajes & Ocio', icon: '✈️', color: '#ec4899' },
  EDUCATION: { id: 'EDUCATION', label: 'Educación & Formación', icon: '🎓', color: '#f59e0b' },
  INVESTMENT: { id: 'INVESTMENT', label: 'Capital de Inversión', icon: '📈', color: '#14b8a6' },
  RETIREMENT: { id: 'RETIREMENT', label: 'Retiro / FIRE', icon: '🌴', color: '#06b6d4' },
  OTHER: { id: 'OTHER', label: 'Otros Proyectos', icon: '🎯', color: '#64748b' },
};

export const GOAL_PRIORITIES = {
  CRITICAL: { id: 'CRITICAL', label: 'Crítica', weight: 4, color: '#dc2626' },
  HIGH: { id: 'HIGH', label: 'Alta', weight: 3, color: '#ef4444' },
  MEDIUM: { id: 'MEDIUM', label: 'Media', weight: 2, color: '#f59e0b' },
  LOW: { id: 'LOW', label: 'Baja', weight: 1, color: '#10b981' },
};

export const GOAL_STATUS = {
  COMPLETED: 'COMPLETED',
  ON_TRACK: 'ON_TRACK',
  BEHIND: 'BEHIND',
  STALLED: 'STALLED',
};

/**
 * Calculates the required monthly contribution to reach a target amount by a target date.
 * @param {Object} params
 * @param {number} params.targetAmount - Total goal target
 * @param {number} [params.currentAmount=0] - Currently saved amount
 * @param {string|Date} params.targetDate - Due date for the goal
 * @param {string|Date} [params.asOfDate=new Date()] - Evaluation reference date
 * @param {number} [params.annualReturnRate=0] - Expected annual return (e.g. 0.05 for 5% HYSA)
 * @returns {number} Required monthly contribution in currency units
 */
export function calculateRequiredMonthlySavings({
  targetAmount = 0,
  currentAmount = 0,
  targetDate,
  asOfDate = new Date(),
  annualReturnRate = 0,
}) {
  const target = Math.max(0, Number(targetAmount) || 0);
  const current = Math.max(0, Number(currentAmount) || 0);
  const remaining = Math.max(0, target - current);

  if (remaining === 0) return 0;

  const start = parseCivilDate(asOfDate);
  const end = parseCivilDate(targetDate);
  const days = Math.max(1, calculateCivilDaysDiff(end, start));
  const months = Math.max(0.5, days / 30.4375);

  const r = Number(annualReturnRate) || 0;
  if (r <= 0) {
    return Math.round((remaining / months) * 100) / 100;
  }

  // Compound return formula for periodic annuity target
  const i = r / 12; // Monthly rate
  const futureValueOfPrincipal = current * Math.pow(1 + i, months);
  const shortfallAtEnd = Math.max(0, target - futureValueOfPrincipal);

  if (shortfallAtEnd === 0) return 0;

  const pmt = shortfallAtEnd * (i / (Math.pow(1 + i, months) - 1));
  return Math.round(pmt * 100) / 100;
}

/**
 * Calculates the projected completion date based on current monthly contribution pace.
 * @param {Object} params
 * @param {number} params.targetAmount
 * @param {number} [params.currentAmount=0]
 * @param {number} params.monthlyContribution
 * @param {string|Date} [params.asOfDate=new Date()]
 * @param {number} [params.annualReturnRate=0]
 * @returns {{ projectedDate: string, monthsNeeded: number, daysNeeded: number }}
 */
export function calculateProjectedCompletionDate({
  targetAmount = 0,
  currentAmount = 0,
  monthlyContribution = 0,
  asOfDate = new Date(),
  annualReturnRate = 0,
}) {
  const target = Math.max(0, Number(targetAmount) || 0);
  const current = Math.max(0, Number(currentAmount) || 0);
  const contribution = Math.max(0, Number(monthlyContribution) || 0);
  const start = parseCivilDate(asOfDate);

  if (current >= target) {
    return {
      projectedDate: formatCivilDate(start),
      monthsNeeded: 0,
      daysNeeded: 0,
    };
  }

  if (contribution <= 0) {
    return {
      projectedDate: null,
      monthsNeeded: Infinity,
      daysNeeded: Infinity,
    };
  }

  const remaining = target - current;
  const r = Number(annualReturnRate) || 0;
  let monthsNeeded = remaining / contribution;

  if (r > 0) {
    const i = r / 12;
    // Solve for n: Target = Current*(1+i)^n + PMT*((1+i)^n - 1)/i
    // (Target + PMT/i) = (Current + PMT/i) * (1+i)^n
    // n = ln((Target + PMT/i)/(Current + PMT/i)) / ln(1+i)
    const numerator = Math.log((target + contribution / i) / (current + contribution / i));
    const denominator = Math.log(1 + i);
    monthsNeeded = numerator / denominator;
  }

  const wholeMonths = Math.floor(monthsNeeded);
  const fraction = monthsNeeded - wholeMonths;
  let finishDate = addCivilInterval(start, wholeMonths, 'months');
  if (fraction > 0) {
    const extraDays = Math.round(fraction * 30.4375);
    finishDate = addCivilInterval(finishDate, extraDays, 'days');
  }

  return {
    projectedDate: formatCivilDate(finishDate),
    monthsNeeded: Math.round(monthsNeeded * 10) / 10,
    daysNeeded: Math.round(monthsNeeded * 30.4375),
  };
}


/**
 * Calculates progress, temporal deadlines, required monthly savings, and health for a single goal.
 * @param {Object} goal
 * @param {string|Date} [asOfDate=new Date()]
 * @returns {Object} Evaluated goal with enriched analytics
 */
export function evaluateGoalProgress(goal = {}, asOfDate = new Date()) {
  const target = Math.max(0, Number(goal.targetAmount) || 0);
  const current = Math.max(0, Number(goal.currentAmount) || 0);
  const contribution = Math.max(0, Number(goal.monthlyContribution) || 0);
  const returnRate = Number(goal.annualReturnRate) || 0;

  const start = parseCivilDate(asOfDate);
  const remainingAmount = Math.max(0, target - current);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 1000) / 10) : 100;

  let daysRemaining = null;
  let monthsRemaining = null;
  let requiredMonthlySavings = 0;

  if (goal.targetDate) {
    const targetDateObj = parseCivilDate(goal.targetDate);
    daysRemaining = calculateCivilDaysDiff(targetDateObj, start);
    monthsRemaining = Math.max(0.1, Math.round((daysRemaining / 30.4375) * 10) / 10);

    requiredMonthlySavings = calculateRequiredMonthlySavings({
      targetAmount: target,
      currentAmount: current,
      targetDate: goal.targetDate,
      asOfDate: start,
      annualReturnRate: returnRate,
    });
  }

  const projection = calculateProjectedCompletionDate({
    targetAmount: target,
    currentAmount: current,
    monthlyContribution: contribution,
    asOfDate: start,
    annualReturnRate: returnRate,
  });

  // Determine Goal Status
  let status = GOAL_STATUS.ON_TRACK;
  if (current >= target) {
    status = GOAL_STATUS.COMPLETED;
  } else if (contribution === 0) {
    status = GOAL_STATUS.STALLED;
  } else if (goal.targetDate && contribution < requiredMonthlySavings * 0.95) {
    status = GOAL_STATUS.BEHIND;
  }

  const categoryMeta = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.OTHER;
  const priorityMeta = GOAL_PRIORITIES[goal.priority] || GOAL_PRIORITIES.MEDIUM;

  return {
    ...goal,
    targetAmount: target,
    currentAmount: current,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
    percentage,
    isCompleted: current >= target,
    daysRemaining,
    monthsRemaining,
    requiredMonthlySavings,
    projectedCompletionDate: projection.projectedDate,
    monthsToFinishAtCurrentPace: projection.monthsNeeded,
    status,
    categoryMeta,
    priorityMeta,
  };
}

/**
 * Distributes available monthly surplus budget across multiple goals according to chosen strategy.
 * @param {Array<Object>} goals
 * @param {number} availableMonthlySurplus
 * @param {'PRIORITY'|'PROPORTIONAL'|'FASTEST_COMPLETION'} [strategy='PRIORITY']
 * @returns {Array<{ goalId: string, allocatedMonthly: number, goalName: string, newProjectedDate: string }>}
 */
export function distributeSurplusAmongGoals(goals = [], availableMonthlySurplus = 0, strategy = 'PRIORITY') {
  const activeGoals = goals
    .map((g) => evaluateGoalProgress(g))
    .filter((g) => !g.isCompleted);

  if (activeGoals.length === 0 || availableMonthlySurplus <= 0) {
    return goals.map((g) => ({ goalId: g.id, allocatedMonthly: 0, goalName: g.name }));
  }

  let totalSurplus = Math.max(0, Number(availableMonthlySurplus));
  const allocations = new Map();

  if (strategy === 'PRIORITY') {
    // Sort by priority weight descending
    const sorted = [...activeGoals].sort((a, b) => b.priorityMeta.weight - a.priorityMeta.weight);

    for (const goal of sorted) {
      if (totalSurplus <= 0) {
        allocations.set(goal.id, 0);
        continue;
      }
      const needed = goal.requiredMonthlySavings || goal.remainingAmount;
      const allocate = Math.min(totalSurplus, needed > 0 ? needed : totalSurplus);
      allocations.set(goal.id, Math.round(allocate * 100) / 100);
      totalSurplus -= allocate;
    }
  } else if (strategy === 'PROPORTIONAL') {
    // Distribute proportionally to remaining amount
    const totalRemaining = activeGoals.reduce((sum, g) => sum + g.remainingAmount, 0) || 1;
    activeGoals.forEach((goal) => {
      const share = (goal.remainingAmount / totalRemaining) * totalSurplus;
      allocations.set(goal.id, Math.round(share * 100) / 100);
    });
  } else if (strategy === 'FASTEST_COMPLETION') {
    // Fund smallest remaining deficit first (Snowball savings)
    const sorted = [...activeGoals].sort((a, b) => a.remainingAmount - b.remainingAmount);
    for (const goal of sorted) {
      if (totalSurplus <= 0) {
        allocations.set(goal.id, 0);
        continue;
      }
      const allocate = Math.min(totalSurplus, goal.remainingAmount);
      allocations.set(goal.id, Math.round(allocate * 100) / 100);
      totalSurplus -= allocate;
    }
  }

  return activeGoals.map((g) => {
    const allocated = allocations.get(g.id) || 0;
    const proj = calculateProjectedCompletionDate({
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      monthlyContribution: allocated,
    });
    return {
      goalId: g.id,
      goalName: g.name,
      allocatedMonthly: allocated,
      newProjectedDate: proj.projectedDate,
      monthsNeeded: proj.monthsNeeded,
    };
  });
}

/**
 * Returns consolidated summary of all user savings goals.
 * @param {Array<Object>} goals
 * @param {string|Date} [asOfDate=new Date()]
 * @returns {Object} Goals portfolio summary
 */
export function getSavingsGoalsSummary(goals = [], asOfDate = new Date()) {
  const evaluated = goals.map((g) => evaluateGoalProgress(g, asOfDate));

  let totalTarget = 0;
  let totalSaved = 0;
  let totalMonthlyRequired = 0;
  let totalCurrentMonthlyPace = 0;
  let completedCount = 0;

  evaluated.forEach((g) => {
    totalTarget += g.targetAmount;
    totalSaved += g.currentAmount;
    totalMonthlyRequired += g.requiredMonthlySavings || 0;
    totalCurrentMonthlyPace += Number(g.monthlyContribution) || 0;
    if (g.isCompleted) completedCount++;
  });

  const overallPercentage = totalTarget > 0
    ? Math.min(100, Math.round((totalSaved / totalTarget) * 1000) / 10)
    : 100;

  return {
    totalGoalsCount: evaluated.length,
    completedCount,
    activeCount: evaluated.length - completedCount,
    totalTarget: Math.round(totalTarget * 100) / 100,
    totalSaved: Math.round(totalSaved * 100) / 100,
    totalRemaining: Math.round(Math.max(0, totalTarget - totalSaved) * 100) / 100,
    overallPercentage,
    totalMonthlyRequired: Math.round(totalMonthlyRequired * 100) / 100,
    totalCurrentMonthlyPace: Math.round(totalCurrentMonthlyPace * 100) / 100,
    isFullyFundedPace: totalCurrentMonthlyPace >= totalMonthlyRequired,
    goals: evaluated,
  };
}
