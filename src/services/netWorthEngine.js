/**
 * Motor Avanzado de Cálculo y Diagnóstico de Patrimonio Neto (Net Worth Engine)
 * Calcula activos, pasivos, ratios de solvencia y desglose por liquidez/inversión.
 */

import { ACCOUNT_TYPES } from './doubleEntryEngine';

/**
 * Categorías estándar de activos y pasivos.
 */
export const ASSET_CATEGORIES = {
  LIQUID: 'LIQUID', // Efectivo, cuentas corrientes, ahorros a la vista
  INVESTMENT: 'INVESTMENT', // Fondos, ETFs, acciones, criptoactivos
  REAL_ESTATE: 'REAL_ESTATE', // Inmuebles, vehículos
  DEBT_SHORT: 'DEBT_SHORT', // Tarjetas de crédito, descubiertos
  DEBT_LONG: 'DEBT_LONG', // Préstamos personales, hipotecas
};

/**
 * Calcula un análisis completo y reactivo del patrimonio neto.
 */
export function calculateNetWorthAnalytics(accounts = [], balances = {}) {
  let totalAssets = 0;
  let totalLiabilities = 0;
  let liquidAssets = 0;
  let investmentAssets = 0;
  let shortTermDebt = 0;
  let longTermDebt = 0;

  const accountsBreakdown = [];

  for (const account of accounts) {
    const rawBalance = balances[account.id] !== undefined ? balances[account.id] : (account.initialBalance || 0);
    const balance = Math.round(rawBalance * 100) / 100;

    const isLiability = account.type === ACCOUNT_TYPES.LIABILITY;

    if (isLiability) {
      // Para pasivos, un saldo contable deudor representa lo que se debe
      const debtAmount = Math.abs(balance);
      totalLiabilities += debtAmount;

      if (account.category === 'CREDIT_CARD') {
        shortTermDebt += debtAmount;
      } else {
        longTermDebt += debtAmount;
      }

      accountsBreakdown.push({
        id: account.id,
        name: account.name,
        type: account.type,
        category: account.category,
        currency: account.currency,
        balance: -debtAmount,
        absAmount: debtAmount,
        classification: 'LIABILITY',
      });
    } else {
      // Activo (Cash, Bank, Investment, etc.)
      const assetAmount = Math.max(balance, 0);
      totalAssets += assetAmount;

      if (account.type === ACCOUNT_TYPES.INVESTMENT || account.category === 'INVESTMENT' || account.category === 'CRYPTO') {
        investmentAssets += assetAmount;
      } else {
        liquidAssets += assetAmount;
      }

      accountsBreakdown.push({
        id: account.id,
        name: account.name,
        type: account.type,
        category: account.category,
        currency: account.currency,
        balance: assetAmount,
        absAmount: assetAmount,
        classification: 'ASSET',
      });
    }
  }

  const netWorth = Math.round((totalAssets - totalLiabilities) * 100) / 100;

  // Debt-to-Asset Ratio (Porcentaje de apalancamiento)
  const debtRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 1000) / 10 : (totalLiabilities > 0 ? 100 : 0);

  // Liquidity Ratio (Porcentaje de liquidez sobre activos totales)
  const liquidityRatio = totalAssets > 0 ? Math.round((liquidAssets / totalAssets) * 1000) / 10 : 0;

  // Investment Allocation Ratio
  const investmentRatio = totalAssets > 0 ? Math.round((investmentAssets / totalAssets) * 1000) / 10 : 0;

  // Health / Solvency Tier
  let solvencyStatus = 'EXCELLENT'; // 'EXCELLENT' | 'SOLID' | 'MODERATE' | 'VULNERABLE'
  if (debtRatio === 0 && netWorth > 0) {
    solvencyStatus = 'EXCELLENT'; // Cero deuda
  } else if (debtRatio <= 25) {
    solvencyStatus = 'SOLID'; // Deuda muy baja y controlada
  } else if (debtRatio <= 50) {
    solvencyStatus = 'MODERATE'; // Nivel de endeudamiento aceptable
  } else {
    solvencyStatus = 'VULNERABLE'; // Alto apalancamiento (>50%)
  }

  return {
    netWorth,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    liquidAssets: Math.round(liquidAssets * 100) / 100,
    investmentAssets: Math.round(investmentAssets * 100) / 100,
    shortTermDebt: Math.round(shortTermDebt * 100) / 100,
    longTermDebt: Math.round(longTermDebt * 100) / 100,
    debtRatio,
    liquidityRatio,
    investmentRatio,
    solvencyStatus,
    accountsBreakdown,
  };
}
