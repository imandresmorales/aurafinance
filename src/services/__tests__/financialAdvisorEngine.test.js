import { describe, it, expect } from 'vitest';
import {
  generateFinancialAdvice,
  ADVICE_PRIORITIES,
  PILLAR_STATUS,
} from '../financialAdvisorEngine';

describe('financialAdvisorEngine', () => {
  it('diagnoses a deficit profile and triggers critical cash flow advice', () => {
    const advice = generateFinancialAdvice({
      wallets: [{ id: 'w1', balance: 400 }],
      monthlyIncome: 2000,
      monthlyExpenses: 2500, // Deficit of 500
      monthlyFixedExpenses: 1600,
      monthlyDiscretionaryExpenses: 900,
      subscriptions: [],
    });

    expect(advice.healthTier).toMatch(/ATENCIÓN|CRÍTICO/);
    expect(advice.metrics.netSavings).toBe(-500);
    expect(advice.pillars.savingsRate.status).toBe(PILLAR_STATUS.CRITICAL);

    // Critical advice generated
    const deficitAdvice = advice.actionableAdvice.find((a) => a.id === 'ADV-DEFICIT-01');
    expect(deficitAdvice).toBeDefined();
    expect(deficitAdvice.priority).toBe(ADVICE_PRIORITIES.CRITICAL);
  });

  it('evaluates an emergency fund shortage and provides actionable targets', () => {
    const advice = generateFinancialAdvice({
      wallets: [{ id: 'w1', balance: 1500 }],
      monthlyIncome: 3000,
      monthlyExpenses: 2200,
      monthlyFixedExpenses: 1500, // 1 month of coverage
      subscriptions: [],
    });

    expect(advice.metrics.emergencyMonths).toBe(1);
    expect(advice.pillars.emergencyFund.status).toBe(PILLAR_STATUS.WARNING);

    const emergencyAdvice = advice.actionableAdvice.find((a) => a.id === 'ADV-EMERGENCY-02');
    expect(emergencyAdvice).toBeDefined();
    expect(emergencyAdvice.impactEstimate).toContain('Meta de reserva');
  });

  it('recognizes stellar financial health and suggests compound growth opportunities', () => {
    const advice = generateFinancialAdvice({
      wallets: [{ id: 'w1', balance: 18000 }],
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      monthlyFixedExpenses: 1800, // 10 months of emergency runway
      subscriptions: [
        { id: 'sub1', amount: 15, frequency: 'monthly' },
        { id: 'sub2', amount: 20, frequency: 'monthly' },
      ],
    });

    expect(advice.healthTier).toBe('EXCELENTE');
    expect(advice.healthScore).toBeGreaterThanOrEqual(80);
    expect(advice.pillars.savingsRate.status).toBe(PILLAR_STATUS.EXCELLENT);
    expect(advice.pillars.emergencyFund.status).toBe(PILLAR_STATUS.EXCELLENT);

    // Key strengths identified
    expect(advice.keyStrengths.length).toBeGreaterThan(0);

    // Compound growth opportunity
    const investOpp = advice.topOpportunities.find((o) => o.id === 'OPP-INVEST-01');
    expect(investOpp).toBeDefined();
  });

  it('detects heavy subscription load and suggests annual consolidation', () => {
    const advice = generateFinancialAdvice({
      wallets: [{ id: 'w1', balance: 6000 }],
      monthlyIncome: 3000,
      monthlyExpenses: 2000,
      subscriptions: [
        { id: '1', amount: 30, frequency: 'monthly' },
        { id: '2', amount: 25, frequency: 'monthly' },
        { id: '3', amount: 20, frequency: 'monthly' },
        { id: '4', amount: 35, frequency: 'monthly' },
      ], // $110 / mo in 4 subs
    });

    const subsOpp = advice.topOpportunities.find((o) => o.id === 'OPP-SUBS-02');
    expect(subsOpp).toBeDefined();
    expect(subsOpp.potentialGain).toContain('Ahorro estimado');
  });
});
