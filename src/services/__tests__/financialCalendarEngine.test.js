import { describe, it, expect } from 'vitest';
import {
  generateCalendarGrid,
  mapEventsToCalendarGrid,
  calculateMonthCalendarSummary,
} from '../financialCalendarEngine';

describe('financialCalendarEngine - Calendar Grid & Commitment Timeline', () => {
  it('generates a complete 35 or 42 day calendar grid starting on Monday', () => {
    // October 2026 (starts on Thursday -> Monday index 0 is Sep 28)
    const grid = generateCalendarGrid(2026, 9); // month 9 = October
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(35);

    const oct1st = grid.find((c) => c.dateStr === '2026-10-01');
    expect(oct1st).toBeDefined();
    expect(oct1st.isCurrentMonth).toBe(true);
    expect(oct1st.dayNumber).toBe(1);
  });

  it('maps actual transactions and projected occurrences onto day cells', () => {
    const grid = generateCalendarGrid(2026, 9);

    const transactions = [
      { id: 't1', description: 'Compra Supermercado', amount: 120, type: 'expense', date: '2026-10-05' },
    ];

    const projections = [
      { id: 'p1', name: 'Alquiler Departamento', amount: 900, type: 'expense', date: '2026-10-05', isProjected: true },
      { id: 'p2', name: 'Cobro Nómina', amount: 2500, type: 'income', date: '2026-10-15', isProjected: true },
    ];

    const enriched = mapEventsToCalendarGrid(grid, transactions, projections);

    const oct5 = enriched.find((c) => c.dateStr === '2026-10-05');
    expect(oct5).toBeDefined();
    expect(oct5.actualExpense).toBe(120);
    expect(oct5.projectedExpense).toBe(900);
    expect(oct5.events).toHaveLength(2);
    expect(oct5.pressureType).toBe('heavy_expense');

    const oct15 = enriched.find((c) => c.dateStr === '2026-10-15');
    expect(oct15).toBeDefined();
    expect(oct15.projectedIncome).toBe(2500);
    expect(oct15.pressureType).toBe('payday');
  });

  it('calculates monthly summary and identifies peak expense day', () => {
    const grid = generateCalendarGrid(2026, 9);
    const transactions = [
      { id: 't1', amount: 200, type: 'income', date: '2026-10-01' },
      { id: 't2', amount: 50, type: 'expense', date: '2026-10-02' },
    ];
    const projections = [
      { id: 'p1', amount: 1000, type: 'expense', date: '2026-10-10' },
    ];

    const enriched = mapEventsToCalendarGrid(grid, transactions, projections);
    const summary = calculateMonthCalendarSummary(enriched, 'USD');

    expect(summary.actualIncome).toBe(200);
    expect(summary.actualExpense).toBe(50);
    expect(summary.projectedExpense).toBe(1000);
    expect(summary.grandTotalIncome).toBe(200);
    expect(summary.grandTotalExpense).toBe(1050);
    expect(summary.projectedMonthEndBalance).toBe(-850);
    expect(summary.peakExpenseDay.date).toBe('2026-10-10');
    expect(summary.peakExpenseDay.amount).toBe(1000);
  });
});
