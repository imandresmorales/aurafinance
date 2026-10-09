/**
 * cardFeeBenefitEvaluator.js
 * 
 * Motor de evaluación y comparación costo-beneficio de tarjetas de crédito con cuota anual.
 * Analiza si los beneficios reales, cashback y créditos canjeados justifican la comisión de membresía (ROI),
 * o si el usuario debería cancelar o hacer downgrade a una tarjeta sin cuota.
 */

/**
 * Normaliza categorías de gasto para mapeo consistente.
 */
function normalizeCategoryKey(cat = '') {
  return String(cat || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Evalúa el retorno de inversión neto de una tarjeta de crédito individual.
 * 
 * @param {Object} cardData - Datos de la tarjeta (anualidad, reglas de cashback, beneficios fijos)
 * @param {Object} spendingProfile - Perfil de gastos anuales o mensuales por categoría
 * @param {boolean} [spendingProfile.isMonthly=false] - Si los gastos proporcionados son mensuales (se multiplican por 12)
 * @returns {Object} Diagnóstico costo-beneficio detallado
 */
export function evaluateCardFeeBenefit(cardData = {}, spendingProfile = {}) {
  const annualFee = Math.max(0, Number(cardData.annualFee) || 0);
  const isMonthly = Boolean(spendingProfile.isMonthly);
  const multiplier = isMonthly ? 12 : 1;

  // 1. Desglose de recompensas y cashback por categoría
  const spending = spendingProfile.spending || spendingProfile.categories || spendingProfile;
  const rewardRules = cardData.cashbackCategories || cardData.rewardRates || [];
  const defaultRate = Number(cardData.defaultRewardPercent) || 1.0; // 1% por defecto

  let totalAnnualSpend = 0;
  let annualCashbackEarned = 0;
  const categoryBreakdown = [];

  if (typeof spending === 'object' && spending !== null) {
    Object.entries(spending).forEach(([catKey, amount]) => {
      if (catKey === 'isMonthly' || catKey === 'spending' || catKey === 'categories') return;
      const spend = Math.max(0, Number(amount) || 0) * multiplier;
      if (spend <= 0) return;

      totalAnnualSpend += spend;
      const normKey = normalizeCategoryKey(catKey);

      // Buscar regla de recompensa correspondiente
      const matchedRule = rewardRules.find(r => 
        normalizeCategoryKey(r.category) === normKey ||
        (Array.isArray(r.aliases) && r.aliases.some(a => normalizeCategoryKey(a) === normKey))
      );

      const ratePercent = matchedRule ? Number(matchedRule.percent || matchedRule.rate) || defaultRate : defaultRate;
      const earned = spend * (ratePercent / 100);
      annualCashbackEarned += earned;

      categoryBreakdown.push({
        category: catKey,
        annualSpend: Number(spend.toFixed(2)),
        rewardRatePercent: Number(ratePercent.toFixed(2)),
        earnedBenefit: Number(earned.toFixed(2))
      });
    });
  }

  // 2. Beneficios fijos, créditos y membresías canjeadas
  const perks = Array.isArray(cardData.perks) ? cardData.perks : [];
  let totalPerksValueAvailable = 0;
  let totalPerksValueClaimed = 0;

  const perksBreakdown = perks.map(p => {
    const val = Math.max(0, Number(p.annualValue || p.value) || 0);
    const isUsed = p.isUsed !== false; // por defecto true salvo que se marque false
    totalPerksValueAvailable += val;
    if (isUsed) {
      totalPerksValueClaimed += val;
    }
    return {
      name: p.name || 'Beneficio',
      annualValue: Number(val.toFixed(2)),
      isUsed
    };
  });

  // 3. Cálculos de balance financiero
  const totalGrossBenefit = annualCashbackEarned + totalPerksValueClaimed;
  const netBenefit = totalGrossBenefit - annualFee;
  const effectiveRewardRate = totalAnnualSpend > 0 ? (annualCashbackEarned / totalAnnualSpend) * 100 : defaultRate;
  
  // Gasto necesario solo en cashback para cubrir la anualidad (sin considerar perks)
  const breakEvenSpendNoPerks = effectiveRewardRate > 0 ? (annualFee / (effectiveRewardRate / 100)) : 0;
  // Gasto necesario considerando perks reclamados
  const remainingFeeAfterPerks = Math.max(0, annualFee - totalPerksValueClaimed);
  const breakEvenSpendNet = effectiveRewardRate > 0 ? (remainingFeeAfterPerks / (effectiveRewardRate / 100)) : 0;

  const roiPercent = annualFee > 0 ? ((netBenefit / annualFee) * 100) : 100;

  // 4. Veredicto
  let verdict = 'PROFITABLE';
  if (annualFee === 0) {
    verdict = 'FREE_CARD_PROFITABLE';
  } else if (netBenefit < 0) {
    verdict = 'UNPROFITABLE_CANCEL_OR_DOWNGRADE';
  } else if (netBenefit >= annualFee * 0.5) {
    verdict = 'HIGHLY_PROFITABLE';
  } else if (netBenefit === 0) {
    verdict = 'BREAK_EVEN';
  }

  // 5. Recomendaciones estratégicas
  const recommendations = [];
  if (annualFee > 0) {
    if (netBenefit < 0) {
      recommendations.push(
        `Esta tarjeta te genera una pérdida neta de $${Math.abs(netBenefit).toFixed(2)} al año. Te recomendamos solicitar un cambio (downgrade) a una tarjeta sin cuota o aprovechar los beneficios no canjeados.`
      );
    } else if (roiPercent < 20) {
      recommendations.push(
        `Tu beneficio neto ($${netBenefit.toFixed(2)}/año) apenas compensa la cuota de $${annualFee.toFixed(2)}. Revisa si una tarjeta gratuita con ${defaultRate}% de cashback te daría un resultado similar sin riesgo de costo fijo.`
      );
    } else {
      recommendations.push(
        `¡Excelente rentabilidad! La tarjeta genera un beneficio neto de $${netBenefit.toFixed(2)} (ROI del ${roiPercent.toFixed(1)}%) sobre la cuota anual.`
      );
    }

    if (totalPerksValueAvailable > totalPerksValueClaimed) {
      const unusedPerks = totalPerksValueAvailable - totalPerksValueClaimed;
      recommendations.push(
        `Tienes $${unusedPerks.toFixed(2)} en beneficios y créditos anuales sin utilizar. Reclamarlos incrementaría tu ganancia neta.`
      );
    }
  } else {
    recommendations.push(
      `Tarjeta sin costo anual. Todo el cashback obtenido ($${annualCashbackEarned.toFixed(2)}/año) es ganancia neta directa.`
    );
  }

  return {
    cardName: cardData.name || 'Tarjeta de Crédito',
    annualFee: Number(annualFee.toFixed(2)),
    totalAnnualSpend: Number(totalAnnualSpend.toFixed(2)),
    annualCashbackEarned: Number(annualCashbackEarned.toFixed(2)),
    totalPerksValueAvailable: Number(totalPerksValueAvailable.toFixed(2)),
    totalPerksValueClaimed: Number(totalPerksValueClaimed.toFixed(2)),
    totalGrossBenefit: Number(totalGrossBenefit.toFixed(2)),
    netBenefit: Number(netBenefit.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(1)),
    breakEvenSpendNoPerks: Number(breakEvenSpendNoPerks.toFixed(2)),
    breakEvenSpendNet: Number(breakEvenSpendNet.toFixed(2)),
    effectiveRewardRate: Number(effectiveRewardRate.toFixed(2)),
    verdict,
    categoryBreakdown,
    perksBreakdown,
    recommendations
  };
}

/**
 * Compara múltiples tarjetas de crédito frente a un mismo perfil de consumo y las clasifica por beneficio neto.
 * 
 * @param {Array<Object>} cards - Lista de tarjetas a comparar
 * @param {Object} spendingProfile - Patrón de gasto del usuario
 * @returns {Object} Ranking comparativo y mejor opción
 */
export function compareCardsROI(cards = [], spendingProfile = {}) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return {
      rankings: [],
      bestCard: null,
      potentialAnnualGain: 0
    };
  }

  const evaluated = cards.map(card => evaluateCardFeeBenefit(card, spendingProfile));
  const rankings = [...evaluated].sort((a, b) => b.netBenefit - a.netBenefit);

  const bestCard = rankings[0];
  const worstCard = rankings[rankings.length - 1];
  const potentialAnnualGain = bestCard && worstCard ? Math.max(0, bestCard.netBenefit - worstCard.netBenefit) : 0;

  return {
    rankings,
    bestCard,
    potentialAnnualGain: Number(potentialAnnualGain.toFixed(2))
  };
}
