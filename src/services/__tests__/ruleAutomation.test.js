import { describe, it, expect } from 'vitest';
import {
  RULE_OPERATORS,
  RULE_FIELDS,
  DEFAULT_AUTOMATION_RULES,
  evaluateCondition,
  applyRulesToTransaction,
  batchApplyRules,
} from '../ruleAutomationEngine';

describe('Rule Automation Engine', () => {
  it('correctly evaluates CONTAINS condition with comma-separated tokens', () => {
    const condition = {
      field: RULE_FIELDS.DESCRIPTION,
      operator: RULE_OPERATORS.CONTAINS,
      value: 'netflix,spotify,disney',
    };

    expect(evaluateCondition(condition, { description: 'Pago Mensual Netflix 4K' })).toBe(true);
    expect(evaluateCondition(condition, { description: 'Spotify Family Premium' })).toBe(true);
    expect(evaluateCondition(condition, { description: 'Starbucks Coffee' })).toBe(false);
  });

  it('correctly evaluates GREATER_THAN condition for amounts', () => {
    const condition = {
      field: RULE_FIELDS.AMOUNT,
      operator: RULE_OPERATORS.GREATER_THAN,
      value: 1000,
    };

    expect(evaluateCondition(condition, { amount: 1500 })).toBe(true);
    expect(evaluateCondition(condition, { amount: 800 })).toBe(false);
  });

  it('correctly applies categorization and tags actions to transaction', () => {
    const sampleTx = {
      id: 'tx-1',
      description: 'Factura mensual AWS Cloud Services',
      amount: 120,
      type: 'expense',
      category: 'General',
      tags: ['#Tecnología'],
    };

    const rules = [
      {
        id: 'rule-cloud',
        isActive: true,
        condition: {
          field: RULE_FIELDS.DESCRIPTION,
          operator: RULE_OPERATORS.CONTAINS,
          value: 'aws,google cloud',
        },
        actions: {
          setCategory: 'Software & Cloud',
          setSubCategory: 'Servidores & Cloud',
          addTags: ['#Cloud', '#Trabajo'],
        },
      },
    ];

    const result = applyRulesToTransaction(sampleTx, rules);

    expect(result.modified).toBe(true);
    expect(result.appliedRuleIds).toEqual(['rule-cloud']);
    expect(result.transaction.category).toBe('Software & Cloud');
    expect(result.transaction.subCategory).toBe('Servidores & Cloud');
    expect(result.transaction.tags).toEqual(['#Tecnología', '#Cloud', '#Trabajo']);
  });

  it('batch applies rules over multiple transactions preserving non-matching ones', () => {
    const list = [
      { id: '1', description: 'Uber Trip to Airport', amount: 35, category: 'General', tags: [] },
      { id: '2', description: 'Mercadona Supermercado', amount: 85, category: 'General', tags: [] },
      { id: '3', description: 'Transferencia a Bóveda', amount: 500, category: 'Ahorro', tags: [] },
    ];

    const result = batchApplyRules(list, DEFAULT_AUTOMATION_RULES);

    expect(result.appliedCount).toBe(2);
    expect(result.totalModified).toBe(2);

    const uberTx = result.transactions.find(t => t.id === '1');
    expect(uberTx.category).toBe('Transporte & Movilidad');
    expect(uberTx.tags).toContain('#Movilidad');

    const mercadonaTx = result.transactions.find(t => t.id === '2');
    expect(mercadonaTx.category).toBe('Alimentación');
    expect(mercadonaTx.tags).toContain('#Hogar');
  });

  it('skips inactive rules during processing', () => {
    const tx = { id: '1', description: 'Netflix sub', category: 'General' };
    const inactiveRule = {
      id: 'rule-inactive',
      isActive: false,
      condition: {
        field: RULE_FIELDS.DESCRIPTION,
        operator: RULE_OPERATORS.CONTAINS,
        value: 'netflix',
      },
      actions: {
        setCategory: 'Ocio & Cultura',
      },
    };

    const result = applyRulesToTransaction(tx, [inactiveRule]);
    expect(result.modified).toBe(false);
    expect(result.appliedRuleIds).toHaveLength(0);
    expect(result.transaction.category).toBe('General');
  });
});
