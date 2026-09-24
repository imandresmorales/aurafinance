import { useContext } from 'react';
import { AccountsContext } from '../context';

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts debe ser utilizado dentro de un AccountsProvider');
  }
  return context;
}

export default useAccounts;
