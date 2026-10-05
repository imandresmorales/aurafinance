import { describe, it, expect } from 'vitest';
import {
  estimateVariableBillAmount,
  generateInflationAdjustedProjections,
} from '../variableRecurringEngine';

describe('variableRecurringEngine - Variable Bill & Inflation Escalation Service', () => {
  it('estimates variable bill amounts using weighted moving averages and seasonal multipliers', () => {
    const history = [40, 45, 50, 60]; // latest bill was 60
    const estimate = estimateVariableBillAmount({
      history,
      seasonalMultiplier: 1.1, // 10% seasonal winter boost
      annualInflationRate: 0.02, // 2% inflation
    });

    expect(estimate.estimatedAmount).toBeGreaterThan(55);
    expect(estimate.minHistorical).toBe(40);
    expect(estimate.maxHistorical).toBe(60);
    expect(estimate.confidence).toBeGreaterThanOrEqual(80);
  });

  it('handles empty history gracefully using fallback baseline', () => {
    const estimate = estimateVariableBillAmount({
      history: [],
      fallbackAmount: 75,
      seasonalMultiplier: 1.0,
    });

    expect(estimate.estimatedAmount).toBe(75);
    expect(estimate.confidence).toBe(30);
  });

  it('projects multi-year compounding inflation escalation for recurring commitments', () => {
    const rule = {
      name: 'Alquiler Vivienda',
      amount: 1000,
      frequency: 'monthly',
    };

    const projections = generateInflationAdjustedProjections(rule, 3, 0.05); // 5% annual inflation
    expect(projections).toHaveLength(3);

    // Year 1: 1000 * 1.05 = 1050
    expect(projections[0].estimatedAmount).toBeCloseTo(1050, 0);
    expect(projections[0].annualTotalCost).toBeCloseTo(12600, 0);

    // Year 2: 1000 * (1.05)^2 = 1102.50
    expect(projections[1].estimatedAmount).toBeCloseTo(1102.5, 0);

    // Year 3: 1000 * (1.05)^3 = 1157.63
    expect(projections[2].estimatedAmount).toBeCloseTo(1157.63, 0);
  });
});
