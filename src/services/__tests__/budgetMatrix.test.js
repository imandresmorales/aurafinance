import { describe, it, expect } from 'vitest';
import {
  buildBudgetMatrix,
  compareInterannualBudgets,
  generateMatrixCSV,
  MONTH_NAMES_SHORT,
} from '../budgetMatrixEngine';

describe('BudgetMatrix Engine - Interannual Multi-Period Analytics', () => {
  const budgets = [
    { id: 'b1', name: 'Alimentación', category: 'Alimentación', allocated: 500, color: '#10b981', icon: '🛒' },
    { id: 'b2', name: 'Transporte', category: 'Transporte', allocated: 200, color: '#3b82f6', icon: '🚗' },
  ];

  const transactions = [
    { id: 'tx1', type: 'EXPENSE', category: 'Alimentación', amount: 450, date: '2026-01-15' },
    { id: 'tx2', type: 'EXPENSE', category: 'Alimentación', amount: 550, date: '2026-02-10' }, // Overbudget
    { id: 'tx3', type: 'EXPENSE', category: 'Transporte', amount: 180, date: '2026-01-20' },
    { id: 'tx4', type: 'EXPENSE', category: 'Transporte', amount: 220, date: '2026-02-25' }, // Overbudget
    // Previous year transactions for YoY
    { id: 'tx5', type: 'EXPENSE', category: 'Alimentación', amount: 400, date: '2025-01-15' },
  ];

  it('builds a structured 12-month matrix for the specified year', () => {
    const matrix = buildBudgetMatrix(budgets, transactions, 2026);

    expect(matrix.year).toBe('2026');
    expect(matrix.rows).toHaveLength(2);
    expect(matrix.monthlyTotals).toHaveLength(12);

    const foodRow = matrix.rows.find((r) => r.name === 'Alimentación');
    expect(foodRow.monthlyLimit).toBe(500);
    expect(foodRow.totalBudgetedYear).toBe(6000);
    expect(foodRow.months[0].actual).toBe(450);
    expect(foodRow.months[0].isOver).toBe(false);
    expect(foodRow.months[1].actual).toBe(550);
    expect(foodRow.months[1].isOver).toBe(true);

    // Check monthly aggregate totals
    expect(matrix.monthlyTotals[0].budgeted).toBe(700);
    expect(matrix.monthlyTotals[0].actual).toBe(630);
    expect(matrix.monthlyTotals[0].variance).toBe(70);

    expect(matrix.monthlyTotals[1].budgeted).toBe(700);
    expect(matrix.monthlyTotals[1].actual).toBe(770);
    expect(matrix.monthlyTotals[1].isOver).toBe(true);
  });

  it('accurately compares year-over-year budget execution (YoY)', () => {
    const yoy = compareInterannualBudgets(budgets, transactions, 2025, 2026);

    expect(yoy.yearA).toBe('2025');
    expect(yoy.yearB).toBe('2026');
    expect(yoy.totalActualYearA).toBe(400);
    expect(yoy.totalActualYearB).toBe(1400);
    expect(yoy.spentDiff).toBe(1000);
    expect(yoy.isIncrease).toBe(true);
    expect(yoy.percentChange).toBe(250);
  });

  it('generates valid CSV representation for tabular download', () => {
    const matrix = buildBudgetMatrix(budgets, transactions, 2026);
    const csv = generateMatrixCSV(matrix);

    expect(csv).toContain('Sobre / Categoria');
    expect(csv).toContain('Ene ($)');
    expect(csv).toContain('Dic ($)');
    expect(csv).toContain('"Alimentación"');
    expect(csv).toContain('"Transporte"');
    expect(csv).toContain('"TOTAL EJECUTADO (2026)"');
  });
});
