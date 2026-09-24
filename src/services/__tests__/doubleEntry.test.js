import { describe, it, expect } from 'vitest';
import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  validateJournalEntry,
  createDoubleEntry,
  computeAccountBalances,
  calculateNetWorth,
} from '../doubleEntryEngine';

describe('AuraFinance Double-Entry Bookkeeping Engine', () => {
  it('debe validar que los asientos contables estén equilibrados (Debe === Haber)', () => {
    const balanced = [
      { accountId: 'ACC_1', type: 'DEBIT', amount: 150.50 },
      { accountId: 'CAT_EXP', type: 'CREDIT', amount: 150.50 },
    ];
    const result = validateJournalEntry(balanced);
    expect(result.isValid).toBe(true);
    expect(result.difference).toBe(0);
  });

  it('debe rechazar asientos contables desbalanceados', () => {
    const unbalanced = [
      { accountId: 'ACC_1', type: 'DEBIT', amount: 150.00 },
      { accountId: 'CAT_EXP', type: 'CREDIT', amount: 140.00 },
    ];
    const result = validateJournalEntry(unbalanced);
    expect(result.isValid).toBe(false);
    expect(result.difference).toBe(10.00);
  });

  it('debe generar un asiento contable de gasto y actualizar los balances', () => {
    const accounts = [
      { id: 'acc-bank', name: 'Banco', type: ACCOUNT_TYPES.ASSET, initialBalance: 1000 },
    ];

    const tx = createDoubleEntry({
      type: TRANSACTION_TYPES.EXPENSE,
      sourceAccountId: 'acc-bank',
      amount: 250,
      concept: 'Cena restaurante',
      category: 'Restaurantes',
    });

    expect(tx.postings.length).toBe(2);
    expect(tx.postings[0].type).toBe('DEBIT');
    expect(tx.postings[1].type).toBe('CREDIT');

    const balances = computeAccountBalances(accounts, [tx]);
    expect(balances['acc-bank']).toBe(750);
  });

  it('debe calcular el patrimonio neto con activos y pasivos', () => {
    const accounts = [
      { id: 'acc-cash', type: ACCOUNT_TYPES.ASSET, initialBalance: 5000 },
      { id: 'acc-card', type: ACCOUNT_TYPES.LIABILITY, initialBalance: -1200 },
    ];

    const balances = computeAccountBalances(accounts, []);
    const netWorth = calculateNetWorth(accounts, balances);

    expect(netWorth.totalAssets).toBe(5000);
    expect(netWorth.totalLiabilities).toBe(1200);
    expect(netWorth.netWorth).toBe(3800);
  });
});
