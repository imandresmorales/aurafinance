/**
 * sankeyEngine.js
 * Multi-Stage Sankey Money Flow Engine (Pure SVG Geometry).
 * Maps: Income Sources ➔ Accounts/Wallets ➔ Expenditure Categories & Savings.
 */

import { normalizeMoney } from '../utils';

/**
 * Calculates Sankey nodes and ribbon links.
 * @param {Array} accounts - User accounts/wallets
 * @param {Array} budgets - Budget envelopes
 * @param {Array} transactions - Ledger transactions
 * @param {string} [period] - YYYY-MM
 * @param {number} [width=800] - Canvas width
 * @param {number} [height=360] - Canvas height
 * @returns {Object} Nodes and ribbon paths for SVG rendering
 */
export function calculateSankeyFlow(
  accounts = [],
  budgets = [],
  transactions = [],
  period = null,
  width = 800,
  height = 360
) {
  const targetPeriod = period || new Date().toISOString().slice(0, 7);

  // Filter transactions for period
  const periodTx = (transactions || []).filter((tx) => {
    if (!tx || tx.deleted || tx.isDeleted) return false;
    if (!tx.date) return false;
    return String(tx.date).startsWith(targetPeriod);
  });

  const incomeTx = periodTx.filter((tx) => (tx.type || '').toUpperCase() === 'INCOME');
  const expenseTx = periodTx.filter((tx) => (tx.type || '').toUpperCase() === 'EXPENSE');

  // Stage 1: Group Income by Category/Source
  const incomeBySource = {};
  incomeTx.forEach((tx) => {
    const src = (tx.category || tx.categoryName || 'Ingresos Principales').trim();
    incomeBySource[src] = (incomeBySource[src] || 0) + (Number(tx.amount) || 0);
  });

  // Stage 2: Group by Account
  const accountTotals = {};
  (accounts || []).forEach((acc) => {
    accountTotals[acc.name] = 0;
  });

  incomeTx.forEach((tx) => {
    const acc = (accounts || []).find((a) => a.id === tx.accountId)?.name || 'Cuenta Principal';
    accountTotals[acc] = (accountTotals[acc] || 0) + (Number(tx.amount) || 0);
  });

  // Stage 3: Group Expenses by Category + Savings
  const expenseByCat = {};
  expenseTx.forEach((tx) => {
    const cat = (tx.category || tx.categoryName || 'General').trim();
    expenseByCat[cat] = (expenseByCat[cat] || 0) + (Number(tx.amount) || 0);
  });

  const totalIncome = normalizeMoney(Object.values(incomeBySource).reduce((s, v) => s + v, 0));
  const totalExpense = normalizeMoney(Object.values(expenseByCat).reduce((s, v) => s + v, 0));
  const netSavings = normalizeMoney(Math.max(0, totalIncome - totalExpense));

  if (netSavings > 0) {
    expenseByCat['Ahorro / Superávit'] = netSavings;
  }

  // If totalIncome is 0, provide fallback structure
  const effectiveTotal = Math.max(totalIncome, totalExpense, 100);

  // Layout parameters
  const colWidth = 18;
  const paddingX = 40;
  const paddingY = 24;
  const usableHeight = height - paddingY * 2;

  // Column X positions: Stage 1 (left), Stage 2 (middle), Stage 3 (right)
  const col1X = paddingX;
  const col2X = width / 2 - colWidth / 2;
  const col3X = width - paddingX - colWidth;

  // Compute Stage 1 Nodes (Income Sources)
  const stage1Items = Object.entries(incomeBySource).map(([name, val]) => ({
    name,
    value: normalizeMoney(val),
    stage: 1,
    color: '#10b981',
  }));
  if (stage1Items.length === 0) {
    stage1Items.push({ name: 'Ingresos', value: effectiveTotal, stage: 1, color: '#10b981' });
  }

  // Compute Stage 2 Nodes (Accounts)
  const stage2Items = Object.entries(accountTotals)
    .filter(([_, val]) => val > 0)
    .map(([name, val]) => ({
      name,
      value: normalizeMoney(val),
      stage: 2,
      color: '#3b82f6',
    }));
  if (stage2Items.length === 0) {
    stage2Items.push({ name: 'Cuentas & Bóveda', value: effectiveTotal, stage: 2, color: '#3b82f6' });
  }

  // Compute Stage 3 Nodes (Categories & Savings)
  const stage3Items = Object.entries(expenseByCat).map(([name, val]) => ({
    name,
    value: normalizeMoney(val),
    stage: 3,
    color: name.includes('Ahorro') ? '#e2c275' : '#f87171',
  }));
  if (stage3Items.length === 0) {
    stage3Items.push({ name: 'Gastos & Sobres', value: effectiveTotal, stage: 3, color: '#f87171' });
  }

  // Helper to layout a column of nodes
  function layoutColumn(items, xPos) {
    const colTotal = items.reduce((s, it) => s + it.value, 0) || 1;
    const gap = items.length > 1 ? 12 : 0;
    const availableHeightForBars = usableHeight - gap * (items.length - 1);

    let currentY = paddingY;
    return items.map((it, idx) => {
      const barHeight = Math.max(16, (it.value / colTotal) * availableHeightForBars);
      const node = {
        ...it,
        id: `node-${it.stage}-${idx}`,
        x: xPos,
        y: currentY,
        width: colWidth,
        height: barHeight,
      };
      currentY += barHeight + gap;
      return node;
    });
  }

  const nodesStage1 = layoutColumn(stage1Items, col1X);
  const nodesStage2 = layoutColumn(stage2Items, col2X);
  const nodesStage3 = layoutColumn(stage3Items, col3X);

  const allNodes = [...nodesStage1, ...nodesStage2, ...nodesStage3];

  // Helper to generate a curved ribbon path between two vertical segments
  function createRibbonPath(x0, y0Top, y0Bottom, x1, y1Top, y1Bottom) {
    const midX = (x0 + x1) / 2;
    return [
      `M ${x0.toFixed(2)},${y0Top.toFixed(2)}`,
      `C ${midX.toFixed(2)},${y0Top.toFixed(2)} ${midX.toFixed(2)},${y1Top.toFixed(2)} ${x1.toFixed(2)},${y1Top.toFixed(2)}`,
      `L ${x1.toFixed(2)},${y1Bottom.toFixed(2)}`,
      `C ${midX.toFixed(2)},${y1Bottom.toFixed(2)} ${midX.toFixed(2)},${y0Bottom.toFixed(2)} ${x0.toFixed(2)},${y0Bottom.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  // Generate links Stage 1 ➔ Stage 2
  const links = [];
  nodesStage1.forEach((n1) => {
    nodesStage2.forEach((n2) => {
      const weight = (n1.value * n2.value) / (effectiveTotal * effectiveTotal || 1);
      const linkHeightSource = n1.height * (n2.value / (effectiveTotal || 1));
      const linkHeightTarget = n2.height * (n1.value / (effectiveTotal || 1));

      const path = createRibbonPath(
        n1.x + n1.width,
        n1.y,
        n1.y + Math.max(2, linkHeightSource),
        n2.x,
        n2.y,
        n2.y + Math.max(2, linkHeightTarget)
      );

      links.push({
        id: `link-${n1.id}-${n2.id}`,
        source: n1.name,
        target: n2.name,
        path,
        color: n1.color,
      });
    });
  });

  // Generate links Stage 2 ➔ Stage 3
  nodesStage2.forEach((n2) => {
    nodesStage3.forEach((n3) => {
      const path = createRibbonPath(
        n2.x + n2.width,
        n2.y,
        n2.y + n2.height * 0.8,
        n3.x,
        n3.y,
        n3.y + n3.height * 0.8
      );

      links.push({
        id: `link-${n2.id}-${n3.id}`,
        source: n2.name,
        target: n3.name,
        path,
        color: n3.color,
      });
    });
  });

  return {
    period: targetPeriod,
    totalIncome,
    totalExpense,
    netSavings,
    nodes: allNodes,
    links,
  };
}
