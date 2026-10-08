/**
 * gamifiedChallengesEngine.js
 * Gamified Savings Challenges Engine for AuraFinance.
 * Features: 52-Week Challenge, 30-Day No-Impulse Buy Streak, Homemade Coffee Challenge, Zero-Spend Weekend.
 * Zero-Knowledge local processing.
 */

export const CHALLENGE_TEMPLATES = {
  WEEKS_52: {
    id: 'WEEKS_52',
    name: 'Reto de las 52 Semanas',
    icon: '🏆',
    description: 'Ahorra $1 la semana 1, $2 la semana 2... hasta $52 la semana 52. ¡Acumula $1,378 en un año!',
    durationDays: 364,
    totalTarget: 1378,
    category: 'HABIT_BUILDING',
    xpReward: 1000,
  },
  NO_IMPULSE_30: {
    id: 'NO_IMPULSE_30',
    name: 'Mes Libre de Compras Impulsivas',
    icon: '🧘',
    description: '30 días consecutivos sin compras no esenciales fuera de tu presupuesto básico.',
    durationDays: 30,
    totalTarget: 300,
    category: 'MINIMALISM',
    xpReward: 500,
  },
  HOMEMADE_COFFEE_30: {
    id: 'HOMEMADE_COFFEE_30',
    name: 'Desafío Café en Casa',
    icon: '☕',
    description: 'Prepara tu propio café diario durante 30 días en lugar de comprar en cafeterías. Ahorro estimado: ~$120/mes.',
    durationDays: 30,
    totalTarget: 120,
    category: 'MICRO_EXPENSE',
    xpReward: 300,
  },
  ZERO_SPEND_WEEKENDS: {
    id: 'ZERO_SPEND_WEEKENDS',
    name: 'Fin de Semana Gasto Cero',
    icon: '🏕️',
    description: 'Pasa 4 fines de semana consecutivos (Sábado y Domingo) con $0 de gasto discrecional.',
    durationDays: 28,
    totalTarget: 250,
    category: 'EXTREME_SAVING',
    xpReward: 400,
  },
};

export const BADGE_TIERS = {
  LOCKED: { key: 'LOCKED', label: 'En Progreso', icon: '🔒', minPct: 0 },
  BRONZE: { key: 'BRONZE', label: 'Iniciado de Bronce', icon: '🥉', minPct: 25 },
  SILVER: { key: 'SILVER', label: 'Guardián de Plata', icon: '🥈', minPct: 50 },
  GOLD: { key: 'GOLD', label: 'Maestro de Oro', icon: '🥇', minPct: 75 },
  DIAMOND: { key: 'DIAMOND', label: 'Leyenda Diamante', icon: '💎', minPct: 100 },
};

/**
 * Initializes a new challenge instance with milestones schedule.
 * @param {string} templateId - 'WEEKS_52' | 'NO_IMPULSE_30' | 'HOMEMADE_COFFEE_30' | 'ZERO_SPEND_WEEKENDS'
 * @param {Object} [options]
 * @param {number} [options.multiplier=1] - Multiplier for targets (e.g. 2x for $2,756 on 52-week)
 * @param {string|Date} [options.startDate=new Date()]
 * @returns {Object} Challenge instance
 */
export function initializeChallenge(templateId, options = {}) {
  const template = CHALLENGE_TEMPLATES[templateId] || CHALLENGE_TEMPLATES.WEEKS_52;
  const multiplier = Math.max(0.5, Number(options.multiplier ?? 1));
  const start = options.startDate ? new Date(options.startDate) : new Date();

  const milestones = [];

  if (template.id === 'WEEKS_52') {
    for (let w = 1; w <= 52; w++) {
      const milestoneDate = new Date(start);
      milestoneDate.setDate(milestoneDate.getDate() + (w - 1) * 7);
      const targetAmount = w * multiplier;

      milestones.push({
        stepNumber: w,
        label: `Semana ${w}`,
        targetAmount: Math.round(targetAmount * 100) / 100,
        completedAmount: 0,
        isCompleted: false,
        dueDate: milestoneDate.toISOString().split('T')[0],
      });
    }
  } else {
    // Daily milestones
    const dailyTarget = (template.totalTarget * multiplier) / template.durationDays;
    for (let d = 1; d <= template.durationDays; d++) {
      const milestoneDate = new Date(start);
      milestoneDate.setDate(milestoneDate.getDate() + (d - 1));

      milestones.push({
        stepNumber: d,
        label: `Día ${d}`,
        targetAmount: Math.round(dailyTarget * 100) / 100,
        completedAmount: 0,
        isCompleted: false,
        dueDate: milestoneDate.toISOString().split('T')[0],
      });
    }
  }

  const totalTarget = milestones.reduce((sum, m) => sum + m.targetAmount, 0);

  return {
    id: `chal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    templateId: template.id,
    name: template.name,
    icon: template.icon,
    description: template.description,
    multiplier,
    startDate: start.toISOString().split('T')[0],
    totalTarget: Math.round(totalTarget * 100) / 100,
    currentSaved: 0,
    completedStepsCount: 0,
    totalStepsCount: milestones.length,
    currentStreak: 0,
    isCompleted: false,
    xpEarned: 0,
    xpTotal: template.xpReward,
    milestones,
  };
}

/**
 * Marks a specific milestone step as completed and updates challenge progression.
 * @param {Object} challenge
 * @param {number} stepNumber - 1-based index of milestone
 * @param {number} [customAmount] - Optional custom saved amount
 * @returns {Object} Updated challenge instance
 */
export function recordChallengeMilestone(challenge, stepNumber, customAmount = null) {
  if (!challenge || !Array.isArray(challenge.milestones)) return challenge;

  const milestones = challenge.milestones.map((m) => {
    if (m.stepNumber === stepNumber) {
      const amt = customAmount !== null ? Math.max(0, Number(customAmount)) : m.targetAmount;
      return {
        ...m,
        completedAmount: amt,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };
    }
    return m;
  });

  const completedStepsCount = milestones.filter((m) => m.isCompleted).length;
  const currentSaved = milestones.reduce((sum, m) => sum + (m.completedAmount || 0), 0);
  const isCompleted = completedStepsCount === milestones.length;

  // Compute current consecutive streak
  let currentStreak = 0;
  for (let i = 0; i < milestones.length; i++) {
    if (milestones[i].isCompleted) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate XP
  const completionPct = milestones.length > 0 ? completedStepsCount / milestones.length : 0;
  const xpEarned = Math.round(challenge.xpTotal * completionPct);

  return {
    ...challenge,
    milestones,
    completedStepsCount,
    currentSaved: Math.round(currentSaved * 100) / 100,
    currentStreak,
    isCompleted,
    xpEarned,
  };
}

/**
 * Evaluates completion badge and detailed statistics for a challenge.
 * @param {Object} challenge
 * @returns {Object} Challenge analytics and badge tier
 */
export function getChallengeAnalytics(challenge = {}) {
  const total = Number(challenge.totalTarget) || 1;
  const saved = Number(challenge.currentSaved) || 0;
  const steps = Number(challenge.totalStepsCount) || 1;
  const done = Number(challenge.completedStepsCount) || 0;

  const percentage = Math.min(100, Math.round((saved / total) * 1000) / 10);
  const stepsPercentage = Math.min(100, Math.round((done / steps) * 1000) / 10);

  let badge = BADGE_TIERS.LOCKED;
  if (percentage >= 100) {
    badge = BADGE_TIERS.DIAMOND;
  } else if (percentage >= 75) {
    badge = BADGE_TIERS.GOLD;
  } else if (percentage >= 50) {
    badge = BADGE_TIERS.SILVER;
  } else if (percentage >= 25) {
    badge = BADGE_TIERS.BRONZE;
  }

  const remainingToSave = Math.max(0, total - saved);
  const nextMilestone = (challenge.milestones || []).find((m) => !m.isCompleted);

  return {
    challengeId: challenge.id,
    name: challenge.name,
    percentage,
    stepsPercentage,
    badgeKey: badge.key,
    badgeLabel: badge.label,
    badgeIcon: badge.icon,
    currentSaved: saved,
    totalTarget: total,
    remainingToSave: Math.round(remainingToSave * 100) / 100,
    currentStreak: challenge.currentStreak || 0,
    isCompleted: percentage >= 100,
    xpEarned: challenge.xpEarned || 0,
    nextMilestone,
  };
}
