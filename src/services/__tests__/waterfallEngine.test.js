import { describe, it, expect } from 'vitest';
import { calculateWaterfallBreakdown } from '../waterfallEngine';

describe('Waterfall Balance Decomposition Engine', () => {
  const transactions = [
    { id: '1', type: 'INCOME', category: 'Salario Tech', amount: 3000, date: '2026-08-01' },
    { id: '2', type: 'EXPENSE', category: 'Alquiler', amount: 1200, date: '2026-08-05' },
    { id: '3', type: 'EXPENSE', category: 'Comida', amount: 400, date: '2026-08-10' },
  ];

  it('correctly constructs bridge cascade from initial to final balance', () => {
    const waterfall = calculateWaterfallBreakdown(1000, transactions, '2026-08');

    expect(waterfall.initialBalance).toBe(1000);
    expect(waterfall.finalBalance).toBe(2400); // 1000 + 3000 - 1200 - 400
    expect(waterfall.netChange).toBe(1400);

    expect(waterfall.steps).toHaveLength(5); // Start, 1 Income, 2 Expenses, Final
    expect(waterfall.steps[0].label).toBe('Saldo Inicial');
    expect(waterfall.steps[waterfall.steps.length - 1].label).toBe('Saldo Final');
  });

  it('handles zero initial balance and empty transactions', () => {
    const waterfall = calculateWaterfallBreakdown(0, [], '2026-08');

    expect(waterfall.initialBalance).toBe(0);
    expect(waterfall.finalBalance).toBe(0);
    expect(waterfall.steps).toHaveLength(2); // Start + Final
  });
});
