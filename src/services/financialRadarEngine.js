/**
 * financialRadarEngine.js
 * 5-Pillar Financial Equilibrium Spider/Radar Engine.
 * Calculates normalized scores (0-100) for Liquidity, Diversification, Solvency, Savings, and Debt Control.
 */

import { normalizeMoney } from '../utils';

export const RADAR_PILLARS = [
  { key: 'liquidity', label: 'Liquidez', description: 'Cobertura del fondo de emergencia' },
  { key: 'diversification', label: 'Diversificación', description: 'Distribución multiactivo' },
  { key: 'solvency', label: 'Solvencia', description: 'Patrimonio frente a pasivos' },
  { key: 'savings', label: 'Tasa de Ahorro', description: 'Capacidad de retención de capital' },
  { key: 'debtControl', label: 'Control de Deuda', description: 'Salud y apalancamiento crediticio' },
];

/**
 * Computes scores (0-100) for the 5 financial pillars.
 * @param {Array} accounts - User accounts
 * @param {Array} budgets - Budget envelopes
 * @param {Array} transactions - Transactions
 * @returns {Object} Scores, polygon points, and diagnostic feedback
 */
export function calculateFinancialRadarScores(accounts = [], budgets = [], transactions = []) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Active accounts and balances
  let totalAssets = 0;
  let totalLiabilities = 0;
  let liquidCash = 0;

  (accounts || []).forEach((acc) => {
    const bal = Number(acc.balance) || 0;
    if (acc.type === 'CREDIT' || acc.type === 'LOAN' || bal < 0) {
      totalLiabilities += Math.abs(bal);
    } else {
      totalAssets += bal;
      if (acc.type === 'CHECKING' || acc.type === 'SAVINGS' || acc.type === 'CASH') {
        liquidCash += bal;
      }
    }
  });

  // Monthly flow
  const currentMonthTx = (transactions || []).filter(
    (t) => !t.deleted && !t.isDeleted && t.date && String(t.date).startsWith(currentMonth)
  );

  let monthlyIncome = 0;
  let monthlyExpense = 0;

  currentMonthTx.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const type = (t.type || '').toUpperCase();
    if (type === 'INCOME') monthlyIncome += amt;
    else if (type === 'EXPENSE') monthlyExpense += amt;
  });

  // 1. Liquidity Score: Months of coverage (target: 3 to 6 months)
  const monthlyBurn = monthlyExpense > 0 ? monthlyExpense : 1000;
  const runwayMonths = liquidCash / monthlyBurn;
  let liquidityScore = Math.min(100, Math.round((runwayMonths / 6) * 100));

  // 2. Diversification Score: based on active accounts and asset balance spread
  const nonZeroAccounts = (accounts || []).filter((a) => Number(a.balance) > 0);
  let diversificationScore = Math.min(100, nonZeroAccounts.length * 25);
  if (diversificationScore === 0 && totalAssets > 0) diversificationScore = 50;

  // 3. Solvency Score: Assets vs Liabilities
  let solvencyScore = 100;
  if (totalLiabilities > 0) {
    const debtToAssetRatio = totalLiabilities / (totalAssets || 1);
    solvencyScore = Math.max(0, Math.min(100, Math.round((1 - debtToAssetRatio) * 100)));
  }

  // 4. Savings Rate Score: (Target: 20% or more)
  let savingsScore = 50;
  if (monthlyIncome > 0) {
    const netSavings = Math.max(0, monthlyIncome - monthlyExpense);
    const savingsRate = (netSavings / monthlyIncome) * 100;
    savingsScore = Math.min(100, Math.round((savingsRate / 20) * 100));
  }

  // 5. Debt Control Score: Liabilities vs Monthly Income (Target: Debt payment < 30% income)
  let debtControlScore = 100;
  if (monthlyIncome > 0 && totalLiabilities > 0) {
    const debtRatio = totalLiabilities / (monthlyIncome * 3);
    debtControlScore = Math.max(0, Math.min(100, Math.round((1 - debtRatio) * 100)));
  }

  const scores = {
    liquidity: Math.max(10, liquidityScore),
    diversification: Math.max(10, diversificationScore),
    solvency: Math.max(10, solvencyScore),
    savings: Math.max(10, savingsScore),
    debtControl: Math.max(10, debtControlScore),
  };

  const globalIndex = Math.round(
    (scores.liquidity +
      scores.diversification +
      scores.solvency +
      scores.savings +
      scores.debtControl) / 5
  );

  return {
    scores,
    globalIndex,
    pillars: RADAR_PILLARS.map((p) => ({
      ...p,
      score: scores[p.key],
    })),
  };
}

/**
 * Calculates SVG polygon points for a 5-pillar radar chart.
 * @param {Object} scores - Pillar scores { liquidity, diversification, ... }
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @returns {Object} SVG polygon strings and vertex coordinates
 */
export function generateRadarGeometry(scores, cx = 150, cy = 150, radius = 100) {
  const keys = ['liquidity', 'diversification', 'solvency', 'savings', 'debtControl'];
  const numVertices = keys.length;
  const angleStep = (2 * Math.PI) / numVertices;

  // Compute vertices for user data polygon
  const userVertices = keys.map((key, i) => {
    const score = scores[key] || 10;
    const r = (score / 100) * radius;
    const angle = i * angleStep - Math.PI / 2; // start top

    return {
      key,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      score,
    };
  });

  const userPolygonPath =
    userVertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ') +
    ' Z';

  // Concentric background grids (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
    const r = radius * level;
    const points = Array.from({ length: numVertices }).map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    return points.join(' ');
  });

  // Spokes from center to outer vertices
  const spokes = Array.from({ length: numVertices }).map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x1: cx,
      y1: cy,
      x2: cx + radius * Math.cos(angle),
      y2: cy + radius * Math.sin(angle),
    };
  });

  // Axis label positions (slightly beyond outer radius)
  const labelPositions = keys.map((key, i) => {
    const r = radius + 22;
    const angle = i * angleStep - Math.PI / 2;
    return {
      key,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  return {
    userVertices,
    userPolygonPath,
    gridLevels,
    spokes,
    labelPositions,
  };
}
