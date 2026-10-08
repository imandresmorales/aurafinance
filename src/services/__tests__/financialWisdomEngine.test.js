import { describe, it, expect } from 'vitest';
import {
  getDailyFinancialWisdom,
  getContextualWisdom,
  getWisdomByCategory,
  WISDOM_CATEGORIES,
  WISDOM_NUGGETS,
} from '../financialWisdomEngine';

describe('financialWisdomEngine', () => {
  it('returns a deterministic daily wisdom nugget for a given date', () => {
    const nugget1 = getDailyFinancialWisdom('2026-10-10');
    const nugget2 = getDailyFinancialWisdom('2026-10-10');

    expect(nugget1).toBeDefined();
    expect(nugget1.id).toBe(nugget2.id);
    expect(nugget1.title).toBeDefined();
    expect(nugget1.principle).toBeDefined();
  });

  it('delivers contextual advice for deficit and low savings habits', () => {
    const contextual = getContextualWisdom({
      netSavings: -200,
      savingsRatePct: 4,
      subscriptionCount: 1,
      debtRatioPct: 0,
    });

    expect(contextual.length).toBeGreaterThan(0);
    const hasPaySelfFirst = contextual.some((w) => w.id === 'WISDOM-02');
    expect(hasPaySelfFirst).toBe(true);
  });

  it('delivers contextual advice for heavy subscription loads and high debt', () => {
    const contextual = getContextualWisdom({
      netSavings: 500,
      savingsRatePct: 15,
      subscriptionCount: 6,
      debtRatioPct: 35,
    });

    const hasSubAudit = contextual.some((w) => w.id === 'WISDOM-05');
    const hasDebtAdvice = contextual.some((w) => w.id === 'WISDOM-06');

    expect(hasSubAudit).toBe(true);
    expect(hasDebtAdvice).toBe(true);
  });

  it('filters wisdom library by category properly', () => {
    const investNuggets = getWisdomByCategory(WISDOM_CATEGORIES.INVESTING);
    expect(investNuggets.length).toBeGreaterThan(0);
    investNuggets.forEach((n) => {
      expect(n.category).toBe(WISDOM_CATEGORIES.INVESTING);
    });

    const all = getWisdomByCategory('ALL');
    expect(all.length).toBe(WISDOM_NUGGETS.length);
  });
});
