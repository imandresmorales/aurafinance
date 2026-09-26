import React, { createContext, useCallback, useMemo } from 'react';
import { useEncryptedStorage } from '../hooks/useEncryptedStorage';
import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  createDoubleEntry,
  computeAccountBalances,
  calculateNetWorth,
} from '../services';

export const AccountsContext = createContext(null);

export const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-main',
    name: 'Cuenta Nómina Principal',
    type: ACCOUNT_TYPES.ASSET,
    category: 'BANK',
    currency: 'USD',
    initialBalance: 12450.0,
    color: 'emerald',
    icon: 'bank',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'acc-cash',
    name: 'Caja Fuerte / Efectivo',
    type: ACCOUNT_TYPES.ASSET,
    category: 'CASH',
    currency: 'USD',
    initialBalance: 1800.0,
    color: 'gold',
    icon: 'cash',
    createdAt: Date.now() - 25 * 86400000,
  },
  {
    id: 'acc-invest',
    name: 'Bóveda Inversión Indexada',
    type: ACCOUNT_TYPES.ASSET,
    category: 'INVESTMENT',
    currency: 'USD',
    initialBalance: 115600.75,
    color: 'cyan',
    icon: 'investment',
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    id: 'acc-travel',
    name: 'Tarjeta Débito Viajes',
    type: ACCOUNT_TYPES.ASSET,
    category: 'DIGITAL_WALLET',
    currency: 'EUR',
    initialBalance: 4170.5,
    color: 'emerald',
    icon: 'wallet',
    createdAt: Date.now() - 15 * 86400000,
  },
  {
    id: 'acc-credit',
    name: 'Tarjeta Crédito Platinum',
    type: ACCOUNT_TYPES.LIABILITY,
    category: 'CREDIT_CARD',
    currency: 'USD',
    initialBalance: -2450.0,
    color: 'danger',
    icon: 'credit-card',
    creditLimit: 10000.0,
    apr: 18.5,
    createdAt: Date.now() - 10 * 86400000,
  },
];

export const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-seed-1',
    type: TRANSACTION_TYPES.INCOME,
    concept: 'Honorarios Proyecto Consultoría Fintech',
    category: 'Ingresos Profesionales',
    subCategory: 'Consultoría',
    destinationAccountId: 'acc-main',
    amount: 3800.0,
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    tags: ['#Trabajo', '#Consultoria', '#Deducible'],
    postings: [
      { accountId: 'acc-main', type: 'DEBIT', amount: 3800.0 },
      { accountId: 'CAT:Ingresos Profesionales', type: 'CREDIT', amount: 3800.0 },
    ],
    createdAt: Date.now() - 1 * 86400000,
  },
  {
    id: 'tx-seed-2',
    type: TRANSACTION_TYPES.EXPENSE,
    concept: 'Supermercado Orgánico Bio',
    category: 'Alimentación',
    subCategory: 'Supermercado',
    sourceAccountId: 'acc-travel',
    amount: 142.8,
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    tags: ['#Comida', '#Saludable'],
    postings: [
      { accountId: 'CAT:Alimentación', type: 'DEBIT', amount: 142.8 },
      { accountId: 'acc-travel', type: 'CREDIT', amount: 142.8 },
    ],
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'tx-seed-3',
    type: TRANSACTION_TYPES.EXPENSE,
    concept: 'Suscripción Servidor Cloud Dedicado',
    category: 'Software & Cloud',
    subCategory: 'Infraestructura',
    sourceAccountId: 'acc-main',
    amount: 65.0,
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    tags: ['#Trabajo', '#Cloud'],
    postings: [
      { accountId: 'CAT:Software & Cloud', type: 'DEBIT', amount: 65.0 },
      { accountId: 'acc-main', type: 'CREDIT', amount: 65.0 },
    ],
    createdAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'tx-seed-4',
    type: TRANSACTION_TYPES.TRANSFER,
    concept: 'Aporte Mensual Fondo Indexado Vanguard',
    category: 'Inversión & Ahorro',
    subCategory: 'Fondos Indexados',
    sourceAccountId: 'acc-main',
    destinationAccountId: 'acc-invest',
    amount: 1500.0,
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    tags: ['#FIRE', '#Inversion', '#AhorroCompuesto'],
    postings: [
      { accountId: 'acc-invest', type: 'DEBIT', amount: 1500.0 },
      { accountId: 'acc-main', type: 'CREDIT', amount: 1500.0 },
    ],
    createdAt: Date.now() - 5 * 86400000,
  },
];

export function AccountsProvider({ children }) {
  const [accounts, setAccounts, { isLoading: isAccountsLoading }] = useEncryptedStorage(
    'financial_accounts',
    DEFAULT_ACCOUNTS
  );

  const [transactions, setTransactions, { isLoading: isTxLoading }] = useEncryptedStorage(
    'journal_transactions',
    DEFAULT_TRANSACTIONS
  );

  // Recálculo reactivo y determinista de balances contables
  const balances = useMemo(() => {
    return computeAccountBalances(accounts || [], transactions || []);
  }, [accounts, transactions]);

  // Recálculo del patrimonio neto consolidado
  const netWorthData = useMemo(() => {
    return calculateNetWorth(accounts || [], balances);
  }, [accounts, balances]);

  // Añadir una nueva cuenta
  const addAccount = useCallback(
    async (accountData) => {
      const newAccount = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: accountData.name.trim(),
        type: accountData.type || ACCOUNT_TYPES.ASSET,
        category: accountData.category || 'BANK',
        currency: accountData.currency || 'USD',
        initialBalance: parseFloat(accountData.initialBalance) || 0,
        color: accountData.color || 'emerald',
        icon: accountData.icon || 'bank',
        creditLimit: accountData.creditLimit ? parseFloat(accountData.creditLimit) : undefined,
        apr: accountData.apr ? parseFloat(accountData.apr) : undefined,
        createdAt: Date.now(),
      };

      await setAccounts((prev) => [...(prev || []), newAccount]);
      return newAccount;
    },
    [setAccounts]
  );

  // Actualizar una cuenta existente
  const updateAccount = useCallback(
    async (accountId, updatedFields) => {
      await setAccounts((prev) =>
        (prev || []).map((acc) => (acc.id === accountId ? { ...acc, ...updatedFields } : acc))
      );
    },
    [setAccounts]
  );

  // Eliminar cuenta
  const deleteAccount = useCallback(
    async (accountId) => {
      await setAccounts((prev) => (prev || []).filter((acc) => acc.id !== accountId));
    },
    [setAccounts]
  );

  // Añadir una nueva transacción con motor de partida doble
  const addTransaction = useCallback(
    async (txData) => {
      const doubleEntryTx = createDoubleEntry(txData);
      const enhancedTx = {
        ...doubleEntryTx,
        subCategory: txData.subCategory || null,
        receipt: txData.receipt || null,
        location: txData.location || null,
      };

      await setTransactions((prev) => [enhancedTx, ...(prev || [])]);
      return enhancedTx;
    },
    [setTransactions]
  );

  // Actualizar una transacción existente
  const updateTransaction = useCallback(
    async (txId, txData) => {
      const doubleEntryTx = createDoubleEntry({ ...txData, id: txId });
      const enhancedTx = {
        ...doubleEntryTx,
        subCategory: txData.subCategory || null,
        receipt: txData.receipt || null,
        location: txData.location || null,
      };

      await setTransactions((prev) =>
        (prev || []).map((t) => (t.id === txId ? enhancedTx : t))
      );
      return enhancedTx;
    },
    [setTransactions]
  );

  // Eliminar una transacción
  const deleteTransaction = useCallback(
    async (txId) => {
      await setTransactions((prev) => (prev || []).filter((t) => t.id !== txId));
    },
    [setTransactions]
  );

  return (
    <AccountsContext.Provider
      value={{
        accounts: accounts || [],
        balances,
        netWorthData,
        transactions: transactions || [],
        setTransactions,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        isLoading: isAccountsLoading || isTxLoading,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}
