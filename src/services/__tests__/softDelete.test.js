import { describe, it, expect } from 'vitest';
import { computeAccountBalances } from '../doubleEntryEngine';

describe('Soft Delete & Audit Trail Logic', () => {
  const accounts = [
    { id: 'acc-main', name: 'Cuenta Principal', type: 'ASSET', initialBalance: 1000 },
  ];

  const transactions = [
    {
      id: 'tx-1',
      type: 'EXPENSE',
      amount: 100,
      postings: [
        { accountId: 'CAT:General', type: 'DEBIT', amount: 100 },
        { accountId: 'acc-main', type: 'CREDIT', amount: 100 },
      ],
      deleted: false,
    },
    {
      id: 'tx-2',
      type: 'EXPENSE',
      amount: 50,
      postings: [
        { accountId: 'CAT:General', type: 'DEBIT', amount: 50 },
        { accountId: 'acc-main', type: 'CREDIT', amount: 50 },
      ],
      deleted: true,
      deletedAt: Date.now(),
      deletionReason: 'Asiento duplicado',
    },
  ];

  it('excludes soft-deleted transactions from ledger balances', () => {
    const activeTxs = transactions.filter((t) => !t.deleted);
    const balances = computeAccountBalances(accounts, activeTxs);

    // Initial 1000 - 100 (tx-1) = 900. Tx-2 (50) is deleted so it should NOT deduct.
    expect(balances['acc-main']).toBe(900);
  });

  it('allows restoring deleted transaction back to active ledger', () => {
    const restoredTxs = transactions.map((t) =>
      t.id === 'tx-2' ? { ...t, deleted: false } : t
    );
    const activeRestored = restoredTxs.filter((t) => !t.deleted);
    const balances = computeAccountBalances(accounts, activeRestored);

    // 1000 - 100 - 50 = 850
    expect(balances['acc-main']).toBe(850);
  });
});
