import { describe, it, expect } from 'vitest';
import {
  computeReconciliationSummary,
  applyReconciliation,
} from '../reconciliationEngine';

describe('Bank Reconciliation Engine', () => {
  const mockAccount = {
    id: 'acc-main',
    name: 'Cuenta Principal',
    initialBalance: 1000,
  };

  const mockTransactions = [
    {
      id: 'tx-1',
      date: '2026-09-01',
      type: 'INCOME',
      destinationAccountId: 'acc-main',
      amount: 500,
      reconciled: false,
    },
    {
      id: 'tx-2',
      date: '2026-09-05',
      type: 'EXPENSE',
      sourceAccountId: 'acc-main',
      amount: 200,
      reconciled: false,
    },
    {
      id: 'tx-3',
      date: '2026-09-10',
      type: 'EXPENSE',
      sourceAccountId: 'acc-main',
      amount: 100,
      reconciled: false,
    },
  ];

  it('computes reconciliation difference correctly when partially cleared', () => {
    // Starting balance = 1000. Cleared tx-1 (+500) and tx-2 (-200) = Cleared Balance 1300.
    // Statement says 1300. Difference should be 0 (isBalanced: true).
    const cleared = new Set(['tx-1', 'tx-2']);
    const summary = computeReconciliationSummary({
      account: mockAccount,
      transactions: mockTransactions,
      statementBalance: 1300,
      statementDate: '2026-09-30',
      clearedTxIds: cleared,
    });

    expect(summary.startingBalance).toBe(1000);
    expect(summary.clearedDeposits).toBe(500);
    expect(summary.clearedWithdrawals).toBe(200);
    expect(summary.clearedBalance).toBe(1300);
    expect(summary.difference).toBe(0);
    expect(summary.isBalanced).toBe(true);
  });

  it('detects unbalanced discrepancy when statement differs', () => {
    const cleared = new Set(['tx-1']);
    const summary = computeReconciliationSummary({
      account: mockAccount,
      transactions: mockTransactions,
      statementBalance: 1450, // Expected 1500, diff = -50
      statementDate: '2026-09-30',
      clearedTxIds: cleared,
    });

    expect(summary.clearedBalance).toBe(1500);
    expect(summary.difference).toBe(-50);
    expect(summary.isBalanced).toBe(false);
  });

  it('applies reconciliation metadata and marks selected transactions as reconciled', () => {
    const cleared = new Set(['tx-1', 'tx-2']);
    const updated = applyReconciliation(mockTransactions, cleared, {
      statementReference: 'Extracto Septiembre 2026',
    });

    const tx1 = updated.find((t) => t.id === 'tx-1');
    const tx3 = updated.find((t) => t.id === 'tx-3');

    expect(tx1.reconciled).toBe(true);
    expect(tx1.reconciliationRef).toBe('Extracto Septiembre 2026');
    expect(tx1.reconciliationId).toBeDefined();
    expect(tx3.reconciled).toBe(false);
  });
});
