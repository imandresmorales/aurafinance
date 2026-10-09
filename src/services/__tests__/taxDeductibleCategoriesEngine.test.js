import { describe, it, expect } from 'vitest';
import {
  classifyDeductibleTransaction,
  scanAndAggregateDeductibleExpenses,
  TAX_DEDUCTIBLE_CATEGORIES,
} from '../taxDeductibleCategoriesEngine';

describe('taxDeductibleCategoriesEngine', () => {
  describe('classifyDeductibleTransaction', () => {
    it('classifies transactions with explicit #deducible tags', () => {
      const tx = {
        id: '1',
        amount: 250,
        description: 'Consulta Especialista',
        tags: ['#deducible', '#salud'],
        deductibleCategory: 'HEALTH_MEDICAL',
      };

      const result = classifyDeductibleTransaction(tx);
      expect(result).not.toBeNull();
      expect(result.categoryKey).toBe('HEALTH_MEDICAL');
      expect(result.confidence).toBe(1.0);
    });

    it('identifies deductible expenses via smart keyword match', () => {
      const hospitalTx = {
        id: '2',
        amount: 1200,
        description: 'Honorarios Hospital Ángeles',
      };
      const resultHospital = classifyDeductibleTransaction(hospitalTx);
      expect(resultHospital.categoryKey).toBe('HEALTH_MEDICAL');

      const retirementTx = {
        id: '3',
        amount: 500,
        description: 'Aporte voluntario PPR Sura',
      };
      const resultRetirement = classifyDeductibleTransaction(retirementTx);
      expect(resultRetirement.categoryKey).toBe('RETIREMENT_PLANS');
    });

    it('returns null for non-deductible or income transactions', () => {
      expect(classifyDeductibleTransaction({ type: 'INCOME', amount: 3000 })).toBeNull();
      expect(classifyDeductibleTransaction({ description: 'Cena Restaurante Sushi', amount: 80 })).toBeNull();
    });
  });

  describe('scanAndAggregateDeductibleExpenses', () => {
    it('aggregates transactions by deductible category and computes receipt compliance', () => {
      const transactions = [
        { id: '1', amount: 300, description: 'Dentista limpieza', invoiceNumber: 'FAC-1029' },
        { id: '2', amount: 700, description: 'Consulta Médica cirugía', receiptUrl: 'https://docs.local/r1.pdf' },
        { id: '3', amount: 2000, description: 'Aporte PPR Retiro Anual', hasReceipt: false },
        { id: '4', amount: 150, description: 'Cine y palomitas' }, // non-deductible
      ];

      const report = scanAndAggregateDeductibleExpenses(transactions, { grossAnnualIncome: 60000 });

      expect(report.totalDeductibleTransactionsCount).toBe(3);
      expect(report.totalDeductibleAmount).toBe(3000); // 300 + 700 + 2000
      expect(report.missingReceiptsCount).toBe(1);
      expect(report.overallReceiptCompliancePct).toBeCloseTo(67, 0); // 2 of 3

      expect(report.categoriesBreakdown).toHaveLength(2); // HEALTH_MEDICAL ($1000) and RETIREMENT_PLANS ($2000)
      expect(report.categoriesBreakdown[0].categoryKey).toBe('RETIREMENT_PLANS');
      expect(report.categoriesBreakdown[0].totalAmount).toBe(2000);
    });
  });
});
