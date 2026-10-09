import { describe, it, expect } from 'vitest';
import { calculateEarlyPrincipalPayoff } from '../earlyPrincipalPayoffEngine';

describe('earlyPrincipalPayoffEngine', () => {
  const sampleLoan = {
    principal: 20000,
    annualRate: 0.10, // 10%
    remainingMonths: 48, // 4 years
  };

  it('calculates term shortening and interest savings for recurring extra monthly payments', () => {
    const result = calculateEarlyPrincipalPayoff(sampleLoan, {
      type: 'RECURRING_MONTHLY',
      amount: 150, // +$150/mo extra
      strategy: 'REDUCE_TERM',
    });

    expect(result.results.interestSaved).toBeGreaterThan(500);
    expect(result.results.monthsSaved).toBeGreaterThan(8);
    expect(result.results.yearsSaved).toBeGreaterThan(0.5);
    expect(result.results.guaranteedReturnPct).toBe(10);
    expect(result.summaryText).toContain('te ahorra');
  });

  it('calculates impact of one-time lump sum prepayment at month 1', () => {
    const result = calculateEarlyPrincipalPayoff(sampleLoan, {
      type: 'LUMP_SUM',
      amount: 4000, // $4,000 bonus
      appliedAtMonth: 1,
      strategy: 'REDUCE_TERM',
    });

    expect(result.results.interestSaved).toBeGreaterThan(1000);
    expect(result.results.monthsSaved).toBeGreaterThanOrEqual(10);
  });

  it('handles zero extra payment gracefully (zero savings, zero months saved)', () => {
    const result = calculateEarlyPrincipalPayoff(sampleLoan, {
      type: 'RECURRING_MONTHLY',
      amount: 0,
    });

    expect(result.results.interestSaved).toBe(0);
    expect(result.results.monthsSaved).toBe(0);
  });
});
