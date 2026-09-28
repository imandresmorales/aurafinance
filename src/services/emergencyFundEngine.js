import { normalizeMoney } from '../utils';
import { getCategoryPillar, PILLAR_TYPES } from './rule502030Engine';

export const EMERGENCY_STATUS = {
  CRITICAL: 'CRITICAL', // < 1 mes
  BASIC: 'BASIC',       // 1 a 3 meses
  HEALTHY: 'HEALTHY',   // 3 a 6 meses
  ROBUST: 'ROBUST',     // >= 6 meses
};

/**
 * Calcula los fondos líquidos disponibles para emergencias
 * Considera cuentas de Efectivo, Bancos y Billeteras Digitales
 */
export function getLiquidEmergencyReserves(accounts = [], balances = {}) {
  const liquidCategories = ['CASH', 'BANK', 'DIGITAL_WALLET'];

  let totalLiquid = 0;
  const liquidAccounts = [];

  accounts.forEach((acc) => {
    if (acc.type === 'ASSET' && liquidCategories.includes(acc.category)) {
      const balance = Math.max(0, balances[acc.id] !== undefined ? balances[acc.id] : (acc.initialBalance || 0));
      totalLiquid += balance;
      liquidAccounts.push({
        id: acc.id,
        name: acc.name,
        category: acc.category,
        currency: acc.currency,
        balance: normalizeMoney(balance),
      });
    }
  });

  return {
    totalLiquid: normalizeMoney(totalLiquid),
    liquidAccounts,
  };
}

/**
 * Calcula la tasa promedio de gasto mensual esencial (Necesidades básicas)
 */
export function calculateEssentialMonthlyBurnRate(transactions = [], defaultFallback = 1500) {
  const activeExpenses = transactions.filter((tx) => !tx.deleted && tx.type === 'EXPENSE');

  if (activeExpenses.length === 0) {
    return normalizeMoney(defaultFallback);
  }

  // Filtrar solo gastos de Necesidades (NEEDS)
  const essentialExpenses = activeExpenses.filter((tx) => {
    const pillar = getCategoryPillar(tx.category);
    return pillar === PILLAR_TYPES.NEEDS;
  });

  const totalEssential = essentialExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // Determinar número de meses de calendario únicos en el historial (inmune a zonas horarias)
  const uniqueMonths = new Set(
    activeExpenses
      .map((tx) => (tx.date && typeof tx.date === 'string' ? tx.date.slice(0, 7) : null))
      .filter(Boolean)
  );
  const monthCount = Math.max(1, uniqueMonths.size);

  const monthlyAverage = totalEssential > 0 ? totalEssential / monthCount : defaultFallback;
  return normalizeMoney(monthlyAverage);
}

/**
 * Diagnóstico y cálculo del Fondo de Emergencia con estimación de meses de cobertura
 * @param {Array} accounts - Lista de cuentas
 * @param {Object} balances - Saldos de cuentas
 * @param {Array} transactions - Transacciones del libro mayor
 * @param {number} [targetMonths=6] - Meta de meses de cobertura deseada (3, 6, 12)
 * @returns {Object} Diagnóstico integral del fondo de emergencia
 */
export function calculateEmergencyFundMetrics(
  accounts = [],
  balances = {},
  transactions = [],
  targetMonths = 6
) {
  const { totalLiquid, liquidAccounts } = getLiquidEmergencyReserves(accounts, balances);
  const monthlyBurnRate = calculateEssentialMonthlyBurnRate(transactions);

  const monthsCovered = monthlyBurnRate > 0 ? normalizeMoney(totalLiquid / monthlyBurnRate) : 0;
  const targetAmount = normalizeMoney(monthlyBurnRate * targetMonths);
  const gapToTarget = normalizeMoney(targetAmount - totalLiquid);
  const percentCompleted = targetAmount > 0 ? Math.min(100, normalizeMoney((totalLiquid / targetAmount) * 100)) : 100;
  const isTargetAchieved = totalLiquid >= targetAmount;

  let status = EMERGENCY_STATUS.HEALTHY;
  let statusLabel = 'Saludable';
  let advice = '';

  if (monthsCovered < 1) {
    status = EMERGENCY_STATUS.CRITICAL;
    statusLabel = 'Vulnerable';
    advice = 'Tu colchón de seguridad cubre menos de 1 mes de gastos esenciales. Prioriza crear un fondo de emergencia inicial de al menos $1,000 o 3 meses.';
  } else if (monthsCovered < 3) {
    status = EMERGENCY_STATUS.BASIC;
    statusLabel = 'Básico';
    advice = `Dispones de ${monthsCovered} meses de cobertura. Tu meta inmediata debe ser alcanzar 3 meses ($${(monthlyBurnRate * 3).toFixed(2)}) para mayor tranquilidad.`;
  } else if (monthsCovered < 6) {
    status = EMERGENCY_STATUS.HEALTHY;
    statusLabel = 'Saludable';
    advice = `¡Excelente colchón financiero! Tienes ${monthsCovered} meses cubiertos. Acércate a la meta óptima de 6 meses ($${targetAmount.toFixed(2)}).`;
  } else {
    status = EMERGENCY_STATUS.ROBUST;
    statusLabel = 'Robusto & Blindado';
    advice = `¡Fondo de Emergencia completamente blindado con ${monthsCovered} meses de cobertura! Los excedentes pueden destinarse a inversión pasiva a largo plazo.`;
  }

  return {
    totalLiquid,
    liquidAccounts,
    monthlyBurnRate,
    targetMonths,
    targetAmount,
    monthsCovered,
    gapToTarget: Math.max(0, gapToTarget),
    surplus: Math.max(0, -gapToTarget),
    percentCompleted,
    isTargetAchieved,
    status,
    statusLabel,
    advice,
  };
}
