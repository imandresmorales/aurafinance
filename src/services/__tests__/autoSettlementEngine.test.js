import { describe, it, expect } from 'vitest';
import {
  isEligibleForAutoSettlement,
  settleRecurringBill,
  processBatchAutoSettlement,
} from '../autoSettlementEngine';

describe('autoSettlementEngine - Automatic Bill Settlement Service', () => {
  it('correctly determines eligibility for auto-settlement based on dates and flags', () => {
    const eligibleRule = {
      id: 'r1',
      name: 'Spotify',
      amount: 10,
      isAutomatic: true,
      walletId: 'w1',
      nextOccurrenceDate: '2026-10-01',
      lastSettledDate: null,
    };

    expect(isEligibleForAutoSettlement(eligibleRule, '2026-10-01')).toBe(true);
    expect(isEligibleForAutoSettlement(eligibleRule, '2026-09-30')).toBe(false); // not due yet

    // If already settled for this cycle
    const settledRule = { ...eligibleRule, lastSettledDate: '2026-10-01' };
    expect(isEligibleForAutoSettlement(settledRule, '2026-10-01')).toBe(false);

    // If manual (isAutomatic: false)
    const manualRule = { ...eligibleRule, isAutomatic: false };
    expect(isEligibleForAutoSettlement(manualRule, '2026-10-01')).toBe(false);
  });

  it('settles a recurring bill, creates a ledger transaction, and advances next occurrence date', () => {
    const rule = {
      id: 'r1',
      name: 'Internet Fibra',
      amount: 45,
      type: 'expense',
      frequency: 'monthly',
      isAutomatic: true,
      walletId: 'w1',
      startDate: '2026-10-05',
      nextOccurrenceDate: '2026-10-05',
    };

    const wallet = { id: 'w1', name: 'Banco Principal', balance: 500 };
    const result = settleRecurringBill(rule, '2026-10-05', wallet);

    expect(result).not.toBeNull();
    expect(result.transaction.amount).toBe(45);
    expect(result.transaction.description).toContain('Internet Fibra');
    expect(result.transaction.isAutoSettled).toBe(true);

    expect(result.updatedRule.lastSettledDate).toBe('2026-10-05');
    expect(result.updatedRule.nextOccurrenceDate).toBe('2026-11-05');
    expect(result.isInsufficientFunds).toBe(false);
  });

  it('processes batch auto-settlements across multiple rules with warnings for low balances', () => {
    const rules = [
      { id: 'r1', name: 'Netflix', amount: 15, isAutomatic: true, walletId: 'w1', nextOccurrenceDate: '2026-10-01', frequency: 'monthly', startDate: '2026-10-01' },
      { id: 'r2', name: 'Alquiler', amount: 1200, isAutomatic: true, walletId: 'w1', nextOccurrenceDate: '2026-10-01', frequency: 'monthly', startDate: '2026-10-01' },
      { id: 'r3', name: 'Gimnasio', amount: 30, isAutomatic: false, walletId: 'w1', nextOccurrenceDate: '2026-10-01', frequency: 'monthly', startDate: '2026-10-01' },
    ];

    const wallets = [{ id: 'w1', name: 'Cuenta Banco', balance: 100 }]; // insufficient for $1200

    const batch = processBatchAutoSettlement(rules, wallets, '2026-10-01');

    expect(batch.settledTransactions).toHaveLength(2); // r1 and r2 settled (r3 is manual)
    expect(batch.skippedCount).toBe(1);
    expect(batch.warnings).toHaveLength(1); // warning for Alquiler
    expect(batch.warnings[0].name).toBe('Alquiler');
  });
});
