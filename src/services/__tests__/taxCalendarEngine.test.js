import { describe, it, expect } from 'vitest';
import {
  getDefaultTaxEvents,
  evaluateTaxEvent,
  getTaxCalendarSummary,
  generateQuarterlyTaxEstimates,
} from '../taxCalendarEngine';

describe('taxCalendarEngine', () => {
  describe('evaluateTaxEvent', () => {
    it('evaluates upcoming event due in 5 days as DUE_SOON with HIGH urgency', () => {
      const event = {
        id: 'tax-1',
        title: 'Declaración Anual',
        type: 'ANNUAL_RETURN',
        dueDate: '2026-04-30',
      };

      const result = evaluateTaxEvent(event, '2026-04-25');
      expect(result.daysRemaining).toBe(5);
      expect(result.status).toBe('DUE_SOON');
      expect(result.urgency).toBe('HIGH');
      expect(result.typeMeta.icon).toBe('📑');
    });

    it('identifies overdue events when due date is in the past', () => {
      const event = {
        id: 'tax-2',
        title: 'Pago Q1',
        type: 'QUARTERLY_ESTIMATED',
        dueDate: '2026-04-15',
      };

      const result = evaluateTaxEvent(event, '2026-04-20');
      expect(result.daysRemaining).toBe(-5);
      expect(result.status).toBe('OVERDUE');
      expect(result.urgency).toBe('CRITICAL');
    });
  });

  describe('getTaxCalendarSummary', () => {
    it('generates summary with counts of upcoming and due soon obligations', () => {
      const summary = getTaxCalendarSummary(null, {
        referenceDate: '2026-04-01',
        year: 2026,
      });

      expect(summary.totalEventsCount).toBeGreaterThan(4);
      expect(summary.referenceDate).toBe('2026-04-01');
      expect(summary.nextUpcomingEvent).not.toBeNull();
      expect(summary.nextUpcomingEvent.dueDate).toBe('2026-04-15');
    });
  });

  describe('generateQuarterlyTaxEstimates', () => {
    it('calculates 4 equal quarterly payment installments from annual estimate', () => {
      const schedule = generateQuarterlyTaxEstimates(60000, 0.20, 2026); // total tax = 12000

      expect(schedule).toHaveLength(4);
      expect(schedule[0].estimatedAmount).toBe(3000); // 12000 / 4
      expect(schedule[0].dueDate).toBe('2026-04-15');
      expect(schedule[3].dueDate).toBe('2027-01-15');
    });
  });
});
