import { describe, it, expect } from 'vitest';
import {
  normalizeMerchantName,
  detectSubscriptionsFromTransactions,
  calculateSubscriptionMetrics,
} from '../subscriptionDetectorEngine';

describe('subscriptionDetectorEngine - Digital Subscriptions & Price Hike Analyzer', () => {
  it('normalizes merchant names accurately', () => {
    expect(normalizeMerchantName('Netflix.com/Payment*123')).toBe('netflix com payment 123');
    expect(normalizeMerchantName('  SPOTIFY PREMIUM  ')).toBe('spotify premium');
  });

  it('detects monthly recurring subscriptions from periodic transactions', () => {
    const transactions = [
      { id: '1', description: 'Netflix Premium Plan', amount: 15.99, type: 'expense', date: '2026-01-10', category: 'Streaming' },
      { id: '2', description: 'Netflix Premium Plan', amount: 15.99, type: 'expense', date: '2026-02-10', category: 'Streaming' },
      { id: '3', description: 'Netflix Premium Plan', amount: 15.99, type: 'expense', date: '2026-03-10', category: 'Streaming' },
    ];

    const detected = detectSubscriptionsFromTransactions(transactions);
    expect(detected.length).toBeGreaterThanOrEqual(1);
    expect(detected[0].name).toContain('Netflix');
    expect(detected[0].confidenceScore).toBeGreaterThanOrEqual(80);
    expect(detected[0].frequency).toBe('monthly');
    expect(detected[0].isPriceHikeDetected).toBe(false);
  });

  it('identifies price hikes when the latest recurring payment increased', () => {
    const transactions = [
      { id: '1', description: 'Spotify Family Plan', amount: 14.99, type: 'expense', date: '2026-01-05' },
      { id: '2', description: 'Spotify Family Plan', amount: 14.99, type: 'expense', date: '2026-02-05' },
      { id: '3', description: 'Spotify Family Plan', amount: 17.99, type: 'expense', date: '2026-03-05' },
    ];

    const detected = detectSubscriptionsFromTransactions(transactions);
    expect(detected).toHaveLength(1);
    expect(detected[0].isPriceHikeDetected).toBe(true);
    expect(detected[0].priceHikeDiff).toBe(3.0);
    expect(detected[0].previousAmount).toBe(14.99);
  });

  it('calculates aggregate subscription metrics including annual cost and active counts', () => {
    const activeSubs = [
      { id: 's1', name: 'Netflix', amount: 15, frequency: 'monthly', status: 'active' },
      { id: 's2', name: 'Amazon Prime', amount: 120, frequency: 'annual', status: 'active' },
      { id: 's3', name: 'Gym', amount: 40, frequency: 'monthly', status: 'paused' },
    ];

    const detectedList = [
      { name: 'Spotify', isPriceHikeDetected: true },
    ];

    const metrics = calculateSubscriptionMetrics(activeSubs, detectedList, 'EUR');
    expect(metrics.monthlyTotal).toBe(25); // 15 + (120 / 12)
    expect(metrics.annualTotal).toBe(300); // (15 * 12) + 120
    expect(metrics.activeCount).toBe(2);
    expect(metrics.pausedCount).toBe(1);
    expect(metrics.priceHikesCount).toBe(1);
    expect(metrics.currency).toBe('EUR');
  });
});
