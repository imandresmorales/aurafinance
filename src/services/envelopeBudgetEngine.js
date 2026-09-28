import { normalizeMoney } from '../utils';

export const ENVELOPE_STATUS = {
  OK: 'OK',
  WARNING: 'WARNING',
  OVERBUDGET: 'OVERBUDGET',
  EMPTY: 'EMPTY',
};

/**
 * Calcula la ejecución de presupuestos por sobres frente a las transacciones reales
 * @param {Array} envelopes - Lista de sobres ({ id, name, category, allocated, icon, color })
 * @param {Array} transactions - Lista de transacciones del libro mayor
 * @param {string} [period] - Periodo opcional YYYY-MM para filtrar transacciones
 * @returns {Object} Resumen detallado con ejecución por sobre y métricas globales
 */
export function calculateEnvelopeExecution(envelopes = [], transactions = [], period = null) {
  // Filtrar transacciones activas de gasto en el periodo
  const activeExpenses = transactions.filter((tx) => {
    if (tx.deleted) return false;
    if (tx.type !== 'EXPENSE') return false;
    if (period && tx.date) {
      return tx.date.startsWith(period);
    }
    return true;
  });

  // Mapear gastos acumulados por categoría
  const categorySpentMap = {};
  activeExpenses.forEach((tx) => {
    const catKey = (tx.category || 'Sin Categoría').trim().toLowerCase();
    categorySpentMap[catKey] = (categorySpentMap[catKey] || 0) + (Number(tx.amount) || 0);
  });

  let totalAllocated = 0;
  let totalSpent = 0;
  let overbudgetCount = 0;
  let totalOverbudgetAmount = 0;

  const evaluatedEnvelopes = envelopes.map((env) => {
    const allocated = normalizeMoney(env.allocated || 0);
    const catKey = (env.category || env.name || '').trim().toLowerCase();
    const spent = normalizeMoney(categorySpentMap[catKey] || 0);
    const remaining = normalizeMoney(allocated - spent);
    const percentSpent = allocated > 0 ? normalizeMoney((spent / allocated) * 100) : 0;
    const isOverBudget = spent > allocated;

    let status = ENVELOPE_STATUS.OK;
    if (allocated === 0) {
      status = spent > 0 ? ENVELOPE_STATUS.OVERBUDGET : ENVELOPE_STATUS.EMPTY;
    } else if (isOverBudget) {
      status = ENVELOPE_STATUS.OVERBUDGET;
      overbudgetCount++;
      totalOverbudgetAmount += normalizeMoney(spent - allocated);
    } else if (percentSpent >= 75) {
      status = ENVELOPE_STATUS.WARNING;
    }

    totalAllocated += allocated;
    totalSpent += spent;

    return {
      ...env,
      allocated,
      spent,
      remaining,
      percentSpent,
      isOverBudget,
      overAmount: isOverBudget ? normalizeMoney(spent - allocated) : 0,
      status,
    };
  });

  totalAllocated = normalizeMoney(totalAllocated);
  totalSpent = normalizeMoney(totalSpent);
  const totalRemaining = normalizeMoney(totalAllocated - totalSpent);
  const globalPercentSpent = totalAllocated > 0 ? normalizeMoney((totalSpent / totalAllocated) * 100) : 0;

  return {
    envelopes: evaluatedEnvelopes,
    summary: {
      totalAllocated,
      totalSpent,
      totalRemaining,
      globalPercentSpent,
      overbudgetCount,
      totalOverbudgetAmount: normalizeMoney(totalOverbudgetAmount),
      isGlobalOverBudget: totalSpent > totalAllocated,
    },
  };
}

/**
 * Reasigna fondos entre dos sobres manteniendo la invariante de presupuesto base cero
 */
export function reallocateEnvelopeFunds(envelopes = [], sourceEnvelopeId, targetEnvelopeId, amount) {
  const normAmount = normalizeMoney(amount);
  if (normAmount <= 0) {
    throw new Error('El monto a reasignar debe ser mayor a cero.');
  }

  if (sourceEnvelopeId === targetEnvelopeId) {
    throw new Error('El sobre de origen y de destino no pueden ser el mismo.');
  }

  const sourceEnv = envelopes.find((e) => e.id === sourceEnvelopeId);
  const targetEnv = envelopes.find((e) => e.id === targetEnvelopeId);

  if (!sourceEnv || !targetEnv) {
    throw new Error('Uno o ambos sobres no fueron encontrados.');
  }

  if ((sourceEnv.allocated || 0) < normAmount) {
    throw new Error(`El sobre origen "${sourceEnv.name}" no cuenta con suficiente asignación disponible.`);
  }

  return envelopes.map((env) => {
    if (env.id === sourceEnvelopeId) {
      return { ...env, allocated: normalizeMoney(env.allocated - normAmount) };
    }
    if (env.id === targetEnvelopeId) {
      return { ...env, allocated: normalizeMoney((env.allocated || 0) + normAmount) };
    }
    return env;
  });
}

/**
 * Calcula el estado de balance Base Cero (Cada centavo tiene un propósito)
 */
export function calculateZeroBasedBudgetSummary(totalMonthlyIncome = 0, envelopes = []) {
  const normIncome = normalizeMoney(totalMonthlyIncome);
  const totalAllocated = normalizeMoney(
    envelopes.reduce((sum, env) => sum + (Number(env.allocated) || 0), 0)
  );
  const unallocatedFunds = normalizeMoney(normIncome - totalAllocated);
  const isZeroBalanced = unallocatedFunds === 0;

  let advice = '';
  if (isZeroBalanced) {
    advice = '¡Presupuesto Base Cero perfecto! Todo tu ingreso mensual ha sido asignado con éxito.';
  } else if (unallocatedFunds > 0) {
    advice = `Tienes $${unallocatedFunds.toFixed(2)} sin asignar. Asígnalos a ahorro, inversión o fondos de emergencia para alcanzar Base Cero.`;
  } else {
    advice = `Has sobre-asignado $${Math.abs(unallocatedFunds).toFixed(2)} más de tus ingresos mensuales previstos. Ajusta los sobres.`;
  }

  return {
    totalMonthlyIncome: normIncome,
    totalAllocated,
    unallocatedFunds,
    isZeroBalanced,
    advice,
  };
}
