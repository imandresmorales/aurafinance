/**
 * earlyPrincipalPayoffEngine.js
 * Early Principal Prepayment & Interest Savings Engine for AuraFinance.
 * Computes exact interest saved, term shortening, and monthly payment reductions
 * for lump-sum or recurring capital prepayments.
 * Zero-Knowledge local processing.
 */

import { generateAmortizationSchedule } from './amortizationEngine';

/**
 * Calculates the impact of an early principal prepayment (lump sum or recurring monthly).
 * @param {Object} loanParams
 * @param {number} loanParams.principal - Current remaining balance
 * @param {number} loanParams.annualRate - Annual nominal interest rate (e.g. 0.08)
 * @param {number} loanParams.remainingMonths - Remaining repayment months
 * @param {Object} prepayment
 * @param {'LUMP_SUM'|'RECURRING_MONTHLY'} [prepayment.type='RECURRING_MONTHLY']
 * @param {number} [prepayment.amount=100] - Extra payment amount
 * @param {number} [prepayment.appliedAtMonth=1] - Month when lump sum occurs
 * @param {'REDUCE_TERM'|'REDUCE_PAYMENT'} [prepayment.strategy='REDUCE_TERM']
 * @param {Object} [options]
 * @param {string|Date} [options.startDate=new Date()]
 * @returns {Object} Comprehensive before/after prepayment report
 */
export function calculateEarlyPrincipalPayoff(
  {
    principal = 20000,
    annualRate = 0.09,
    remainingMonths = 48,
  } = {},
  {
    type = 'RECURRING_MONTHLY',
    amount = 100,
    appliedAtMonth = 1,
    strategy = 'REDUCE_TERM',
  } = {},
  options = {}
) {
  const P = Math.max(100, Number(principal) || 20000);
  const r = Math.max(0, Number(annualRate) || 0);
  const n = Math.max(1, Math.min(600, Number(remainingMonths) || 48));
  const extraAmt = Math.max(0, Number(amount) || 0);
  const lumpMonth = Math.max(1, Number(appliedAtMonth) || 1);
  const start = options.startDate ? new Date(options.startDate) : new Date();

  // 1. Baseline Schedule (No extra payments)
  const baseline = generateAmortizationSchedule({
    principal: P,
    annualRate: r,
    termMonths: n,
    system: 'FRENCH',
  }, { startDate: start });

  const baselineMonthlyPayment = baseline.monthlyPaymentAmount || (baseline.totalPaid / n);
  const baselineTotalInterest = baseline.totalInterestPaid;
  const baselineMonths = n;

  // 2. Accelerated Simulation
  const monthlyRate = r / 12;
  let currentBalance = P;
  let newCumulativeInterest = 0;
  let newCumulativePrincipal = 0;
  let actualMonthsTaken = 0;
  const newSchedule = [];

  if (strategy === 'REDUCE_TERM') {
    // Keep monthly payment at least baselineMonthlyPayment, plus extra
    for (let k = 1; k <= n; k++) {
      if (currentBalance <= 0.01) break;
      actualMonthsTaken = k;

      const interestThisMonth = currentBalance * monthlyRate;
      let regularPrincipal = Math.min(currentBalance, baselineMonthlyPayment - interestThisMonth);

      let extraThisMonth = 0;
      if (type === 'RECURRING_MONTHLY') {
        extraThisMonth = extraAmt;
      } else if (type === 'LUMP_SUM' && k === lumpMonth) {
        extraThisMonth = extraAmt;
      }

      const totalPrincipalPayment = Math.min(currentBalance, regularPrincipal + extraThisMonth);
      const totalPayment = totalPrincipalPayment + interestThisMonth;

      currentBalance = Math.max(0, currentBalance - totalPrincipalPayment);
      newCumulativeInterest += interestThisMonth;
      newCumulativePrincipal += totalPrincipalPayment;

      const periodDate = new Date(start);
      periodDate.setMonth(periodDate.getMonth() + (k - 1));

      newSchedule.push({
        period: k,
        date: periodDate.toISOString().split('T')[0],
        totalPayment: Math.round(totalPayment * 100) / 100,
        principalPayment: Math.round(totalPrincipalPayment * 100) / 100,
        interestPayment: Math.round(interestThisMonth * 100) / 100,
        endingBalance: Math.round(currentBalance * 100) / 100,
      });
    }
  } else {
    // REDUCE_PAYMENT: Lower future required monthly payment after lump-sum
    const balanceAfterLump = Math.max(0, P - extraAmt);
    const revisedPmt = monthlyRate > 0
      ? balanceAfterLump * ((monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1))
      : balanceAfterLump / n;

    const revisedSchedule = generateAmortizationSchedule({
      principal: balanceAfterLump,
      annualRate: r,
      termMonths: n,
      system: 'FRENCH',
    }, { startDate: start });

    actualMonthsTaken = n;
    newCumulativeInterest = revisedSchedule.totalInterestPaid;
  }

  const interestSaved = Math.max(0, baselineTotalInterest - newCumulativeInterest);
  const monthsSaved = Math.max(0, baselineMonths - actualMonthsTaken);
  const yearsSaved = Math.round((monthsSaved / 12) * 10) / 10;

  const baselineEndDate = new Date(start);
  baselineEndDate.setMonth(baselineEndDate.getMonth() + baselineMonths);

  const newEndDate = new Date(start);
  newEndDate.setMonth(newEndDate.getMonth() + actualMonthsTaken);

  // Guaranteed annualized return rate is equal to the loan interest rate
  const guaranteedReturnPct = Math.round(r * 1000) / 10;

  return {
    loan: {
      principal: P,
      annualRate: r,
      remainingMonths: n,
      baselineMonthlyPayment: Math.round(baselineMonthlyPayment * 100) / 100,
      baselineTotalInterest: Math.round(baselineTotalInterest * 100) / 100,
      baselineEndDate: baselineEndDate.toISOString().split('T')[0],
    },
    prepayment: {
      type,
      amount: extraAmt,
      strategy,
      appliedAtMonth: lumpMonth,
    },
    results: {
      newTotalInterest: Math.round(newCumulativeInterest * 100) / 100,
      interestSaved: Math.round(interestSaved * 100) / 100,
      interestSavedPct: baselineTotalInterest > 0
        ? Math.round((interestSaved / baselineTotalInterest) * 1000) / 10
        : 0,
      monthsSaved,
      yearsSaved,
      newPayoffDate: newEndDate.toISOString().split('T')[0],
      guaranteedReturnPct,
    },
    summaryText: monthsSaved > 0
      ? `Abonar $${extraAmt.toFixed(2)} ${type === 'RECURRING_MONTHLY' ? 'al mes' : 'de forma extraordinaria'} te ahorra $${interestSaved.toFixed(2)} en intereses y acorta el plazo en ${monthsSaved} meses (${yearsSaved} años).`
      : `Abono de $${extraAmt.toFixed(2)} ahorra $${interestSaved.toFixed(2)} en intereses totales.`,
    schedule: newSchedule,
  };
}
