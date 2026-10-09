import { describe, it, expect } from 'vitest';
import {
  evaluateCardUtilization,
  monitorCreditCardUtilization,
  UTILIZATION_TIERS,
} from '../creditCardUtilizationMonitor';

describe('creditCardUtilizationMonitor', () => {
  const sampleCards = [
    {
      id: 'c1',
      name: 'Tarjeta BBVA Platino',
      balance: 3600,
      limit: 5000, // 72% utilization (CRITICAL)
    },
    {
      id: 'c2',
      name: 'Tarjeta Nu',
      balance: 400,
      limit: 2000, // 20% utilization (GOOD)
    },
    {
      id: 'c3',
      name: 'Tarjeta Santander Aeroméxico',
      balance: 200,
      limit: 4000, // 5% utilization (EXCELLENT)
    },
  ];

  describe('evaluateCardUtilization', () => {
    it('evaluates single card utilization and computes exact paydown targets to 30% and 10%', () => {
      const result = evaluateCardUtilization(sampleCards[0]);

      expect(result.utilizationPct).toBe(72);
      expect(result.isOver30).toBe(true);
      expect(result.isOver50).toBe(true);
      expect(result.tier.key).toBe('CRITICAL');

      // To reach 30% ($1,500 balance), paydown = 3600 - 1500 = 2100
      expect(result.paydownTo30).toBe(2100);
      // To reach 10% ($500 balance), paydown = 3600 - 500 = 3100
      expect(result.paydownTo10).toBe(3100);
      expect(result.availableCredit).toBe(1400);
    });

    it('identifies healthy cards under 10% with zero paydown needed', () => {
      const result = evaluateCardUtilization(sampleCards[2]);
      expect(result.utilizationPct).toBe(5);
      expect(result.paydownTo30).toBe(0);
      expect(result.paydownTo10).toBe(0);
      expect(result.tier.key).toBe('EXCELLENT');
    });
  });

  describe('monitorCreditCardUtilization', () => {
    it('computes portfolio aggregate utilization and generates prioritized action plan', () => {
      const report = monitorCreditCardUtilization(sampleCards);

      // Total balance: 3600 + 400 + 200 = 4200
      // Total limit: 5000 + 2000 + 4000 = 11000
      // Overall utilization: 4200 / 11000 = 38.18%
      expect(report.cardsCount).toBe(3);
      expect(report.totalBalance).toBe(4200);
      expect(report.totalLimit).toBe(11000);
      expect(report.overallUtilizationPct).toBeCloseTo(38.2, 1);
      expect(report.overallTier.key).toBe('HIGH_UTILIZATION');
      expect(report.cardsOver30Count).toBe(1);

      expect(report.totalPaydownTo30).toBe(2100);
      expect(report.actionPlan).toHaveLength(1);
      expect(report.actionPlan[0].cardId).toBe('c1');
      expect(report.actionPlan[0].recommendedPaydown).toBe(2100);
    });

    it('handles empty cards array gracefully', () => {
      const report = monitorCreditCardUtilization([]);
      expect(report.cardsCount).toBe(0);
      expect(report.overallUtilizationPct).toBe(0);
      expect(report.actionPlan).toEqual([]);
    });
  });
});
