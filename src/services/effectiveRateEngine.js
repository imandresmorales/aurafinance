/**
 * effectiveRateEngine.js
 * Total Annual Cost (CAT / APR / TAE) & Hidden Financial Bleeding Engine for AuraFinance.
 * Solves for true internal rate of return (IRR) incorporating origination fees, monthly maintenance,
 * mandatory credit insurance, and annual charges.
 * Zero-Knowledge local processing.
 */

import { generateAmortizationSchedule } from './amortizationEngine';

/**
 * Calculates the Total Annual Cost (CAT / APR) of a loan or credit line including all associated fees.
 * @param {Object} params
 * @param {number} params.principal - Loan principal amount
 * @param {number} params.nominalAnnualRate - Nominal annual rate (e.g. 0.16 for 16%)
 * @param {number} params.termMonths - Duration in months
 * @param {number} [params.originationFeePct=0] - Upfront opening fee percentage (e.g. 0.02 for 2%)
 * @param {number} [params.originationFeeFixed=0] - Upfront fixed fee
 * @param {number} [params.monthlyMaintenanceFee=0] - Recurring monthly account/service fee
 * @param {number} [params.monthlyInsuranceFee=0] - Mandatory life/debt insurance fee
 * @param {number} [params.annualCardFee=0] - Annual credit card membership charge
 * @returns {Object} Full CAT/APR diagnostic report
 */
export function calculateEffectiveAPR({
  principal = 10000,
  nominalAnnualRate = 0.16,
  termMonths = 24,
  originationFeePct = 0,
  originationFeeFixed = 0,
  monthlyMaintenanceFee = 0,
  monthlyInsuranceFee = 0,
  annualCardFee = 0,
} = {}) {
  const P = Math.max(100, Number(principal) || 10000);
  const rNominal = Math.max(0, Number(nominalAnnualRate) || 0);
  const n = Math.max(1, Math.min(600, Number(termMonths) || 24));

  const origFee = (P * (Number(originationFeePct) || 0)) + (Number(originationFeeFixed) || 0);
  const monthlyFee = (Number(monthlyMaintenanceFee) || 0) + (Number(monthlyInsuranceFee) || 0);
  const annualFee = Number(annualCardFee) || 0;

  // Net cash received by borrower at t = 0
  const netCashReceived = Math.max(1, P - origFee);

  // Standard loan repayment schedule
  const baseSchedule = generateAmortizationSchedule({
    principal: P,
    annualRate: rNominal,
    termMonths: n,
    system: 'FRENCH',
  });

  // Construct total cash outflow array for t = 1 to n
  const cashFlows = baseSchedule.schedule.map((item, idx) => {
    let monthlyCashOut = item.totalPayment + monthlyFee;
    if ((idx + 1) % 12 === 0) {
      monthlyCashOut += annualFee;
    }
    return monthlyCashOut;
  });

  const totalBaseInterest = baseSchedule.totalInterestPaid;
  const totalFeesPaid = origFee + (monthlyFee * n) + (annualFee * Math.floor(n / 12));
  const totalTrueCostOfCredit = totalBaseInterest + totalFeesPaid;

  // Solve for monthly effective rate (i) using Newton-Raphson on NPV(i) = 0
  // NPV(i) = -NetCashReceived + sum(CashFlow_k / (1+i)^k)
  let iGuess = rNominal / 12;
  const maxIterations = 50;
  const tolerance = 1e-7;

  for (let iter = 0; iter < maxIterations; iter++) {
    let npv = -netCashReceived;
    let dNpv = 0;

    for (let k = 1; k <= n; k++) {
      const discount = Math.pow(1 + iGuess, k);
      const cf = cashFlows[k - 1];
      npv += cf / discount;
      dNpv -= (k * cf) / (discount * (1 + iGuess));
    }

    if (Math.abs(npv) < tolerance || Math.abs(dNpv) < 1e-12) {
      break;
    }

    const nextGuess = iGuess - npv / dNpv;
    if (!Number.isFinite(nextGuess) || nextGuess <= -0.99) {
      break;
    }
    iGuess = nextGuess;
  }

  const monthlyEffectiveRate = Math.max(0, iGuess);
  // Compound Annual Rate: (1 + i_monthly)^12 - 1
  const effectiveAPRCompound = Math.pow(1 + monthlyEffectiveRate, 12) - 1;
  // Nominal APR: i_monthly * 12
  const effectiveAPRNominal = monthlyEffectiveRate * 12;

  const hiddenFeeMarkupPct = Math.max(0, (effectiveAPRCompound - rNominal) * 100);

  // Financial Bleeding / Cost Per Unit Time
  const bleedingPerMonth = totalTrueCostOfCredit / n;
  const bleedingPerDay = bleedingPerMonth / 30.4375;
  const bleedingPerYear = bleedingPerMonth * 12;

  let severity = 'LOW';
  let badgeLabel = 'Costo Razonable';
  let badgeColor = '#10b981';

  if (effectiveAPRCompound >= 0.40) {
    severity = 'CRITICAL';
    badgeLabel = 'Costo Usurero / Crítico';
    badgeColor = '#ef4444';
  } else if (effectiveAPRCompound >= 0.22) {
    severity = 'HIGH';
    badgeLabel = 'Costo Financiero Alto';
    badgeColor = '#f59e0b';
  } else if (effectiveAPRCompound >= 0.12) {
    severity = 'MODERATE';
    badgeLabel = 'Costo Moderado';
    badgeColor = '#3b82f6';
  }

  return {
    principal: P,
    netCashReceived: Math.round(netCashReceived * 100) / 100,
    nominalAnnualRate: rNominal,
    nominalAnnualRatePct: Math.round(rNominal * 1000) / 10,
    termMonths: n,
    effectiveAPRCompound: Math.round(effectiveAPRCompound * 10000) / 10000,
    effectiveAPRPct: Math.round(effectiveAPRCompound * 1000) / 10,
    nominalAPRPct: Math.round(effectiveAPRNominal * 1000) / 10,
    hiddenFeeMarkupPct: Math.round(hiddenFeeMarkupPct * 10) / 10,
    feesBreakdown: {
      originationFee: Math.round(origFee * 100) / 100,
      totalRecurringFees: Math.round((monthlyFee * n + annualFee * Math.floor(n / 12)) * 100) / 100,
      totalFeesPaid: Math.round(totalFeesPaid * 100) / 100,
      totalBaseInterest: Math.round(totalBaseInterest * 100) / 100,
      totalTrueCostOfCredit: Math.round(totalTrueCostOfCredit * 100) / 100,
    },
    bleeding: {
      daily: Math.round(bleedingPerDay * 100) / 100,
      monthly: Math.round(bleedingPerMonth * 100) / 100,
      annual: Math.round(bleedingPerYear * 100) / 100,
    },
    severity,
    badgeLabel,
    badgeColor,
  };
}

/**
 * Evaluates and ranks a portfolio of debts by their true effective annual cost (CAT).
 * @param {Array<Object>} debts
 * @returns {Array<Object>} Ranked debts with full CAT diagnostics
 */
export function rankDebtsByTrueCost(debts = []) {
  const evaluated = (debts || []).map((d) => {
    const cat = calculateEffectiveAPR({
      principal: d.principalBalance || d.originalAmount || 1000,
      nominalAnnualRate: d.interestRate || 0.15,
      termMonths: d.termMonths || 24,
      originationFeePct: d.originationFeePct || 0,
      monthlyMaintenanceFee: d.monthlyMaintenanceFee || 0,
      monthlyInsuranceFee: d.monthlyInsuranceFee || 0,
      annualCardFee: d.annualCardFee || 0,
    });

    return {
      debtId: d.id,
      name: d.name,
      type: d.type,
      principalBalance: d.principalBalance || 0,
      catReport: cat,
      effectiveAPRPct: cat.effectiveAPRPct,
      monthlyBleeding: cat.bleeding.monthly,
      severity: cat.severity,
    };
  });

  return evaluated.sort((a, b) => b.effectiveAPRPct - a.effectiveAPRPct);
}
