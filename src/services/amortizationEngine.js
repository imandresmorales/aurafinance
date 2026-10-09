/**
 * amortizationEngine.js
 * Comprehensive Multi-Method Loan Amortization Schedule Engine for AuraFinance.
 * Computes exact payment schedules for French (Annuity/Fixed Cuota), German (Fixed Principal),
 * and American (Interest-Only / Balloon) amortization systems.
 * Zero-Knowledge local processing.
 */

export const AMORTIZATION_SYSTEMS = {
  FRENCH: {
    id: 'FRENCH',
    name: 'Sistema Francés (Cuota Fija)',
    description: 'Cuota mensual constante durante todo el plazo. Intereses decrecientes y capital creciente.',
  },
  GERMAN: {
    id: 'GERMAN',
    name: 'Sistema Alemán (Amortización Constante)',
    description: 'Amortización de capital fija mensual. Cuota total decreciente mes a mes.',
  },
  AMERICAN: {
    id: 'AMERICAN',
    name: 'Sistema Americano (Solo Intereses / Balloon)',
    description: 'Pagos periódicos exclusivamente de intereses. Devolución íntegra del capital en la última cuota.',
  },
};

/**
 * Generates an amortization schedule for a loan based on chosen system.
 * @param {Object} params
 * @param {number} params.principal - Total borrowed amount
 * @param {number} params.annualRate - Annual nominal interest rate (e.g. 0.09 for 9%)
 * @param {number} params.termMonths - Total repayment periods in months
 * @param {'FRENCH'|'GERMAN'|'AMERICAN'} [params.system='FRENCH']
 * @param {Object} [options]
 * @param {string|Date} [options.startDate=new Date()]
 * @returns {Object} Amortization report and schedule
 */
export function generateAmortizationSchedule({
  principal = 10000,
  annualRate = 0.08,
  termMonths = 36,
  system = 'FRENCH',
} = {}, options = {}) {
  const P = Math.max(100, Number(principal) || 10000);
  const r = Math.max(0, Number(annualRate) || 0);
  const n = Math.max(1, Math.min(600, Number(termMonths) || 36));
  const chosenSystem = AMORTIZATION_SYSTEMS[system] ? system : 'FRENCH';
  const start = options.startDate ? new Date(options.startDate) : new Date();

  const monthlyRate = r / 12;
  const schedule = [];

  let currentBalance = P;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  // 1. French System (Fixed Periodic Payment)
  let frenchPmt = 0;
  if (chosenSystem === 'FRENCH') {
    frenchPmt = monthlyRate > 0
      ? P * ((monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1))
      : P / n;
  }

  // 2. German System (Fixed Principal Portion)
  const germanPrincipalPerMonth = P / n;

  for (let k = 1; k <= n; k++) {
    const periodDate = new Date(start);
    periodDate.setMonth(periodDate.getMonth() + (k - 1));

    const beginningBalance = currentBalance;
    const interestPayment = beginningBalance * monthlyRate;

    let principalPayment = 0;
    let totalPayment = 0;

    if (chosenSystem === 'FRENCH') {
      if (k === n) {
        // Final period rounding adjustment
        principalPayment = beginningBalance;
        totalPayment = principalPayment + interestPayment;
      } else {
        totalPayment = frenchPmt;
        principalPayment = Math.min(beginningBalance, frenchPmt - interestPayment);
      }
    } else if (chosenSystem === 'GERMAN') {
      principalPayment = Math.min(beginningBalance, germanPrincipalPerMonth);
      totalPayment = principalPayment + interestPayment;
    } else if (chosenSystem === 'AMERICAN') {
      if (k === n) {
        // Last period pays full principal + interest
        principalPayment = beginningBalance;
        totalPayment = beginningBalance + interestPayment;
      } else {
        principalPayment = 0;
        totalPayment = interestPayment;
      }
    }

    currentBalance = Math.max(0, beginningBalance - principalPayment);
    cumulativeInterest += interestPayment;
    cumulativePrincipal += principalPayment;

    schedule.push({
      period: k,
      date: periodDate.toISOString().split('T')[0],
      beginningBalance: Math.round(beginningBalance * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      endingBalance: Math.round(currentBalance * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
    });
  }

  const totalInterestPaid = Math.round(cumulativeInterest * 100) / 100;
  const totalPaid = Math.round((P + cumulativeInterest) * 100) / 100;
  const firstPaymentAmount = schedule[0] ? schedule[0].totalPayment : 0;
  const lastPaymentAmount = schedule[schedule.length - 1] ? schedule[schedule.length - 1].totalPayment : 0;

  return {
    principal: P,
    annualRate: r,
    termMonths: n,
    system: chosenSystem,
    systemMeta: AMORTIZATION_SYSTEMS[chosenSystem],
    totalInterestPaid,
    totalPaid,
    firstPaymentAmount,
    lastPaymentAmount,
    monthlyPaymentAmount: chosenSystem === 'FRENCH' ? Math.round(frenchPmt * 100) / 100 : null,
    interestRatio: Math.round((totalInterestPaid / P) * 1000) / 10,
    schedule,
  };
}

/**
 * Compares the French, German, and American systems for the exact same loan parameters.
 * @param {number} principal
 * @param {number} annualRate
 * @param {number} termMonths
 * @returns {Object} Comparative metrics across the 3 systems
 */
export function compareAmortizationSystems(principal = 10000, annualRate = 0.08, termMonths = 36) {
  const french = generateAmortizationSchedule({ principal, annualRate, termMonths, system: 'FRENCH' });
  const german = generateAmortizationSchedule({ principal, annualRate, termMonths, system: 'GERMAN' });
  const american = generateAmortizationSchedule({ principal, annualRate, termMonths, system: 'AMERICAN' });

  return {
    principal,
    annualRate,
    termMonths,
    systems: {
      french: {
        name: 'Sistema Francés',
        totalInterest: french.totalInterestPaid,
        totalPaid: french.totalPaid,
        initialPayment: french.firstPaymentAmount,
        finalPayment: french.lastPaymentAmount,
      },
      german: {
        name: 'Sistema Alemán',
        totalInterest: german.totalInterestPaid,
        totalPaid: german.totalPaid,
        initialPayment: german.firstPaymentAmount,
        finalPayment: german.lastPaymentAmount,
        interestSavingsVsFrench: Math.round((french.totalInterestPaid - german.totalInterestPaid) * 100) / 100,
      },
      american: {
        name: 'Sistema Americano',
        totalInterest: american.totalInterestPaid,
        totalPaid: american.totalPaid,
        regularPayment: american.firstPaymentAmount,
        finalBalloonPayment: american.lastPaymentAmount,
        extraInterestVsFrench: Math.round((american.totalInterestPaid - french.totalInterestPaid) * 100) / 100,
      },
    },
    cheapestSystem: 'GERMAN',
    mostPredictableSystem: 'FRENCH',
  };
}
