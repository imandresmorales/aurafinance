/**
 * ruleAutomationEngine.js
 * Configurable rule-based automation engine for auto-tagging, categorization, and transaction enrichment.
 * Adheres strictly to Zero-Knowledge pure functional architecture.
 */

export const RULE_OPERATORS = {
  CONTAINS: 'contains',
  EQUALS: 'equals',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  GREATER_THAN: 'greaterThan',
  LESS_THAN: 'lessThan',
  MATCHES_REGEX: 'matchesRegex',
};

export const RULE_FIELDS = {
  DESCRIPTION: 'description',
  AMOUNT: 'amount',
  TYPE: 'type',
  CATEGORY: 'category',
};

export const DEFAULT_AUTOMATION_RULES = [
  {
    id: 'rule-streaming-sub',
    name: 'Suscripciones Streaming & Música',
    isActive: true,
    condition: {
      field: RULE_FIELDS.DESCRIPTION,
      operator: RULE_OPERATORS.CONTAINS,
      value: 'netflix,spotify,disney,hbo,amazon prime,youtube',
    },
    actions: {
      setCategory: 'Ocio & Cultura',
      setSubCategory: 'Streaming & Entretenimiento',
      addTags: ['#Suscripcion', '#Fijo'],
    },
  },
  {
    id: 'rule-tech-cloud',
    name: 'Servicios Cloud & Hosting',
    isActive: true,
    condition: {
      field: RULE_FIELDS.DESCRIPTION,
      operator: RULE_OPERATORS.CONTAINS,
      value: 'aws,google cloud,vercel,github,digitalocean,heroku',
    },
    actions: {
      setCategory: 'Software & Cloud',
      setSubCategory: 'Servidores & Cloud',
      addTags: ['#Trabajo', '#Cloud'],
    },
  },
  {
    id: 'rule-transport-ride',
    name: 'Taxis & VTC Movilidad',
    isActive: true,
    condition: {
      field: RULE_FIELDS.DESCRIPTION,
      operator: RULE_OPERATORS.CONTAINS,
      value: 'uber,cabify,didi,taxi,lyft,bolt',
    },
    actions: {
      setCategory: 'Transporte & Movilidad',
      setSubCategory: 'Taxi / Uber / VTC',
      addTags: ['#Movilidad'],
    },
  },
  {
    id: 'rule-groceries',
    name: 'Supermercados & Compras de Casa',
    isActive: true,
    condition: {
      field: RULE_FIELDS.DESCRIPTION,
      operator: RULE_OPERATORS.CONTAINS,
      value: 'supermercado,mercadona,walmart,carrefour,dia,costco,jumbo,exito',
    },
    actions: {
      setCategory: 'Alimentación',
      setSubCategory: 'Supermercado',
      addTags: ['#Hogar', '#Alimentacion'],
    },
  },
  {
    id: 'rule-salary-income',
    name: 'Nómina / Pago Salarial',
    isActive: true,
    condition: {
      field: RULE_FIELDS.DESCRIPTION,
      operator: RULE_OPERATORS.CONTAINS,
      value: 'nomina,sueldo,salario,payroll',
    },
    actions: {
      setType: 'income',
      setCategory: 'Ingresos Profesionales',
      setSubCategory: 'Nómina / Salario',
      addTags: ['#Salario', '#Principal'],
    },
  },
];

/**
 * Evaluates whether a transaction satisfies a rule condition.
 * @param {Object} condition - { field, operator, value }
 * @param {Object} transaction - Transaction object
 * @returns {boolean}
 */
export function evaluateCondition(condition, transaction) {
  if (!condition || !transaction) return false;

  const { field, operator, value } = condition;
  if (value === undefined || value === null) return false;

  let txVal = transaction[field];
  if (txVal === undefined || txVal === null) txVal = '';

  const strTxVal = String(txVal).toLowerCase().trim();
  const strRuleVal = String(value).toLowerCase().trim();

  switch (operator) {
    case RULE_OPERATORS.CONTAINS: {
      // Supports comma-separated list of match tokens
      const tokens = strRuleVal.split(',').map(t => t.trim()).filter(Boolean);
      return tokens.some(token => strTxVal.includes(token));
    }
    case RULE_OPERATORS.EQUALS:
      return strTxVal === strRuleVal;

    case RULE_OPERATORS.STARTS_WITH:
      return strTxVal.startsWith(strRuleVal);

    case RULE_OPERATORS.ENDS_WITH:
      return strTxVal.endsWith(strRuleVal);

    case RULE_OPERATORS.GREATER_THAN: {
      const numTx = Math.abs(Number(transaction.amount)) || 0;
      const numRule = Number(value) || 0;
      return numTx > numRule;
    }
    case RULE_OPERATORS.LESS_THAN: {
      const numTx = Math.abs(Number(transaction.amount)) || 0;
      const numRule = Number(value) || 0;
      return numTx < numRule;
    }
    case RULE_OPERATORS.MATCHES_REGEX: {
      try {
        const regex = new RegExp(value, 'i');
        return regex.test(String(txVal));
      } catch (e) {
        return false;
      }
    }
    default:
      return false;
  }
}

/**
 * Applies active rules to a single transaction in sequence.
 * @param {Object} transaction - Target transaction
 * @param {Array} rules - Automation rules list
 * @returns {Object} { transaction: updatedTx, appliedRuleIds: string[], modified: boolean }
 */
export function applyRulesToTransaction(transaction, rules = []) {
  if (!transaction) return { transaction, appliedRuleIds: [], modified: false };

  let updated = { ...transaction };
  const appliedRuleIds = [];
  let wasModified = false;

  const activeRules = rules.filter(r => r && r.isActive !== false);

  for (const rule of activeRules) {
    if (evaluateCondition(rule.condition, updated)) {
      appliedRuleIds.push(rule.id);
      const { setCategory, setSubCategory, addTags, setType } = rule.actions || {};

      if (setCategory && updated.category !== setCategory) {
        updated.category = setCategory;
        wasModified = true;
      }
      if (setSubCategory && updated.subCategory !== setSubCategory) {
        updated.subCategory = setSubCategory;
        wasModified = true;
      }
      if (setType && updated.type !== setType) {
        updated.type = setType;
        wasModified = true;
      }
      if (Array.isArray(addTags) && addTags.length > 0) {
        const existingTags = Array.isArray(updated.tags) ? [...updated.tags] : [];
        const newTags = addTags.filter(t => !existingTags.includes(t));
        if (newTags.length > 0) {
          updated.tags = [...existingTags, ...newTags];
          wasModified = true;
        }
      }
    }
  }

  return {
    transaction: updated,
    appliedRuleIds,
    modified: wasModified,
  };
}

/**
 * Batch applies rules across an entire array of transactions.
 * @param {Array} transactions - All transactions
 * @param {Array} rules - Configured rules
 * @returns {Object} { transactions: updatedArray, totalModified: number, appliedCount: number }
 */
export function batchApplyRules(transactions = [], rules = []) {
  let totalModified = 0;
  let appliedCount = 0;

  const updatedTransactions = transactions.map(tx => {
    if (!tx || tx.deleted) return tx;
    const { transaction, appliedRuleIds, modified } = applyRulesToTransaction(tx, rules);
    if (appliedRuleIds.length > 0) appliedCount++;
    if (modified) totalModified++;
    return transaction;
  });

  return {
    transactions: updatedTransactions,
    totalModified,
    appliedCount,
  };
}
