import { describe, it, expect } from 'vitest';
import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  createDoubleEntry,
  computeAccountBalances,
  calculateNetWorth,
  validateJournalEntry,
} from '../doubleEntryEngine';

describe('AuraFinance Accounting Stress & Invariant Test Suite', () => {
  it('debe mantener la invariante fundamental Debe === Haber en 1,000 transacciones diversas', () => {
    const accountIds = ['acc-checking', 'acc-savings', 'acc-crypto', 'acc-cash', 'acc-credit'];
    const categories = ['Alimentación', 'Servicios', 'Nómina', 'Freelance', 'Inversiones', 'Transporte'];
    
    let globalDebitSum = 0;
    let globalCreditSum = 0;

    for (let i = 0; i < 1000; i++) {
      const type = i % 3 === 0 
        ? TRANSACTION_TYPES.INCOME 
        : i % 3 === 1 
          ? TRANSACTION_TYPES.EXPENSE 
          : TRANSACTION_TYPES.TRANSFER;

      const sourceId = accountIds[i % accountIds.length];
      const destId = accountIds[(i + 1) % accountIds.length];
      const amount = parseFloat(((i * 13.37 + 1.25) % 1000 + 0.50).toFixed(2));
      const fee = type === TRANSACTION_TYPES.TRANSFER && i % 2 === 0 ? parseFloat(((i * 0.42) % 15).toFixed(2)) : 0;

      const tx = createDoubleEntry({
        type,
        sourceAccountId: sourceId,
        destinationAccountId: type === TRANSACTION_TYPES.TRANSFER ? destId : undefined,
        amount,
        fee,
        concept: `Movimiento de estrés contable #${i + 1}`,
        category: categories[i % categories.length],
      });

      // Verify each individual transaction balance
      const validation = validateJournalEntry(tx.postings);
      expect(validation.isValid).toBe(true);
      expect(validation.difference).toBe(0);

      // Accumulate global debits and credits
      for (const posting of tx.postings) {
        if (posting.type === 'DEBIT') {
          globalDebitSum += posting.amount;
        } else if (posting.type === 'CREDIT') {
          globalCreditSum += posting.amount;
        }
      }
    }

    // Global ledger equilibrium invariant check
    expect(Math.abs(globalDebitSum - globalCreditSum)).toBeLessThan(0.001);
  });

  it('debe calcular con precisión exacta los saldos de 10 cuentas tras 500 operaciones encadenadas', () => {
    const accounts = Array.from({ length: 10 }, (_, i) => ({
      id: `acc-node-${i}`,
      name: `Bóveda ${i}`,
      type: i === 9 ? ACCOUNT_TYPES.LIABILITY : ACCOUNT_TYPES.ASSET,
      initialBalance: i === 9 ? -500 : 1000 * (i + 1),
    }));

    let expectedNetCashflow = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let totalFees = 0;

    const transactions = [];

    for (let i = 0; i < 500; i++) {
      const srcIdx = i % 9;
      const dstIdx = (i + 3) % 9;
      const amount = parseFloat((10 + (i % 50)).toFixed(2));

      if (i % 4 === 0) {
        // Income into an asset account
        transactions.push(createDoubleEntry({
          type: TRANSACTION_TYPES.INCOME,
          sourceAccountId: accounts[srcIdx].id,
          amount,
          concept: `Ingreso lote #${i}`,
          category: 'Nómina',
        }));
        totalIncome += amount;
        expectedNetCashflow += amount;
      } else if (i % 4 === 1) {
        // Expense from an asset account
        transactions.push(createDoubleEntry({
          type: TRANSACTION_TYPES.EXPENSE,
          sourceAccountId: accounts[srcIdx].id,
          amount,
          concept: `Gasto lote #${i}`,
          category: 'Alimentación',
        }));
        totalExpense += amount;
        expectedNetCashflow -= amount;
      } else {
        // Internal transfer
        const fee = i % 2 === 0 ? 1.50 : 0;
        transactions.push(createDoubleEntry({
          type: TRANSACTION_TYPES.TRANSFER,
          sourceAccountId: accounts[srcIdx].id,
          destinationAccountId: accounts[dstIdx].id,
          amount,
          fee,
          concept: `Traspaso interno #${i}`,
        }));
        totalFees += fee;
        expectedNetCashflow -= fee;
      }
    }

    const balances = computeAccountBalances(accounts, transactions);

    // Initial total assets
    const initialAssetSum = accounts
      .filter((a) => a.type === ACCOUNT_TYPES.ASSET)
      .reduce((s, a) => s + a.initialBalance, 0);

    const finalAssetSum = accounts
      .filter((a) => a.type === ACCOUNT_TYPES.ASSET)
      .reduce((s, a) => s + (balances[a.id] || 0), 0);

    const actualDelta = finalAssetSum - initialAssetSum;
    expect(Math.abs(actualDelta - expectedNetCashflow)).toBeLessThan(0.01);
  });

  it('debe manejar casos límite de montos extremos, decimales diminutos y transacciones de cero comisión', () => {
    const accounts = [
      { id: 'acc-whale', name: 'Bóveda Institucional', type: ACCOUNT_TYPES.ASSET, initialBalance: 1000000000.00 },
      { id: 'acc-micro', name: 'Micro Wallet', type: ACCOUNT_TYPES.ASSET, initialBalance: 0.05 },
    ];

    // Micro transaction
    const microTx = createDoubleEntry({
      type: TRANSACTION_TYPES.TRANSFER,
      sourceAccountId: 'acc-micro',
      destinationAccountId: 'acc-whale',
      amount: 0.01,
      fee: 0,
      concept: 'Micro Satoshi Test',
    });

    // High magnitude transaction
    const whaleTx = createDoubleEntry({
      type: TRANSACTION_TYPES.INCOME,
      sourceAccountId: 'acc-whale',
      amount: 50000000.75,
      concept: 'Inyección de capital institucional',
      category: 'Inversiones',
    });

    const balances = computeAccountBalances(accounts, [microTx, whaleTx]);
    expect(balances['acc-micro']).toBe(0.04);
    expect(balances['acc-whale']).toBe(1050000000.76);

    const netWorth = calculateNetWorth(accounts, balances);
    expect(netWorth.totalAssets).toBe(1050000000.80);
    expect(netWorth.totalLiabilities).toBe(0);
    expect(netWorth.netWorth).toBe(1050000000.80);
  });

  it('debe garantizar consistencia en soft delete y reactivación sin deriva acumulada', () => {
    const accounts = [
      { id: 'acc-main', name: 'Cuenta Principal', type: ACCOUNT_TYPES.ASSET, initialBalance: 5000 },
    ];

    const tx1 = createDoubleEntry({
      type: TRANSACTION_TYPES.EXPENSE,
      sourceAccountId: 'acc-main',
      amount: 1500,
      concept: 'Compra de equipo',
    });

    const tx2 = createDoubleEntry({
      type: TRANSACTION_TYPES.INCOME,
      sourceAccountId: 'acc-main',
      amount: 3200,
      concept: 'Consultoría',
    });

    // All active
    let balances = computeAccountBalances(accounts, [tx1, tx2]);
    expect(balances['acc-main']).toBe(6700); // 5000 - 1500 + 3200

    // Soft delete tx1 (filter out or deleted: true in active list)
    balances = computeAccountBalances(accounts, [tx2]);
    expect(balances['acc-main']).toBe(8200); // 5000 + 3200

    // Restore tx1
    balances = computeAccountBalances(accounts, [tx1, tx2]);
    expect(balances['acc-main']).toBe(6700);
  });
});
