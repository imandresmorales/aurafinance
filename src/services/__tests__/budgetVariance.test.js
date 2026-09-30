import { describe, it, expect } from 'vitest';
import { calculateBudgetVariances, generateVarianceCSV } from '../budgetVarianceEngine';

describe('Budget Variance Engine', () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const mockBudgets = [
    { id: 'b1', name: 'Alimentación', category: 'Alimentación', limit: 500, color: '#10b981' },
    { id: 'b2', name: 'Transporte', category: 'Transporte', limit: 200, color: '#3b82f6' },
    { id: 'b3', name: 'Ocio', category: 'Ocio', limit: 100, color: '#f59e0b' }
  ];

  const mockTransactions = [
    { id: 't1', type: 'expense', category: 'Alimentación', amount: 350, date: `${currentMonth}-05` },
    { id: 't2', type: 'expense', category: 'Transporte', amount: 180, date: `${currentMonth}-10` },
    { id: 't3', type: 'expense', category: 'Ocio', amount: 150, date: `${currentMonth}-15` }, // over budget
    { id: 't4', type: 'income', category: 'Salario', amount: 2000, date: `${currentMonth}-01` },
    { id: 't5', type: 'expense', category: 'Alimentación', amount: 50, date: '2025-01-01' } // past month
  ];

  it('calculates accurate variances, actuals, and percentages per envelope', () => {
    const result = calculateBudgetVariances(mockBudgets, mockTransactions, currentMonth);

    expect(result.items).toHaveLength(3);

    // Alimentación: budgeted 500, actual 350, variance 150, 70% -> favorable
    const food = result.items.find(i => i.category === 'Alimentación');
    expect(food.budgeted).toBe(500);
    expect(food.actual).toBe(350);
    expect(food.variance).toBe(150);
    expect(food.percentSpent).toBe(70);
    expect(food.status).toBe('favorable');

    // Transporte: budgeted 200, actual 180, variance 20, 90% -> warning
    const transport = result.items.find(i => i.category === 'Transporte');
    expect(transport.budgeted).toBe(200);
    expect(transport.actual).toBe(180);
    expect(transport.variance).toBe(20);
    expect(transport.percentSpent).toBe(90);
    expect(transport.status).toBe('warning');

    // Ocio: budgeted 100, actual 150, variance -50, 150% -> unfavorable
    const leisure = result.items.find(i => i.category === 'Ocio');
    expect(leisure.budgeted).toBe(100);
    expect(leisure.actual).toBe(150);
    expect(leisure.variance).toBe(-50);
    expect(leisure.percentSpent).toBe(150);
    expect(leisure.status).toBe('unfavorable');
  });

  it('computes global KPIs and adherence score accurately', () => {
    const result = calculateBudgetVariances(mockBudgets, mockTransactions, currentMonth);

    expect(result.totalBudgeted).toBe(800); // 500 + 200 + 100
    expect(result.totalActual).toBe(680);   // 350 + 180 + 150
    expect(result.netVariance).toBe(120);   // 800 - 680
    expect(result.totalSavings).toBe(170);  // 150 + 20
    expect(result.totalOverspend).toBe(50); // 50

    // Adherence score: 100 - (50 / 800 * 100) = 100 - 6.25 = 94%
    expect(result.adherenceScore).toBe(94);
    expect(result.favorableCount).toBe(1);
    expect(result.warningCount).toBe(1);
    expect(result.unfavorableCount).toBe(1);
  });

  it('generates valid formatted CSV string for export', () => {
    const result = calculateBudgetVariances(mockBudgets, mockTransactions, currentMonth);
    const csv = generateVarianceCSV(result);

    expect(csv).toContain('Sobre / Categoria,Presupuestado ($),Real Ejecutado ($),Desviacion ($),% Ejecutado,Estado');
    expect(csv).toContain('"Alimentación",500.00,350.00,150.00,70.0%,Favorable');
    expect(csv).toContain('"Ocio",100.00,150.00,-50.00,150.0%,Excedido');
    expect(csv).toContain('"TOTAL / RESUMEN",800.00,680.00,120.00,85.0%,Favorable Global');
  });

  it('handles empty budgets or empty transactions gracefully without NaN errors', () => {
    const result = calculateBudgetVariances([], []);
    expect(result.totalBudgeted).toBe(0);
    expect(result.totalActual).toBe(0);
    expect(result.adherenceScore).toBe(100);

    const csv = generateVarianceCSV(result);
    expect(csv).toContain('"TOTAL / RESUMEN"');
  });
});
