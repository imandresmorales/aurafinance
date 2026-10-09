/**
 * annualInterestCostEngine.js
 * 
 * Motor de concienciación y cálculo del costo anual en intereses y comisiones de pasivos.
 * Traduce el sangrado financiero por intereses a métricas tangibles como horas/días
 * de trabajo perdidos y costo de oportunidad acumulado si se invirtieran esos montos.
 */

/**
 * Calcula el resumen anual consolidado de intereses, desglose por pasivo,
 * equivalencia en horas laborales y costo de oportunidad de inversión.
 * 
 * @param {Array<Object>} debts - Lista de deudas activas
 * @param {number} [hourlyWage=0] - Salario o ingreso neto por hora de trabajo
 * @param {Object} [options]
 * @param {number} [options.investmentYieldAnnual=0.08] - Rendimiento anual estimado para simular costo de oportunidad (default 8%)
 * @returns {Object} Resumen analítico de impacto financiero
 */
export function calculateAnnualInterestCostSummary(debts = [], hourlyWage = 0, options = {}) {
  const wage = Math.max(0, Number(hourlyWage) || 0);
  const investmentYield = Number(options.investmentYieldAnnual) || 0.08;

  if (!Array.isArray(debts) || debts.length === 0) {
    return {
      totalBalance: 0,
      totalAnnualInterest: 0,
      totalMonthlyInterest: 0,
      totalAnnualPayments: 0,
      weightedAverageApr: 0,
      totalWorkHoursLost: 0,
      totalWorkDaysLost: 0,
      highestInterestDrainer: null,
      highestAprDrainer: null,
      debtsBreakdown: [],
      opportunityCost: {
        in5Years: 0,
        in10Years: 0,
        in20Years: 0
      },
      awarenessAlerts: ['No tienes deudas activas registradas. ¡Excelente salud financiera!']
    };
  }

  let totalBalance = 0;
  let totalAnnualInterest = 0;
  let totalMonthlyPayments = 0;
  let weightedAprSum = 0;

  const debtsBreakdown = debts.map(debt => {
    const balance = Math.max(0, Number(debt.balance || debt.currentBalance) || 0);
    const apr = Math.max(0, Number(debt.apr || debt.interestRate) || 0);
    const monthlyPayment = Math.max(0, Number(debt.monthlyPayment || debt.minPayment) || 0);
    const annualFee = Math.max(0, Number(debt.annualFee) || 0);

    // Estimación de interés anual simple sobre saldo actual
    const annualInterest = (balance * (apr / 100)) + annualFee;
    const monthlyInterest = annualInterest / 12;
    const monthlyPrincipal = Math.max(0, monthlyPayment - monthlyInterest);
    const interestRatioPercent = monthlyPayment > 0 
      ? Math.min(100, (monthlyInterest / monthlyPayment) * 100) 
      : 100;

    const workHoursLost = wage > 0 ? annualInterest / wage : 0;
    const workDaysLost = workHoursLost / 8;

    totalBalance += balance;
    totalAnnualInterest += annualInterest;
    totalMonthlyPayments += monthlyPayment;
    weightedAprSum += balance * apr;

    return {
      id: debt.id || debt.name || 'debt',
      name: debt.name || 'Deuda sin nombre',
      type: debt.type || 'CREDIT',
      balance: Number(balance.toFixed(2)),
      apr: Number(apr.toFixed(2)),
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      annualInterest: Number(annualInterest.toFixed(2)),
      monthlyInterest: Number(monthlyInterest.toFixed(2)),
      monthlyPrincipal: Number(monthlyPrincipal.toFixed(2)),
      interestRatioPercent: Number(interestRatioPercent.toFixed(1)),
      workHoursLost: Number(workHoursLost.toFixed(1)),
      workDaysLost: Number(workDaysLost.toFixed(2))
    };
  });

  const totalMonthlyInterest = totalAnnualInterest / 12;
  const totalAnnualPayments = totalMonthlyPayments * 12;
  const weightedAverageApr = totalBalance > 0 ? (weightedAprSum / totalBalance) : 0;
  const totalWorkHoursLost = wage > 0 ? totalAnnualInterest / wage : 0;
  const totalWorkDaysLost = totalWorkHoursLost / 8;

  // Encontrar el mayor sangrador de intereses y mayor APR
  let highestInterestDrainer = null;
  let highestAprDrainer = null;

  if (debtsBreakdown.length > 0) {
    highestInterestDrainer = [...debtsBreakdown].sort((a, b) => b.annualInterest - a.annualInterest)[0];
    highestAprDrainer = [...debtsBreakdown].sort((a, b) => b.apr - a.apr)[0];
  }

  // Costo de oportunidad: FV = PMT * (((1 + r)^n - 1) / r)
  // Anual PMT = totalAnnualInterest invertido a fin de año
  const calcFutureValue = (annualPmt, r, years) => {
    if (annualPmt <= 0 || years <= 0) return 0;
    if (r === 0) return annualPmt * years;
    return annualPmt * ((Math.pow(1 + r, years) - 1) / r);
  };

  const opportunityCost = {
    in5Years: Number(calcFutureValue(totalAnnualInterest, investmentYield, 5).toFixed(2)),
    in10Years: Number(calcFutureValue(totalAnnualInterest, investmentYield, 10).toFixed(2)),
    in20Years: Number(calcFutureValue(totalAnnualInterest, investmentYield, 20).toFixed(2))
  };

  // Alertas y reflexiones
  const awarenessAlerts = [];
  if (totalAnnualInterest > 0) {
    if (wage > 0) {
      awarenessAlerts.push(
        `Estás trabajando ${totalWorkDaysLost.toFixed(1)} días laborales al año (aprox. ${totalWorkHoursLost.toFixed(0)} horas) exclusivamente para pagar intereses a las entidades financieras.`
      );
    }
    if (highestInterestDrainer && highestInterestDrainer.annualInterest > 0) {
      awarenessAlerts.push(
        `Tu mayor fuga de intereses es "${highestInterestDrainer.name}" con $${highestInterestDrainer.annualInterest.toFixed(2)} al año (${highestInterestDrainer.interestRatioPercent.toFixed(0)}% de cada cuota no amortiza capital).`
      );
    }
    if (opportunityCost.in10Years > 0) {
      awarenessAlerts.push(
        `Si destinaras esos $${totalAnnualInterest.toFixed(2)}/año a inversión con ${((investmentYield * 100).toFixed(0))}% de rendimiento, acumularías $${opportunityCost.in10Years.toLocaleString('es-ES', { minimumFractionDigits: 2 })} en 10 años.`
      );
    }
  }

  return {
    totalBalance: Number(totalBalance.toFixed(2)),
    totalAnnualInterest: Number(totalAnnualInterest.toFixed(2)),
    totalMonthlyInterest: Number(totalMonthlyInterest.toFixed(2)),
    totalAnnualPayments: Number(totalAnnualPayments.toFixed(2)),
    weightedAverageApr: Number(weightedAverageApr.toFixed(2)),
    totalWorkHoursLost: Number(totalWorkHoursLost.toFixed(1)),
    totalWorkDaysLost: Number(totalWorkDaysLost.toFixed(2)),
    highestInterestDrainer,
    highestAprDrainer,
    debtsBreakdown,
    opportunityCost,
    awarenessAlerts
  };
}
