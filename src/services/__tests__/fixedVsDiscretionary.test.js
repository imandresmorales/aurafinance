import { describe, it, expect } from 'vitest';
import {
  classifyExpense,
  calculateFixedVsDiscretionary,
} from '../fixedVsDiscretionaryEngine';

describe('Fixed vs Discretionary Expense Engine', () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  it('classifies expenses based on explicit tags (#Fijo vs #Discrecional)', () => {
    expect(classifyExpense({ category: 'Varios', tags: ['#Fijo'] })).toBe('FIXED');
    expect(classifyExpense({ category: 'Varios', tags: ['#Discrecional'] })).toBe('DISCRETIONARY');
  });

  it('classifies expenses based on category and subCategory heuristics', () => {
    expect(classifyExpense({ category: 'Vivienda & Servicios', subCategory: 'Alquiler' })).toBe('FIXED');
    expect(classifyExpense({ category: 'Ocio & Cultura', subCategory: 'Cine' })).toBe('DISCRETIONARY');
    expect(classifyExpense({ category: 'Alimentación', subCategory: 'Supermercado' })).toBe('FIXED');
    expect(classifyExpense({ category: 'Alimentación', subCategory: 'Restaurantes' })).toBe('DISCRETIONARY');
  });

  it('computes Fixed Cost Ratio and financial health accurately', () => {
    const transactions = [
      { id: '1', type: 'income', amount: 4000, date: `${currentMonth}-01` },
      { id: '2', type: 'expense', category: 'Vivienda & Servicios', amount: 1200, date: `${currentMonth}-02` }, // Fixed
      { id: '3', type: 'expense', category: 'Software & Cloud', amount: 300, date: `${currentMonth}-03` },      // Fixed
      { id: '4', type: 'expense', category: 'Ocio & Cultura', amount: 500, date: `${currentMonth}-04` },        // Discretionary
    ];

    const result = calculateFixedVsDiscretionary(transactions, currentMonth);

    expect(result.totalIncome).toBe(4000);
    expect(result.fixedTotal).toBe(1500); // 1200 + 300
    expect(result.discretionaryTotal).toBe(500);
    expect(result.totalExpenses).toBe(2000);

    // Fixed Cost Ratio: 1500 / 4000 * 100 = 37.5%
    expect(result.fixedCostRatio).toBe(37.5);
    expect(result.discretionaryRatio).toBe(12.5);
    expect(result.fixedExpensePercent).toBe(75); // 1500 / 2000
    expect(result.discretionaryExpensePercent).toBe(25);
    expect(result.healthStatus).toBe('optimal');
  });

  it('identifies critical status when fixed costs exceed 60% of income', () => {
    const transactions = [
      { id: '1', type: 'income', amount: 2000, date: `${currentMonth}-01` },
      { id: '2', type: 'expense', category: 'Vivienda & Servicios', amount: 1400, date: `${currentMonth}-02` }, // Fixed (70%)
    ];

    const result = calculateFixedVsDiscretionary(transactions, currentMonth);
    expect(result.fixedCostRatio).toBe(70);
    expect(result.healthStatus).toBe('critical');
    expect(result.recommendation).toContain('Alerta: Tus costos fijos superan el 60%');
  });
});
