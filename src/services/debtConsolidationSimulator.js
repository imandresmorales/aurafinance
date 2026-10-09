/**
 * debtConsolidationSimulator.js
 * Debt Consolidation & Refinancing Simulator for AuraFinance.
 * Compares fragmented high-interest credit lines against a single consolidated loan
 * at lower negotiated interest rates, computing monthly cash flow relief and lifetime interest savings.
 * Zero-Knowledge local processing.
 */

import { generateAmortizationSchedule } from './amortizationEngine';
import { calculateTotalDebtSummary } from './debtManagementEngine';

/**
 * Simulates the financial outcome of consolidating multiple debts into a single unified loan.
 * @param {Array<Object>} debts - Array of current debts
 * @param {Object} consolidationOffer
 * @param {number} [consolidationOffer.newAnnualRate=0.12] - New negotiated annual interest rate
 * @param {number} [consolidationOffer.newTermMonths=36] - New repayment term in months
 * @param {number} [consolidationOffer.originationFeePct=0.015] - Upfront loan opening fee (e.g. 1.5%)
 * @param {Object} [options]
 * @returns {Object} Full consolidation comparison report
 */
export function simulateDebtConsolidation(debts = [], consolidationOffer = {}, options = {}) {
  const currentSummary = calculateTotalDebtSummary(debts);
  const totalBalance = currentSummary.totalOutstanding;

  if (totalBalance <= 0) {
    return {
      isViable: false,
      reason: 'No hay deudas activas con saldo pendiente para consolidar.',
      currentStatusQuo: currentSummary,
    };
  }

  const newRate = Math.max(0.01, Number(consolidationOffer.newAnnualRate ?? 0.12));
  const newTerm = Math.max(6, Math.min(360, Number(consolidationOffer.newTermMonths ?? 36)));
  const feePct = Math.max(0, Number(consolidationOffer.originationFeePct ?? 0.015));

  const originationFeeAmount = Math.round(totalBalance * feePct * 100) / 100;
  const consolidatedPrincipal = Math.round((totalBalance + originationFeeAmount) * 100) / 100;

  // 1. Current Baseline (Status Quo)
  const currentCombinedMonthlyPayment = currentSummary.totalMonthlyMinimum;
  // Estimate baseline interest: using current WACC over an equivalent average horizon
  const baselineSchedule = generateAmortizationSchedule({
    principal: totalBalance,
    annualRate: currentSummary.weightedAverageRate,
    termMonths: newTerm,
    system: 'FRENCH',
  });
  const currentProjectedInterest = baselineSchedule.totalInterestPaid;
  const currentTotalPaid = baselineSchedule.totalPaid;

  // 2. Consolidated Loan Schedule
  const consolidatedSchedule = generateAmortizationSchedule({
    principal: consolidatedPrincipal,
    annualRate: newRate,
    termMonths: newTerm,
    system: 'FRENCH',
  });

  const newUnifiedMonthlyPayment = consolidatedSchedule.monthlyPaymentAmount;
  const newTotalInterestPaid = consolidatedSchedule.totalInterestPaid;
  const newTotalPaid = consolidatedSchedule.totalPaid;

  // 3. Differential Savings & Relief
  const netInterestSavings = Math.round((currentProjectedInterest - newTotalInterestPaid - originationFeeAmount) * 100) / 100;
  const monthlyCashFlowRelief = Math.round((currentCombinedMonthlyPayment - newUnifiedMonthlyPayment) * 100) / 100;
  const rateReductionPct = Math.round((currentSummary.weightedAverageRate - newRate) * 1000) / 10;

  const isViable = netInterestSavings > 0 || (newRate < currentSummary.weightedAverageRate);

  const recommendations = [];
  if (isViable && netInterestSavings > 0) {
    recommendations.push(`Consolidar tus ${currentSummary.activeDebtsCount} deudas te ahorrará aproximadamente $${netInterestSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })} en intereses totales.`);
  }
  if (monthlyCashFlowRelief > 0) {
    recommendations.push(`Liberas $${monthlyCashFlowRelief.toFixed(2)}/mes de flujo de caja libre inmediato para ahorro o emergencias.`);
  } else {
    recommendations.push(`La cuota mensual consolidada ($${newUnifiedMonthlyPayment.toFixed(2)}) es mayor al pago mínimo actual, pero liquidarás el capital en ${newTerm} meses garantizados.`);
  }

  return {
    isViable,
    currentStatusQuo: {
      activeDebtsCount: currentSummary.activeDebtsCount,
      totalBalance,
      weightedRatePct: currentSummary.weightedAverageRatePct,
      currentMonthlyPayment: currentCombinedMonthlyPayment,
      projectedTotalInterest: currentProjectedInterest,
      totalPaid: currentTotalPaid,
    },
    consolidatedOffer: {
      newAnnualRatePct: Math.round(newRate * 1000) / 10,
      newTermMonths: newTerm,
      originationFeeAmount,
      consolidatedPrincipal,
      unifiedMonthlyPayment: newUnifiedMonthlyPayment,
      totalInterestPaid: newTotalInterestPaid,
      totalPaid: newTotalPaid,
    },
    comparison: {
      rateReductionPct,
      netInterestSavings,
      monthlyCashFlowRelief,
      isCashFlowPositive: monthlyCashFlowRelief > 0,
    },
    recommendations,
    schedule: consolidatedSchedule.schedule,
  };
}
