import { describe, it, expect } from 'vitest';
import {
  normalizeToAnnualCost,
  analyzeAnnualizedSubscriptions,
} from '../subscriptionAnnualizerEngine';

describe('subscriptionAnnualizerEngine - Consolidated Annual Cost & Opportunity Cost', () => {
  it('normalizes monthly, weekly, and annual frequencies to annual costs', () => {
    expect(normalizeToAnnualCost(10, 'monthly')).toBe(120);
    expect(normalizeToAnnualCost(5, 'weekly')).toBe(260);
    expect(normalizeToAnnualCost(100, 'annual')).toBe(100);
    expect(normalizeToAnnualCost(25, 'quarterly')).toBe(100);
  });

  it('analyzes category breakdown, top subscriber, 5-year cost, and 10-year opportunity cost', () => {
    const subscriptions = [
      { id: '1', name: 'Netflix', amount: 15, frequency: 'monthly', category: 'Streaming' },
      { id: '2', name: 'Spotify', amount: 10, frequency: 'monthly', category: 'Streaming' },
      { id: '3', name: 'Gimnasio', amount: 50, frequency: 'monthly', category: 'Salud' },
    ];

    const result = analyzeAnnualizedSubscriptions(subscriptions, 0.07, 'EUR');

    expect(result.totalMonthlyEquivalent).toBe(75); // 15 + 10 + 50
    expect(result.totalAnnualCost).toBe(900); // 75 * 12
    expect(result.totalFiveYearCost).toBe(4500); // 900 * 5
    expect(result.subscriptionsCount).toBe(3);
    expect(result.topSubscription.name).toBe('Gimnasio');
    expect(result.topSubscription.annualCost).toBe(600);
    expect(result.categories).toHaveLength(2); // Streaming & Salud
    expect(result.opportunityCost10Years).toBeGreaterThan(12000); // Compound value of $75/mo at 7% for 10 yrs
  });
});
