import { describe, it, expect } from 'vitest';
import {
  RECURRING_FREQUENCIES,
  validateRecurringRule,
  calculateNextOccurrence,
  generateProjectedOccurrences,
  detectDueRecurringItems,
  calculateRecurringSummary,
} from '../recurringEngine';

describe('recurringEngine - Financial Recurrence & Scheduling Service', () => {
  it('validates recurring rule properties correctly', () => {
    const valid = validateRecurringRule({
      name: 'Netflix Premium',
      amount: 15.99,
      frequency: RECURRING_FREQUENCIES.MONTHLY,
      startDate: '2026-01-01',
    });
    expect(valid.isValid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validateRecurringRule({
      name: '',
      amount: -10,
      frequency: 'invalid-frequency',
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(1);
  });

  it('calculates next monthly and weekly occurrences accurately', () => {
    const monthlyRule = {
      name: 'Gimnasio',
      amount: 50,
      frequency: RECURRING_FREQUENCIES.MONTHLY,
      startDate: '2026-01-15',
    };

    const nextFromFeb = calculateNextOccurrence(monthlyRule, '2026-02-01');
    expect(nextFromFeb).toBe('2026-02-15');

    const weeklyRule = {
      name: 'Clases Particulares',
      amount: 30,
      frequency: RECURRING_FREQUENCIES.WEEKLY,
      startDate: '2026-03-01',
    };
    const nextWeekly = calculateNextOccurrence(weeklyRule, '2026-03-02');
    expect(nextWeekly).toBe('2026-03-08');
  });

  it('handles leap year and end of month clipping safely (Feb 28/29 / 31st)', () => {
    const rule31st = {
      name: 'Factura Fin de Mes',
      amount: 100,
      frequency: RECURRING_FREQUENCIES.MONTHLY,
      startDate: '2026-01-31',
    };

    const febOccurrence = calculateNextOccurrence(rule31st, '2026-02-01');
    expect(febOccurrence).toBe('2026-02-28');
  });

  it('stops generating occurrences after endDate expiration', () => {
    const finiteRule = {
      name: 'Suscripción Temporal',
      amount: 20,
      frequency: RECURRING_FREQUENCIES.MONTHLY,
      startDate: '2026-01-01',
      endDate: '2026-03-01',
    };

    const occurrenceBeforeEnd = calculateNextOccurrence(finiteRule, '2026-02-15');
    expect(occurrenceBeforeEnd).toBe('2026-03-01');

    const occurrenceAfterEnd = calculateNextOccurrence(finiteRule, '2026-03-02');
    expect(occurrenceAfterEnd).toBeNull();
  });

  it('generates chronological projected occurrences over a date interval', () => {
    const rules = [
      {
        id: 'r1',
        name: 'Sueldo Nómina',
        amount: 3000,
        type: 'income',
        frequency: RECURRING_FREQUENCIES.MONTHLY,
        startDate: '2026-01-25',
      },
      {
        id: 'r2',
        name: 'Spotify Familiar',
        amount: 17.99,
        type: 'expense',
        frequency: RECURRING_FREQUENCIES.MONTHLY,
        startDate: '2026-01-10',
        isSubscription: true,
      },
    ];

    const projections = generateProjectedOccurrences(rules, '2026-02-01', '2026-03-31');
    expect(projections.length).toBe(4);
    expect(projections[0].name).toBe('Spotify Familiar');
    expect(projections[0].date).toBe('2026-02-10');
    expect(projections[1].name).toBe('Sueldo Nómina');
    expect(projections[1].date).toBe('2026-02-25');
  });

  it('detects due and overdue recurring items', () => {
    const rules = [
      {
        id: 'r1',
        name: 'Seguro Auto',
        amount: 200,
        startDate: '2026-03-01',
        nextOccurrenceDate: '2026-03-01',
      },
      {
        id: 'r2',
        name: 'Internet Fibra',
        amount: 45,
        startDate: '2026-03-15',
        nextOccurrenceDate: '2026-03-15',
      },
    ];

    const dueItems = detectDueRecurringItems(rules, '2026-03-05');
    expect(dueItems).toHaveLength(1);
    expect(dueItems[0].name).toBe('Seguro Auto');
    expect(dueItems[0].isOverdue).toBe(true);
  });

  it('calculates monthly and annual normalized summary metrics accurately', () => {
    const rules = [
      {
        name: 'Alquiler',
        amount: 1200,
        type: 'expense',
        frequency: RECURRING_FREQUENCIES.MONTHLY,
        startDate: '2026-01-01',
      },
      {
        name: 'Suscripción Software Anual',
        amount: 120,
        type: 'expense',
        frequency: RECURRING_FREQUENCIES.ANNUAL,
        startDate: '2026-01-01',
        isSubscription: true,
      },
      {
        name: 'Salario Base',
        amount: 3500,
        type: 'income',
        frequency: RECURRING_FREQUENCIES.MONTHLY,
        startDate: '2026-01-01',
      },
    ];

    const summary = calculateRecurringSummary(rules, 'USD');
    expect(summary.monthlyExpenses).toBe(1210); // 1200 + 120/12
    expect(summary.monthlyIncomes).toBe(3500);
    expect(summary.netMonthlyRecurring).toBe(2290);
    expect(summary.annualNormalizedExpense).toBe(14520);
    expect(summary.activeSubscriptionsCount).toBe(1);
    expect(summary.monthlySubscriptionsCost).toBe(10);
  });
});
