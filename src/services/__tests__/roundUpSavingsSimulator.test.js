import { describe, it, expect } from 'vitest';
import {
  calculateTransactionRoundUp,
  simulateRoundUpFromTransactions,
  projectRoundUpCompoundGrowth,
  ROUND_UP_MODES,
} from '../roundUpSavingsSimulator';

describe('roundUpSavingsSimulator', () => {
  it('calculates exact spare change for nearest $1 round up', () => {
    // $4.25 -> rounded $5.00 -> $0.75 spare change
    const res1 = calculateTransactionRoundUp(4.25);
    expect(res1.roundedAmount).toBe(5.00);
    expect(res1.spareChange).toBe(0.75);

    // Exact dollar $10.00 -> rounds to $11.00 -> $1.00 spare change
    const res2 = calculateTransactionRoundUp(10.00);
    expect(res2.spareChange).toBe(1.00);
  });

  it('handles multipliers and nearest $5 mode correctly', () => {
    // $12.30 in nearest $5 mode -> $15.00 -> $2.70
    const res = calculateTransactionRoundUp(12.30, {
      mode: ROUND_UP_MODES.NEAREST_5,
      multiplier: 2, // 2x multiplier
    });

    expect(res.spareChange).toBe(5.40); // 2.70 * 2 = 5.40
  });

  it('simulates historical batch of transactions accurately', () => {
    const transactions = [
      { id: '1', type: 'EXPENSE', amount: 3.50 }, // 0.50
      { id: '2', type: 'EXPENSE', amount: 7.20 }, // 0.80
      { id: '3', type: 'EXPENSE', amount: 14.90 }, // 0.10
    ];

    const sim = simulateRoundUpFromTransactions(transactions);
    expect(sim.eligibleTransactionsCount).toBe(3);
    expect(sim.totalSpareChangeSaved).toBe(1.40);
    expect(sim.averageRoundUpPerTransaction).toBeCloseTo(0.47, 1);
  });

  it('projects compound interest wealth generated from spare change micro-deposits', () => {
    // $50/mo round-up savings over 10 years at 8%
    const projections = projectRoundUpCompoundGrowth(50, [1, 5, 10], 0.08);

    expect(projections).toHaveLength(3);
    const yr10 = projections.find((p) => p.years === 10);

    expect(yr10.totalDeposited).toBe(6000); // 50 * 120 = 6000
    expect(yr10.futureValue).toBeGreaterThan(9000); // with 8% compound growth
    expect(yr10.interestEarned).toBeGreaterThan(3000);
  });
});
