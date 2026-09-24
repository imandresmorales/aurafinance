import React, { createContext, useCallback, useMemo } from 'react';
import { useEncryptedStorage } from '../hooks/useEncryptedStorage';
import {
  ACCOUNT_TYPES,
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
    initialBalance: 12450.00,
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
    initialBalance: 1800.00,
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
    initialBalance: 4170.50,
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
    initialBalance: -2450.00,
    color: 'danger',
    icon: 'credit-card',
    creditLimit: 10000.00,
    apr: 18.5,
    createdAt: Date.now() - 10 * 86400000,
  },
];

export function AccountsProvider({ children }) {
  const [accounts, setAccounts, { isLoading: isAccountsLoading }] = useEncryptedStorage(
    'financial_accounts',
    DEFAULT_ACCOUNTS
  );

  const [transactions, setTransactions, { isLoading: isTxLoading }] = useEncryptedStorage(
    'journal_transactions',
    []
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
        isLoading: isAccountsLoading || isTxLoading,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}
