/**
 * Motor Heurístico de Detección de Transacciones Duplicadas y Cobros Anómalos
 * Identifica posibles cargos duplicados por fecha, cuenta, monto y similitud de texto.
 */

import { calculateFuzzyScore, normalizeSearchString } from '../utils/fuzzySearch';

/**
 * Detecta transacciones duplicadas o altamente sospechosas dentro de una ventana temporal.
 */
export function detectDuplicateTransactions(transactions = [], maxDaysDiff = 2) {
  const activeTxs = (transactions || []).filter((t) => !t.deleted);
  const duplicateGroups = [];
  const processedPairIds = new Set();

  for (let i = 0; i < activeTxs.length; i++) {
    const txA = activeTxs[i];
    const groupMatches = [];

    for (let j = i + 1; j < activeTxs.length; j++) {
      const txB = activeTxs[j];
      const pairKey = [txA.id, txB.id].sort().join(':::');

      if (processedPairIds.has(pairKey)) continue;

      // 1. Mismo tipo y mismo monto exacto
      const sameType = txA.type === txB.type;
      const sameAmount = Math.abs(txA.amount - txB.amount) < 0.001;

      if (!sameType || !sameAmount) continue;

      // 2. Misma cuenta origen / destino
      const sameSource = txA.sourceAccountId === txB.sourceAccountId;
      const sameDest = txA.destinationAccountId === txB.destinationAccountId;
      if (!sameSource && !sameDest) continue;

      // 3. Ventana temporal (en días)
      const dateA = new Date(txA.date).getTime();
      const dateB = new Date(txB.date).getTime();
      const daysDiff = Math.abs(dateA - dateB) / 86400000;

      if (daysDiff > maxDaysDiff) continue;

      // 4. Similitud de concepto (Fuzzy text score)
      const conceptScore = calculateFuzzyScore(txA.concept, txB.concept);
      const isHighSimilarity =
        conceptScore >= 60 ||
        normalizeSearchString(txA.concept) === normalizeSearchString(txB.concept);

      if (isHighSimilarity) {
        processedPairIds.add(pairKey);
        groupMatches.push({
          duplicateTx: txB,
          daysDiff: Math.round(daysDiff * 10) / 10,
          similarityScore: conceptScore,
          confidence: daysDiff === 0 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    if (groupMatches.length > 0) {
      duplicateGroups.push({
        primaryTx: txA,
        candidates: groupMatches,
      });
    }
  }

  return duplicateGroups;
}

/**
 * Detecta consumos atípicamente altos (Outlier Spikes) respecto a la media de su categoría.
 */
export function detectUnusualSpikes(transactions = [], multiplier = 2.5) {
  const activeTxs = (transactions || []).filter((t) => !t.deleted && t.type === 'EXPENSE');
  const categoryStats = {};

  // Calcular media por categoría
  activeTxs.forEach((tx) => {
    const cat = tx.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, count: 0, items: [] };
    }
    categoryStats[cat].total += tx.amount;
    categoryStats[cat].count += 1;
    categoryStats[cat].items.push(tx);
  });

  const outliers = [];

  Object.entries(categoryStats).forEach(([cat, stats]) => {
    if (stats.count < 3) return; // Mínimo estadístico para evitar falsos positivos
    const average = stats.total / stats.count;

    stats.items.forEach((tx) => {
      if (tx.amount >= average * multiplier && tx.amount > 50) {
        outliers.push({
          tx,
          category: cat,
          categoryAverage: Math.round(average * 100) / 100,
          factor: Math.round((tx.amount / average) * 10) / 10,
        });
      }
    });
  });

  return outliers;
}

/**
 * Diagnóstico integral de anomalías contables en el Libro Mayor.
 */
export function scanLedgerAnomalies(transactions = []) {
  const duplicates = detectDuplicateTransactions(transactions);
  const outliers = detectUnusualSpikes(transactions);

  const totalWarnings = duplicates.length + outliers.length;

  return {
    totalWarnings,
    hasAnomalies: totalWarnings > 0,
    duplicates,
    outliers,
    scannedAt: Date.now(),
  };
}
