import { describe, it, expect } from 'vitest';
import { checkBudgetImpact } from '../envelopeBudgetEngine';

describe('AuraFinance Proactive Budget Alert Engine', () => {
  const sampleBudgets = [
    { id: 'b1', name: 'Alimentación', category: 'Alimentación', allocated: 500 },
    { id: 'b2', name: 'Vivienda', category: 'Vivienda & Servicios', allocated: 1200 },
  ];

  const sampleTransactions = [
    { id: 't1', type: 'EXPENSE', category: 'Alimentación', amount: 350, date: '2026-09-05' },
    { id: 't2', type: 'EXPENSE', category: 'Vivienda & Servicios', amount: 900, date: '2026-09-01' },
  ];

  it('debe alertar OVERFLOW cuando un nuevo gasto sobrepasa el límite asignado', () => {
    // Current spent: 350 / 500. New expense: 200 => Projected: 550 (>500)
    const alert = checkBudgetImpact(sampleBudgets, sampleTransactions, {
      category: 'Alimentación',
      amount: 200,
      date: '2026-09-15',
    });

    expect(alert.hasEnvelope).toBe(true);
    expect(alert.willOverflow).toBe(true);
    expect(alert.overflowAmount).toBe(50);
    expect(alert.warningLevel).toBe('OVERFLOW');
    expect(alert.projectedSpent).toBe(550);
  });

  it('debe alertar CAUTION cuando un nuevo gasto alcanza el 85% o más sin exceder', () => {
    // Current spent: 350 / 500. New expense: 90 => Projected: 440 (88%)
    const alert = checkBudgetImpact(sampleBudgets, sampleTransactions, {
      category: 'Alimentación',
      amount: 90,
      date: '2026-09-15',
    });

    expect(alert.hasEnvelope).toBe(true);
    expect(alert.willOverflow).toBe(false);
    expect(alert.warningLevel).toBe('CAUTION');
    expect(alert.projectedRemaining).toBe(60);
  });

  it('debe retornar NONE cuando el gasto se mantiene en márgenes holgados', () => {
    // Current spent: 350 / 500. New expense: 20 => Projected: 370 (74%)
    const alert = checkBudgetImpact(sampleBudgets, sampleTransactions, {
      category: 'Alimentación',
      amount: 20,
      date: '2026-09-15',
    });

    expect(alert.hasEnvelope).toBe(true);
    expect(alert.willOverflow).toBe(false);
    expect(alert.warningLevel).toBe('NONE');
  });

  it('debe manejar categorías sin sobre asignado sin emitir falso desbordamiento', () => {
    const alert = checkBudgetImpact(sampleBudgets, sampleTransactions, {
      category: 'Categoría Inexistente',
      amount: 50,
      date: '2026-09-15',
    });

    expect(alert.hasEnvelope).toBe(false);
    expect(alert.willOverflow).toBe(false);
    expect(alert.warningLevel).toBe('NONE');
  });
});
