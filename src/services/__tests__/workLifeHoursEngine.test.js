import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveHourlyWage,
  convertPriceToWorkHours,
  enrichTransactionsWithLaborHours,
} from '../workLifeHoursEngine';

describe('workLifeHoursEngine', () => {
  it('calculates effective hourly wage deducting commute and work expenses', () => {
    // $3,200 net, 160h contracted, 20h commute, $200 expenses
    // Nominal = 3200 / 160 = $20/hr
    // Real Net = 3000, Total Hours = 180 -> Effective = $16.67/hr
    const wage = calculateEffectiveHourlyWage({
      netMonthlyIncome: 3200,
      contractedMonthlyHours: 160,
      monthlyCommuteHours: 20,
      monthlyWorkExpenses: 200,
    });

    expect(wage.nominalHourlyWage).toBe(20);
    expect(wage.effectiveHourlyWage).toBeCloseTo(16.67, 1);
    expect(wage.totalCommittedHours).toBe(180);
  });

  it('converts monetary prices into exact hours and days of work', () => {
    // Price $100 on $20/hr wage -> exactly 5 hours of work
    const result1 = convertPriceToWorkHours(100, 20);
    expect(result1.totalHours).toBe(5);
    expect(result1.formattedDuration).toContain('5 horas de trabajo');
    expect(result1.reflectionText).toContain('5 horas de trabajo');

    // Price $320 on $20/hr wage (8h/day) -> 16 hours = 2 days of work
    const result2 = convertPriceToWorkHours(320, 20, 8);
    expect(result2.workDays).toBe(2);
    expect(result2.formattedDuration).toContain('2 días de trabajo');
  });

  it('enriches transaction records with labor energy equivalents', () => {
    const transactions = [
      { id: '1', type: 'EXPENSE', amount: 40, concept: 'Cena' },
      { id: '2', type: 'INCOME', amount: 2000, concept: 'Salario' },
    ];

    const enriched = enrichTransactionsWithLaborHours(transactions, 20);
    expect(enriched[0].laborEnergy).toBeDefined();
    expect(enriched[0].laborEnergy.hours).toBe(2);
    expect(enriched[1].laborEnergy).toBeNull(); // Income is not an expense of energy
  });
});
