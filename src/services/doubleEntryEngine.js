import { normalizeMoney, normalizeIsoDate, sanitizeText } from '../utils';

/**
 * Tipos de Cuentas Contables Estándar
 */
export const ACCOUNT_TYPES = {
  ASSET: 'ASSET', // Activos: Bancos, Efectivo, Inversiones (Saldo deudor normal)
  LIABILITY: 'LIABILITY', // Pasivos: Tarjetas de Crédito, Préstamos (Saldo acreedor normal)
  EQUITY: 'EQUITY', // Patrimonio Neto / Capital Inicial
  INCOME: 'INCOME', // Ingresos: Salarios, Honorarios, Dividendos
  EXPENSE: 'EXPENSE', // Gastos: Vivienda, Alimentos, Servicios
};

/**
 * Tipos de Transacciones de Usuario
 */
export const TRANSACTION_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER',
};

/**
 * Valida un asiento contable compuesto de partida doble garantizando que Sum(Debe) === Sum(Haber)
 * @param {Array<{accountId: string, type: 'DEBIT'|'CREDIT', amount: number}>} entries
 * @returns {{isValid: boolean, totalDebits: number, totalCredits: number, difference: number}}
 */
export function validateJournalEntry(entries) {
  if (!Array.isArray(entries) || entries.length < 2) {
    return {
      isValid: false,
      totalDebits: 0,
      totalCredits: 0,
      difference: 0,
      error: 'Un asiento de partida doble requiere al menos 2 movimientos.',
    };
  }

  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    const amount = normalizeMoney(entry.amount);
    if (amount <= 0) {
      return {
        isValid: false,
        totalDebits: 0,
        totalCredits: 0,
        difference: 0,
        error: 'El monto de cada apunte contable debe ser positivo.',
      };
    }

    if (entry.type === 'DEBIT') {
      totalDebits += amount;
    } else if (entry.type === 'CREDIT') {
      totalCredits += amount;
    } else {
      return {
        isValid: false,
        totalDebits: 0,
        totalCredits: 0,
        difference: 0,
        error: `Tipo de apunte inválido: ${entry.type}. Debe ser DEBIT o CREDIT.`,
      };
    }
  }

  totalDebits = normalizeMoney(totalDebits);
  totalCredits = normalizeMoney(totalCredits);
  const difference = normalizeMoney(Math.abs(totalDebits - totalCredits));

  return {
    isValid: difference === 0,
    totalDebits,
    totalCredits,
    difference,
    error: difference !== 0 ? `Asiento desbalanceado por ${difference}. Debe = ${totalDebits}, Haber = ${totalCredits}` : null,
  };
}

/**
 * Genera un asiento contable estándar de partida doble a partir de una operación financiera
 */
export function createDoubleEntry({
  id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
  type,
  sourceAccountId,
  destinationAccountId,
  amount,
  feeAmount = 0,
  feeAccountId = null,
  category = 'General',
  concept = '',
  date = new Date().toISOString().split('T')[0],
  tags = [],
}) {
  const normAmount = normalizeMoney(amount);
  const normFee = normalizeMoney(feeAmount);
  const cleanConcept = sanitizeText(concept) || (type === TRANSACTION_TYPES.INCOME ? 'Ingreso registrado' : 'Gasto registrado');
  const cleanDate = normalizeIsoDate(date);

  const postings = [];

  if (type === TRANSACTION_TYPES.INCOME) {
    // Ingreso: Debe en Cuenta de Activo (+), Haber en Categoría de Ingreso
    postings.push({ accountId: destinationAccountId, type: 'DEBIT', amount: normAmount });
    postings.push({ accountId: `CAT:${category}`, type: 'CREDIT', amount: normAmount });
  } else if (type === TRANSACTION_TYPES.EXPENSE) {
    // Gasto: Debe en Categoría de Gasto (+), Haber en Cuenta de Activo/Pasivo (-)
    postings.push({ accountId: `CAT:${category}`, type: 'DEBIT', amount: normAmount });
    postings.push({ accountId: sourceAccountId, type: 'CREDIT', amount: normAmount });
  } else if (type === TRANSACTION_TYPES.TRANSFER) {
    // Transferencia entre cuentas: Debe en Destino (+), Haber en Origen (-)
    postings.push({ accountId: destinationAccountId, type: 'DEBIT', amount: normAmount });
    postings.push({ accountId: sourceAccountId, type: 'CREDIT', amount: normAmount });

    // Si hay comisión bancaria:
    if (normFee > 0 && feeAccountId) {
      postings.push({ accountId: 'CAT:Comisiones Bancarias', type: 'DEBIT', amount: normFee });
      postings.push({ accountId: feeAccountId, type: 'CREDIT', amount: normFee });
    }
  } else {
    throw new Error(`Tipo de transacción no reconocido: ${type}`);
  }

  const validation = validateJournalEntry(postings);
  if (!validation.isValid) {
    throw new Error(`Error en el motor contable: ${validation.error}`);
  }

  return {
    id,
    type,
    concept: cleanConcept,
    category,
    date: cleanDate,
    amount: normAmount,
    feeAmount: normFee,
    sourceAccountId,
    destinationAccountId,
    tags,
    postings,
    createdAt: Date.now(),
  };
}

/**
 * Recalcula de forma determinista el saldo actual de cada cuenta a partir de los asientos del Libro Mayor
 */
export function computeAccountBalances(accounts, journalTransactions) {
  const balances = {};
  accounts.forEach((acc) => {
    balances[acc.id] = normalizeMoney(acc.initialBalance || 0);
  });

  journalTransactions.forEach((tx) => {
    tx.postings.forEach((p) => {
      if (balances[p.accountId] !== undefined) {
        // En cuentas de Activo: DEBIT suma saldo, CREDIT resta saldo
        // En cuentas de Pasivo/Crédito: CREDIT aumenta deuda (saldo más negativo/pasivo), DEBIT abona a la deuda
        const account = accounts.find((a) => a.id === p.accountId);
        const isLiability = account?.type === ACCOUNT_TYPES.LIABILITY;

        if (isLiability) {
          if (p.type === 'CREDIT') balances[p.accountId] = normalizeMoney(balances[p.accountId] - p.amount);
          if (p.type === 'DEBIT') balances[p.accountId] = normalizeMoney(balances[p.accountId] + p.amount);
        } else {
          if (p.type === 'DEBIT') balances[p.accountId] = normalizeMoney(balances[p.accountId] + p.amount);
          if (p.type === 'CREDIT') balances[p.accountId] = normalizeMoney(balances[p.accountId] - p.amount);
        }
      }
    });
  });

  return balances;
}

/**
 * Calcula el Patrimonio Neto Consolidado (Activos Totales - Pasivos Totales)
 */
export function calculateNetWorth(accounts, balances) {
  let totalAssets = 0;
  let totalLiabilities = 0;

  accounts.forEach((acc) => {
    const currentBalance = balances[acc.id] !== undefined ? balances[acc.id] : (acc.initialBalance || 0);
    if (acc.type === ACCOUNT_TYPES.LIABILITY) {
      totalLiabilities += Math.abs(Math.min(0, currentBalance));
    } else {
      if (currentBalance >= 0) {
        totalAssets += currentBalance;
      } else {
        totalLiabilities += Math.abs(currentBalance);
      }
    }
  });

  totalAssets = normalizeMoney(totalAssets);
  totalLiabilities = normalizeMoney(totalLiabilities);
  const netWorth = normalizeMoney(totalAssets - totalLiabilities);

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
  };
}
