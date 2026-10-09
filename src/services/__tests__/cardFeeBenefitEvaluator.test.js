import { describe, it, expect } from 'vitest';
import { evaluateCardFeeBenefit, compareCardsROI } from '../cardFeeBenefitEvaluator.js';

describe('cardFeeBenefitEvaluator', () => {
  describe('evaluateCardFeeBenefit', () => {
    it('evaluates no-fee card accurately', () => {
      const card = {
        name: 'Tarjeta Sin Anualidad',
        annualFee: 0,
        cashbackCategories: [
          { category: 'SUPERMERCADO', percent: 2 },
          { category: 'RESTAURANTES', percent: 1.5 }
        ],
        defaultRewardPercent: 1
      };

      const spending = {
        supermercado: 4000,
        restaurantes: 2000,
        otros: 3000
      };

      const res = evaluateCardFeeBenefit(card, spending);

      expect(res.annualFee).toBe(0);
      expect(res.totalAnnualSpend).toBe(9000);
      // Cashback = (4000*0.02) + (2000*0.015) + (3000*0.01) = 80 + 30 + 30 = 140
      expect(res.annualCashbackEarned).toBe(140);
      expect(res.netBenefit).toBe(140);
      expect(res.verdict).toBe('FREE_CARD_PROFITABLE');
    });

    it('identifies unprofitable card with high fee and low perk usage', () => {
      const card = {
        name: 'Tarjeta Black Premium',
        annualFee: 500,
        cashbackCategories: [
          { category: 'VIAJES', percent: 3 }
        ],
        defaultRewardPercent: 1,
        perks: [
          { name: 'Crédito de Viaje', annualValue: 200, isUsed: false }, // Not used
          { name: 'Membresía Streaming', annualValue: 60, isUsed: true }
        ]
      };

      const spending = {
        viajes: 1000, // 30
        otros: 5000   // 50
      };

      const res = evaluateCardFeeBenefit(card, spending);

      // Cashback = 30 + 50 = 80
      // Perks claimed = 60
      // Gross = 140
      // Net = 140 - 500 = -360
      expect(res.annualCashbackEarned).toBe(80);
      expect(res.totalPerksValueClaimed).toBe(60);
      expect(res.netBenefit).toBe(-360);
      expect(res.verdict).toBe('UNPROFITABLE_CANCEL_OR_DOWNGRADE');
      expect(res.recommendations.some(r => r.includes('pérdida neta'))).toBe(true);
      expect(res.recommendations.some(r => r.includes('beneficios y créditos anuales sin utilizar'))).toBe(true);
    });

    it('evaluates highly profitable card with perks and multipliers', () => {
      const card = {
        name: 'Viajero Frecuente Gold',
        annualFee: 150,
        cashbackCategories: [
          { category: 'VIAJES', percent: 5 },
          { category: 'COMIDAS', percent: 3 }
        ],
        perks: [
          { name: 'Descuento Hotel', annualValue: 100, isUsed: true },
          { name: 'Equipaje Gratis', annualValue: 80, isUsed: true }
        ]
      };

      const monthlySpending = {
        isMonthly: true,
        viajes: 200,   // 2400/yr -> 5% = 120
        comidas: 300   // 3600/yr -> 3% = 108
      };

      const res = evaluateCardFeeBenefit(card, monthlySpending);

      expect(res.totalAnnualSpend).toBe(6000);
      expect(res.annualCashbackEarned).toBe(228); // 120 + 108
      expect(res.totalPerksValueClaimed).toBe(180); // 100 + 80
      // Total Gross = 228 + 180 = 408
      // Net Benefit = 408 - 150 = 258
      expect(res.netBenefit).toBe(258);
      expect(res.verdict).toBe('HIGHLY_PROFITABLE');
      expect(res.roiPercent).toBeCloseTo(172.0, 1);
    });
  });

  describe('compareCardsROI', () => {
    it('ranks multiple cards by highest net benefit', () => {
      const spending = {
        supermercado: 5000,
        viajes: 3000
      };

      const cardA = {
        name: 'Card Zero',
        annualFee: 0,
        defaultRewardPercent: 1.5 // 8000 * 0.015 = 120 net
      };

      const cardB = {
        name: 'Card Premium',
        annualFee: 200,
        cashbackCategories: [
          { category: 'SUPERMERCADO', percent: 4 }, // 200
          { category: 'VIAJES', percent: 6 }         // 180
        ],
        perks: [{ name: 'Travel Credit', annualValue: 100, isUsed: true }] // 100
        // Total gross = 480 -> net = 280
      };

      const cardC = {
        name: 'Card Expensive Low Return',
        annualFee: 400,
        defaultRewardPercent: 1 // 80 -> net = -320
      };

      const comparison = compareCardsROI([cardA, cardB, cardC], spending);

      expect(comparison.rankings).toHaveLength(3);
      expect(comparison.bestCard.cardName).toBe('Card Premium');
      expect(comparison.rankings[0].netBenefit).toBe(280);
      expect(comparison.rankings[1].netBenefit).toBe(120);
      expect(comparison.rankings[2].netBenefit).toBe(-320);
      expect(comparison.potentialAnnualGain).toBe(600); // 280 - (-320)
    });

    it('returns empty safe structure for empty cards list', () => {
      const comparison = compareCardsROI([]);
      expect(comparison.rankings).toEqual([]);
      expect(comparison.bestCard).toBeNull();
      expect(comparison.potentialAnnualGain).toBe(0);
    });
  });
});
