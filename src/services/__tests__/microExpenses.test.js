import { describe, it, expect } from 'vitest';
import {
  calculateCompoundOpportunityCost,
  analyzeMicroExpenses,
} from '../microExpensesEngine';

describe('Micro Expenses ("Efecto Hormiga") Engine', () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  it('correctly calculates compound future value (opportunity cost)', () => {
    // $100/month for 10 years at 8% CAGR -> FV ~ $18,294.60
    const fv10 = calculateCompoundOpportunityCost(100, 10, 0.08);
    expect(fv10).toBeGreaterThan(18200);
    expect(fv10).toBeLessThan(18400);

    // 0 contribution or 0 years returns 0
    expect(calculateCompoundOpportunityCost(0, 10)).toBe(0);
    expect(calculateCompoundOpportunityCost(100, 0)).toBe(0);
  });

  it('identifies micro-expenses based on threshold and generates accurate metrics', () => {
    const mockTx = [
      { id: '1', type: 'expense', category: 'Alimentación', description: 'Café Espresso', amount: 4.5, date: `${currentMonth}-02` },
      { id: '2', type: 'expense', category: 'Alimentación', description: 'Snack Kiosco', amount: 3.5, date: `${currentMonth}-05` },
      { id: '3', type: 'expense', category: 'Transporte', description: 'Boleto Metro', amount: 2.0, date: `${currentMonth}-07` },
      { id: '4', type: 'expense', category: 'Vivienda', description: 'Alquiler', amount: 900.0, date: `${currentMonth}-01` },
      { id: '5', type: 'income', category: 'Salario', description: 'Nómina', amount: 3000.0, date: `${currentMonth}-01` },
    ];

    const result = analyzeMicroExpenses(mockTx, 15, currentMonth, 0.08);

    expect(result.totalExpenses).toBe(910); // 4.5 + 3.5 + 2.0 + 900
    expect(result.totalMicroSpent).toBe(10); // 4.5 + 3.5 + 2.0
    expect(result.microTxCount).toBe(3);
    expect(result.totalTxCount).toBe(4); // 4 expense transactions
    expect(result.annualizedMicroCost).toBe(120); // 10 * 12

    // Category breakdown
    expect(result.categoryBreakdown).toHaveLength(2);
    const foodCat = result.categoryBreakdown.find(c => c.category === 'Alimentación');
    expect(foodCat.amount).toBe(8); // 4.5 + 3.5

    // Opportunity costs should be positive numbers
    expect(result.futureValue5Years).toBeGreaterThan(0);
    expect(result.futureValue10Years).toBeGreaterThan(result.futureValue5Years);
    expect(result.futureValue20Years).toBeGreaterThan(result.futureValue10Years);
  });

  it('triggers high severity when micro expenses exceed 20% of total outflow', () => {
    const mockTx = [
      { id: '1', type: 'expense', category: 'Ocio', description: 'Café', amount: 10, date: `${currentMonth}-01` },
      { id: '2', type: 'expense', category: 'Ocio', description: 'Snack', amount: 15, date: `${currentMonth}-02` },
      { id: '3', type: 'expense', category: 'Ocio', description: 'App', amount: 5, date: `${currentMonth}-03` },
      { id: '4', type: 'expense', category: 'Servicios', description: 'Luz', amount: 70, date: `${currentMonth}-04` },
    ]; // Total = 100, Micro = 30 (30%)

    const result = analyzeMicroExpenses(mockTx, 15, currentMonth);

    expect(result.percentOfTotalExpenses).toBe(30);
    expect(result.severity).toBe('high');
    expect(result.insight).toContain('¡Atención!');
  });
});
