/**
 * taxDeductibleCategoriesEngine.js
 * Tax Deductible Categories & Transaction Fiscal Scanner Engine for AuraFinance.
 * Classifies, validates, and aggregates deductible personal and professional expenses
 * across Healthcare, Education, Retirement Contributions, Mortgage Interest, and Donations.
 * Zero-Knowledge local processing.
 */

export const TAX_DEDUCTIBLE_CATEGORIES = {
  HEALTH_MEDICAL: {
    id: 'HEALTH_MEDICAL',
    name: 'Salud & Gastos Médicos',
    icon: '🏥',
    description: 'Honorarios médicos, dentales, nutricionales, psicólogos, gastos hospitalarios y seguros de salud.',
    requiresReceipt: true,
    typicalCapPct: 0.15,
  },
  EDUCATION_TRAINING: {
    id: 'EDUCATION_TRAINING',
    name: 'Educación & Formación',
    icon: '🎓',
    description: 'Colegiaturas, maestrías, cursos de especialización y certificaciones profesionales.',
    requiresReceipt: true,
    typicalCapPct: 0.10,
  },
  RETIREMENT_PLANS: {
    id: 'RETIREMENT_PLANS',
    name: 'Aportaciones a Planes de Retiro (PPR/IRA)',
    icon: '🌴',
    description: 'Aportes voluntarios a fondos de pensión, cuentas de retiro complementarias y planes individuales.',
    requiresReceipt: true,
    typicalCapPct: 0.10,
  },
  MORTGAGE_INTEREST: {
    id: 'MORTGAGE_INTEREST',
    name: 'Intereses Reales de Hipoteca',
    icon: '🏠',
    description: 'Interés real efectivamente devengado y pagado en créditos hipotecarios para casa habitación.',
    requiresReceipt: true,
    typicalCapPct: null,
  },
  CHARITABLE_DONATIONS: {
    id: 'CHARITABLE_DONATIONS',
    name: 'Donaciones Autorizadas',
    icon: '🤝',
    description: 'Donativos no onerosos a fundaciones u organizaciones civiles con autorización fiscal.',
    requiresReceipt: true,
    typicalCapPct: 0.07,
  },
  HOME_OFFICE_BUSINESS: {
    id: 'HOME_OFFICE_BUSINESS',
    name: 'Equipamiento & Home Office Profesional',
    icon: '💻',
    description: 'Software profesional, internet, hardware y papelería directamente atribuibles a actividad económica.',
    requiresReceipt: true,
    typicalCapPct: null,
  },
};

const DEDUCTION_KEYWORDS = [
  { category: 'HEALTH_MEDICAL', terms: ['medic', 'doctor', 'hospital', 'dentist', 'dental', 'psicol', 'optic', 'farmac', 'seguro de salud', 'salud', 'clinic', 'cirug'] },
  { category: 'EDUCATION_TRAINING', terms: ['coleg', 'universi', 'escuel', 'colegiatura', 'curso', 'certificaci', 'diplomad', 'udemy', 'coursera', 'capacitaci'] },
  { category: 'RETIREMENT_PLANS', terms: ['ppr', 'afore', 'retiro', 'pension', 'vanguard', 'fondo retiro', 'ira', '401k'] },
  { category: 'MORTGAGE_INTEREST', terms: ['interes hipoteca', 'hipotecari', 'intereses reales', 'infonavit'] },
  { category: 'CHARITABLE_DONATIONS', terms: ['donaci', 'cruz roja', 'teleton', 'unicef', 'donativo', 'ong'] },
  { category: 'HOME_OFFICE_BUSINESS', terms: ['software', 'hosting', 'servidor', 'licencia', 'aws', 'github', 'laptop trabajo', 'papeleria trabajo'] },
];

/**
 * Normalizes text removing accents for robust keyword matching.
 * @param {string} str
 * @returns {string}
 */
function normalizeText(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Classifies a transaction to check if it qualifies for tax deductions.
 * @param {Object} transaction
 * @returns {Object|null} Deduction metadata or null if non-deductible
 */
export function classifyDeductibleTransaction(transaction = {}) {
  if (!transaction || transaction.type === 'INCOME') return null;

  // 1. Explicit Tag Match
  const tags = Array.isArray(transaction.tags)
    ? transaction.tags.map((t) => String(t).toLowerCase().replace(/^#/, ''))
    : [];

  if (tags.includes('deducible') || tags.includes('tax_deductible')) {
    const explicitCat = transaction.deductibleCategory || 'HEALTH_MEDICAL';
    return {
      categoryKey: explicitCat,
      categoryMeta: TAX_DEDUCTIBLE_CATEGORIES[explicitCat] || TAX_DEDUCTIBLE_CATEGORIES.HEALTH_MEDICAL,
      confidence: 1.0,
      matchedBy: 'EXPLICIT_TAG',
    };
  }

  // 2. Keyword Matching on Description, Merchant or Notes
  const textCorpus = normalizeText(`${transaction.description || ''} ${transaction.merchant || ''} ${transaction.notes || ''}`);

  for (const rule of DEDUCTION_KEYWORDS) {
    for (const term of rule.terms) {
      const normalizedTerm = normalizeText(term);
      if (textCorpus.includes(normalizedTerm)) {
        return {
          categoryKey: rule.category,
          categoryMeta: TAX_DEDUCTIBLE_CATEGORIES[rule.category],
          confidence: 0.85,
          matchedBy: `KEYWORD_${term.toUpperCase()}`,
        };
      }
    }
  }

  return null;
}

/**
 * Scans a transaction history and aggregates qualified deductible expenses by category.
 * @param {Array<Object>} transactions
 * @param {Object} [options]
 * @param {number} [options.grossAnnualIncome=0] - Optional income to compute percentage utilization
 * @returns {Object} Aggregated deductible report
 */
export function scanAndAggregateDeductibleExpenses(transactions = [], options = {}) {
  const gross = Math.max(0, Number(options.grossAnnualIncome) || 0);
  const aggregated = {};
  const classifiedTransactions = [];

  // Initialize buckets
  Object.keys(TAX_DEDUCTIBLE_CATEGORIES).forEach((key) => {
    aggregated[key] = {
      categoryKey: key,
      meta: TAX_DEDUCTIBLE_CATEGORIES[key],
      transactionCount: 0,
      totalAmount: 0,
      withReceiptCount: 0,
    };
  });

  let totalDeductibleAmount = 0;
  let missingReceiptsCount = 0;

  (transactions || []).forEach((tx) => {
    const classification = classifyDeductibleTransaction(tx);
    if (classification) {
      const amt = Math.abs(Number(tx.amount) || 0);
      const catKey = classification.categoryKey;
      const hasReceipt = Boolean(tx.receiptUrl || tx.invoiceNumber || tx.hasReceipt);

      aggregated[catKey].transactionCount += 1;
      aggregated[catKey].totalAmount += amt;
      if (hasReceipt) {
        aggregated[catKey].withReceiptCount += 1;
      } else {
        missingReceiptsCount += 1;
      }

      totalDeductibleAmount += amt;
      classifiedTransactions.push({
        ...tx,
        deductionInfo: classification,
        hasReceipt,
      });
    }
  });

  const categoriesBreakdown = Object.values(aggregated)
    .map((item) => ({
      ...item,
      totalAmount: Math.round(item.totalAmount * 100) / 100,
      percentageOfIncome: gross > 0 ? Math.round((item.totalAmount / gross) * 1000) / 10 : null,
      receiptCompletenessPct: item.transactionCount > 0
        ? Math.round((item.withReceiptCount / item.transactionCount) * 100)
        : 100,
    }))
    .filter((item) => item.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    totalDeductibleAmount: Math.round(totalDeductibleAmount * 100) / 100,
    totalDeductibleTransactionsCount: classifiedTransactions.length,
    missingReceiptsCount,
    overallReceiptCompliancePct: classifiedTransactions.length > 0
      ? Math.round(((classifiedTransactions.length - missingReceiptsCount) / classifiedTransactions.length) * 100)
      : 100,
    categoriesBreakdown,
    classifiedTransactions,
  };
}
