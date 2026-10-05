import { describe, it, expect } from 'vitest';
import {
  auditSubscriptionPriceHike,
  generatePriceHikeReport,
} from '../priceHikeAlertsEngine';

describe('priceHikeAlertsEngine - Stealth Price Increase & Creep Auditor', () => {
  it('identifies price increase and calculates annual and 3-year extra financial drain', () => {
    const sub = {
      id: 'sub-netflix',
      name: 'Netflix 4K',
      amount: 19.99,
      frequency: 'monthly',
      category: 'Streaming',
    };

    const txs = [
      { id: 't1', description: 'Netflix 4K', amount: 15.99, date: '2026-01-10' },
      { id: 't2', description: 'Netflix 4K', amount: 15.99, date: '2026-02-10' },
      { id: 't3', description: 'Netflix 4K', amount: 19.99, date: '2026-03-10' },
    ];

    const audit = auditSubscriptionPriceHike(sub, txs);
    expect(audit).not.toBeNull();
    expect(audit.baselineAmount).toBe(15.99);
    expect(audit.currentAmount).toBe(19.99);
    expect(audit.priceDiff).toBe(4.0);
    expect(audit.pctIncrease).toBeCloseTo(25.0, 1);
    expect(audit.annualExtraDrain).toBe(48.0); // $4 * 12
    expect(audit.threeYearExtraDrain).toBe(144.0);
  });

  it('generates an executive summary of all affected subscriptions', () => {
    const subs = [
      { id: 'sub-1', name: 'Spotify', amount: 12.99, frequency: 'monthly' },
      { id: 'sub-2', name: 'iCloud', amount: 2.99, frequency: 'monthly' },
    ];

    const txs = [
      { id: 't1', description: 'Spotify', amount: 9.99, date: '2026-01-01' },
      { id: 't2', description: 'Spotify', amount: 12.99, date: '2026-03-01' },
      { id: 't3', description: 'iCloud', amount: 2.99, date: '2026-01-01' },
      { id: 't4', description: 'iCloud', amount: 2.99, date: '2026-03-01' },
    ];

    const report = generatePriceHikeReport(subs, txs);
    expect(report.affectedSubscriptionsCount).toBe(1); // Only Spotify increased ($9.99 -> $12.99)
    expect(report.hikes[0].name).toBe('Spotify');
    expect(report.totalAnnualExtraDrain).toBe(36.0); // $3 * 12
  });
});
