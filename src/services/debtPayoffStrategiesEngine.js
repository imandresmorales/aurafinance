/**
 * debtPayoffStrategiesEngine.js
 * Debt Elimination Strategy Simulator (Snowball vs Avalanche vs Minimum Only) for AuraFinance.
 * Simulates month-by-month debt roll-over dynamics, interest capitalization, and freedom dates.
 * Zero-Knowledge local processing.
 */

/**
 * Simulates debt payoff trajectory under a specific strategy.
 * @param {Array<Object>} debts - Portfolio of debts
 * @param {'AVALANCHE'|'SNOWBALL'|'MINIMUM_ONLY'} strategy
 * @param {number} [monthlyExtraBudget=0] - Additional monthly amount over minimums
 * @param {Object} [options]
 * @param {number} [options.maxMonths=360] - Max simulation cap (30 years)
 * @param {string|Date} [options.startDate=new Date()]
 * @returns {Object} Full payoff simulation result
 */
export function simulatePayoffStrategy(
  debts = [],
  strategy = 'AVALANCHE',
  monthlyExtraBudget = 0,
  options = {}
) {
  const activeDebts = (debts || [])
    .filter((d) => (Number(d.principalBalance) || 0) > 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      balance: Math.max(0, Number(d.principalBalance) || 0),
      rate: Math.max(0, Number(d.interestRate) || 0),
      minPayment: Math.max(1, Number(d.minimumMonthlyPayment) || 10),
      originalBalance: Math.max(0, Number(d.principalBalance) || 0),
      totalInterestPaid: 0,
      paidOffMonth: null,
    }));

  if (activeDebts.length === 0) {
    return {
      strategy,
      monthsToDebtFree: 0,
      debtFreeDate: new Date().toISOString().split('T')[0],
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      totalPaid: 0,
      payoffOrder: [],
      monthlySchedule: [],
    };
  }

  const extraBudget = Math.max(0, Number(monthlyExtraBudget) || 0);
  const maxMonths = Number(options.maxMonths) || 360;
  const start = options.startDate ? new Date(options.startDate) : new Date();

  let month = 0;
  let totalInterestAccumulated = 0;
  let totalPrincipalAccumulated = 0;
  const payoffOrder = [];
  const monthlySchedule = [];

  while (activeDebts.some((d) => d.balance > 0) && month < maxMonths) {
    month++;
    let monthlyAvailableExtra = strategy === 'MINIMUM_ONLY' ? 0 : extraBudget;
    let monthlyTotalInterest = 0;
    let monthlyTotalPrincipal = 0;

    // 1. Accrue interest on all unpaid debts
    activeDebts.forEach((d) => {
      if (d.balance > 0) {
        const monthlyRate = d.rate / 12;
        const interest = d.balance * monthlyRate;
        d.balance += interest;
        d.totalInterestPaid += interest;
        monthlyTotalInterest += interest;
        totalInterestAccumulated += interest;
      }
    });

    // 2. Pay minimums on all debts (and collect freed-up minimums from already paid-off debts into the snowball pool)
    activeDebts.forEach((d) => {
      if (d.balance > 0) {
        const minPay = Math.min(d.balance, d.minPayment);
        d.balance -= minPay;
        monthlyTotalPrincipal += minPay;
        totalPrincipalAccumulated += minPay;

        if (d.balance <= 0.01) {
          d.balance = 0;
          if (d.paidOffMonth === null) {
            d.paidOffMonth = month;
            payoffOrder.push({
              debtId: d.id,
              name: d.name,
              monthPaidOff: month,
              totalInterestPaid: Math.round(d.totalInterestPaid * 100) / 100,
            });
          }
        }
      } else if (strategy !== 'MINIMUM_ONLY') {
        // Snowball/Avalanche rollover: Add freed up minimum payment to extra pool
        monthlyAvailableExtra += d.minPayment;
      }
    });

    // 3. Direct extra budget toward priority target debt
    if (monthlyAvailableExtra > 0 && strategy !== 'MINIMUM_ONLY') {
      let remainingDebts = activeDebts.filter((d) => d.balance > 0);

      if (strategy === 'AVALANCHE') {
        // Highest interest rate first
        remainingDebts.sort((a, b) => b.rate - a.rate);
      } else if (strategy === 'SNOWBALL') {
        // Lowest balance first
        remainingDebts.sort((a, b) => a.balance - b.balance);
      }

      for (const targetDebt of remainingDebts) {
        if (monthlyAvailableExtra <= 0) break;

        const extraToApply = Math.min(targetDebt.balance, monthlyAvailableExtra);
        targetDebt.balance -= extraToApply;
        monthlyTotalPrincipal += extraToApply;
        totalPrincipalAccumulated += extraToApply;
        monthlyAvailableExtra -= extraToApply;

        if (targetDebt.balance <= 0.01) {
          targetDebt.balance = 0;
          if (targetDebt.paidOffMonth === null) {
            targetDebt.paidOffMonth = month;
            payoffOrder.push({
              debtId: targetDebt.id,
              name: targetDebt.name,
              monthPaidOff: month,
              totalInterestPaid: Math.round(targetDebt.totalInterestPaid * 100) / 100,
            });
          }
        }
      }
    }

    const currentTotalBalance = activeDebts.reduce((sum, d) => sum + d.balance, 0);

    if (month <= 60 || currentTotalBalance <= 0 || month % 12 === 0) {
      monthlySchedule.push({
        month,
        totalRemainingBalance: Math.round(currentTotalBalance * 100) / 100,
        monthlyInterestPaid: Math.round(monthlyTotalInterest * 100) / 100,
        monthlyPrincipalPaid: Math.round(monthlyTotalPrincipal * 100) / 100,
      });
    }

    if (currentTotalBalance <= 0) {
      break;
    }
  }

  const debtFreeDate = new Date(start);
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  return {
    strategy,
    monthsToDebtFree: month,
    debtFreeDate: debtFreeDate.toISOString().split('T')[0],
    totalInterestPaid: Math.round(totalInterestAccumulated * 100) / 100,
    totalPrincipalPaid: Math.round(totalPrincipalAccumulated * 100) / 100,
    totalPaid: Math.round((totalPrincipalAccumulated + totalInterestAccumulated) * 100) / 100,
    payoffOrder,
    monthlySchedule,
  };
}

/**
 * Compares Avalanche, Snowball, and Minimum-Only strategies side by side.
 * @param {Array<Object>} debts
 * @param {number} [monthlyExtraBudget=150]
 * @returns {Object} Strategy comparison report
 */
export function compareDebtPayoffStrategies(debts = [], monthlyExtraBudget = 150) {
  const avalanche = simulatePayoffStrategy(debts, 'AVALANCHE', monthlyExtraBudget);
  const snowball = simulatePayoffStrategy(debts, 'SNOWBALL', monthlyExtraBudget);
  const minimumOnly = simulatePayoffStrategy(debts, 'MINIMUM_ONLY', 0);

  const interestSavedByAvalancheVsMin = Math.max(0, minimumOnly.totalInterestPaid - avalanche.totalInterestPaid);
  const interestSavedBySnowballVsMin = Math.max(0, minimumOnly.totalInterestPaid - snowball.totalInterestPaid);
  const avalancheExtraSavingsVsSnowball = Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid);

  const monthsSavedByAvalanche = Math.max(0, minimumOnly.monthsToDebtFree - avalanche.monthsToDebtFree);
  const monthsSavedBySnowball = Math.max(0, minimumOnly.monthsToDebtFree - snowball.monthsToDebtFree);

  const firstSnowballWinMonth = snowball.payoffOrder.length > 0 ? snowball.payoffOrder[0].monthPaidOff : null;
  const firstAvalancheWinMonth = avalanche.payoffOrder.length > 0 ? avalanche.payoffOrder[0].monthPaidOff : null;

  return {
    monthlyExtraBudget,
    strategies: {
      avalanche,
      snowball,
      minimumOnly,
    },
    savings: {
      avalancheVsMinimumInterestSaved: Math.round(interestSavedByAvalancheVsMin * 100) / 100,
      snowballVsMinimumInterestSaved: Math.round(interestSavedBySnowballVsMin * 100) / 100,
      avalancheVsSnowballInterestSaved: Math.round(avalancheExtraSavingsVsSnowball * 100) / 100,
      avalancheMonthsSaved: monthsSavedByAvalanche,
      snowballMonthsSaved: monthsSavedBySnowball,
    },
    insights: {
      recommendedStrategy: 'AVALANCHE',
      mathematicalWinner: 'AVALANCHE',
      psychologicalWinner: 'SNOWBALL',
      firstWinMonths: {
        snowball: firstSnowballWinMonth,
        avalanche: firstAvalancheWinMonth,
      },
      summaryText: `La estrategia Avalancha te ahorra $${avalancheExtraSavingsVsSnowball.toFixed(2)} adicionales en intereses respecto a Bola de Nieve y termina en ${avalanche.monthsToDebtFree} meses.`,
    },
  };
}
