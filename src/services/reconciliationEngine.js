/**
 * Motor de Conciliación Bancaria (Bank Reconciliation Engine)
 * Permite verificar y cuadrar extractos bancarios oficiales contra el Libro Mayor contable.
 */

/**
 * Calcula el estado y balance proyectado de una conciliación bancaria.
 */
export function computeReconciliationSummary({
  account,
  transactions = [],
  statementBalance = 0,
  statementDate = new Date().toISOString().split('T')[0],
  clearedTxIds = new Set(),
}) {
  if (!account) {
    return {
      isValid: false,
      startingBalance: 0,
      clearedDeposits: 0,
      clearedWithdrawals: 0,
      clearedBalance: 0,
      statementBalance: 0,
      difference: 0,
      isBalanced: false,
      unreconciledTxs: [],
    };
  }

  // Filtrar transacciones pertenecientes a esta cuenta hasta la fecha del extracto
  const accountTxs = transactions.filter((tx) => {
    const isSource = tx.sourceAccountId === account.id;
    const isDest = tx.destinationAccountId === account.id;
    const isBeforeOrOnDate = tx.date <= statementDate;
    return (isSource || isDest) && isBeforeOrOnDate;
  });

  // Identificar transacciones que aún no estaban conciliadas
  const unreconciledTxs = accountTxs.filter((tx) => !tx.reconciled);

  let clearedDeposits = 0;
  let clearedWithdrawals = 0;

  // Calcular totales de las transacciones marcadas como "cleared / verificadas"
  for (const tx of unreconciledTxs) {
    if (clearedTxIds.has(tx.id)) {
      const isIncome = tx.type === 'INCOME' || tx.destinationAccountId === account.id;
      if (isIncome) {
        clearedDeposits += tx.amount || 0;
      } else {
        clearedWithdrawals += tx.amount || 0;
      }
    }
  }

  // Saldo base inicial antes de las transacciones conciliadas en esta sesión
  // Suma de initialBalance + transacciones previamente conciliadas
  let previouslyReconciledDeposits = 0;
  let previouslyReconciledWithdrawals = 0;

  for (const tx of accountTxs) {
    if (tx.reconciled) {
      const isIncome = tx.type === 'INCOME' || tx.destinationAccountId === account.id;
      if (isIncome) {
        previouslyReconciledDeposits += tx.amount || 0;
      } else {
        previouslyReconciledWithdrawals += tx.amount || 0;
      }
    }
  }

  const startingBalance =
    (account.initialBalance || 0) +
    previouslyReconciledDeposits -
    previouslyReconciledWithdrawals;

  const clearedBalance = startingBalance + clearedDeposits - clearedWithdrawals;
  const numStatementBalance = parseFloat(statementBalance) || 0;
  const rawDiff = numStatementBalance - clearedBalance;
  const difference = Math.round(rawDiff * 100) / 100;
  const isBalanced = Math.abs(difference) < 0.001;

  return {
    isValid: true,
    startingBalance: Math.round(startingBalance * 100) / 100,
    clearedDeposits: Math.round(clearedDeposits * 100) / 100,
    clearedWithdrawals: Math.round(clearedWithdrawals * 100) / 100,
    clearedBalance: Math.round(clearedBalance * 100) / 100,
    statementBalance: numStatementBalance,
    difference,
    isBalanced,
    unreconciledTxs,
    clearedCount: clearedTxIds.size,
  };
}

/**
 * Aplica la conciliación a la lista de transacciones marcando los IDs seleccionados.
 */
export function applyReconciliation(transactions = [], clearedTxIds = new Set(), reconciliationMetadata = {}) {
  const reconId = `recon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = Date.now();

  return transactions.map((tx) => {
    if (clearedTxIds.has(tx.id)) {
      return {
        ...tx,
        reconciled: true,
        reconciledAt: timestamp,
        reconciliationId: reconId,
        reconciliationRef: reconciliationMetadata.statementReference || 'Extracto Bancario',
      };
    }
    return tx;
  });
}
