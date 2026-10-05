import { describe, it, expect } from 'vitest';
import {
  simulateSubscriptionOptimization,
  generateOptimizationPresets,
} from '../subscriptionOptimizerEngine';

describe('subscriptionOptimizerEngine - Subscription Optimization Simulator', () => {
  const mockSubscriptions = [
    { id: 'sub-1', name: 'Netflix', amount: 20, frequency: 'monthly', category: 'Streaming' },
    { id: 'sub-2', name: 'Spotify', amount: 15, frequency: 'monthly', category: 'Streaming' },
    { id: 'sub-3', name: 'ChatGPT Plus', amount: 20, frequency: 'monthly', category: 'Software' },
  ];

  it('simulates cancelling selected subscriptions and computes freed cashflow & savings rate jump', () => {
    const simulation = simulateSubscriptionOptimization({
      currentSubscriptions: mockSubscriptions,
      cancelledSubIds: ['sub-2'], // cancel Spotify ($15/mo)
      monthlyIncome: 3000,
      currentMonthlySavings: 300,
    });

    expect(simulation.baselineMonthlyCost).toBe(55);
    expect(simulation.optimizedMonthlyCost).toBe(40);
    expect(simulation.monthlySavingsFreed).toBe(15);
    expect(simulation.annualSavingsFreed).toBe(180);
    expect(simulation.newMonthlySavings).toBe(315);
    expect(simulation.savingsRateDelta).toBeCloseTo(0.5, 1);
    expect(simulation.fiveYearInvestmentGrowth).toBeGreaterThan(1000);
  });

  it('simulates switching to annual billing discount', () => {
    const simulation = simulateSubscriptionOptimization({
      currentSubscriptions: mockSubscriptions,
      annualConvertedSubIds: ['sub-1', 'sub-2', 'sub-3'],
      monthlyIncome: 3000,
      annualDiscountRate: 0.166,
    });

    expect(simulation.convertedToAnnualCount).toBe(3);
    expect(simulation.monthlySavingsFreed).toBeGreaterThan(8);
    expect(simulation.annualSavingsFreed).toBeGreaterThan(100);
  });

  it('generates optimization presets for annual switch and streaming rotation', () => {
    const presets = generateOptimizationPresets(mockSubscriptions, 3000);

    expect(presets.annualSwitch).toBeDefined();
    expect(presets.annualSwitch.results.convertedToAnnualCount).toBe(3);

    expect(presets.trimEntertainment).toBeDefined();
    expect(presets.trimEntertainment.results.cancelledCount).toBe(1); // cancelled 1 of 2 streamings
  });
});
