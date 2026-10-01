import { describe, it, expect } from 'vitest';
import {
  SURPLUS_PRESETS,
  calculateAvailableSurplus,
  computeSurplusSplits,
  generateSurplusTransferPayloads,
} from '../surplusAllocationEngine';

describe('Surplus Allocation Engine', () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const mockBudgets = [
    { id: 'b1', name: 'Alimentación', category: 'Alimentación', limit: 600 },
    { id: 'b2', name: 'Transporte', category: 'Transporte', limit: 250 },
    { id: 'b3', name: 'Ocio', category: 'Ocio', limit: 150 },
  ];

  const mockTransactions = [
    { id: 't1', type: 'expense', category: 'Alimentación', amount: 400, date: `${currentMonth}-05` }, // Surplus 200
    { id: 't2', type: 'expense', category: 'Transporte', amount: 150, date: `${currentMonth}-10` },   // Surplus 100
    { id: 't3', type: 'expense', category: 'Ocio', amount: 180, date: `${currentMonth}-15` },         // Deficit -30
  ];

  it('calculates accurate positive surplus across all envelopes', () => {
    const result = calculateAvailableSurplus(mockBudgets, mockTransactions, currentMonth);

    expect(result.totalAllocated).toBe(1000);
    expect(result.totalSpent).toBe(730);
    expect(result.totalSurplus).toBe(300); // 200 (Alimentación) + 100 (Transporte)
    expect(result.surplusEnvelopes).toHaveLength(2);
  });

  it('computes exact surplus splits based on percentages without penny rounding loss', () => {
    const totalSurplus = 300;
    const splits = SURPLUS_PRESETS.FIRE_GROWTH.splits; // 60%, 30%, 10%

    const computed = computeSurplusSplits(totalSurplus, splits);

    expect(computed).toHaveLength(3);
    expect(computed[0].amount).toBe(180); // 60% of 300
    expect(computed[1].amount).toBe(90);  // 30% of 300
    expect(computed[2].amount).toBe(30);  // 10% of 300

    const sum = computed.reduce((acc, c) => acc + c.amount, 0);
    expect(sum).toBe(300);
  });

  it('generates double-entry transfer payloads for ledger insertion', () => {
    const computedSplits = [
      { targetKey: 'INVESTMENT', name: 'Inversión Indexada', percentage: 60, amount: 180 },
      { targetKey: 'EMERGENCY', name: 'Fondo de Emergencia', percentage: 40, amount: 120 },
    ];

    const targetAccountMap = {
      INVESTMENT: 'acc-invest',
      EMERGENCY: 'acc-cash',
    };

    const payloads = generateSurplusTransferPayloads(computedSplits, 'acc-main', targetAccountMap);

    expect(payloads).toHaveLength(2);
    expect(payloads[0].type).toBe('transfer');
    expect(payloads[0].fromAccountId).toBe('acc-main');
    expect(payloads[0].toAccountId).toBe('acc-invest');
    expect(payloads[0].amount).toBe(180);
    expect(payloads[0].tags).toContain('#INVESTMENT');

    expect(payloads[1].toAccountId).toBe('acc-cash');
    expect(payloads[1].amount).toBe(120);
  });
});
