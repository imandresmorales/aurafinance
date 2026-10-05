import { describe, it, expect } from 'vitest';
import {
  BILL_STATUS,
  computeBillStatus,
  filterBillsByStatus,
  getBillStatusSummary,
  sortBillsByUrgency,
} from '../billStatusEngine';

describe('billStatusEngine', () => {
  const referenceDate = '2026-10-10';

  it('correctly classifies a paid bill', () => {
    const bill = { id: 'b1', name: 'Factura Agua', amount: 35, dueDate: '2026-10-05', isPaid: true };
    const status = computeBillStatus(bill, { referenceDate });

    expect(status.status).toBe(BILL_STATUS.PAID);
    expect(status.statusLabel).toBe('Pagada');
    expect(status.isPaid).toBe(true);
    expect(status.isOverdue).toBe(false);
  });

  it('correctly classifies a pending future bill', () => {
    const bill = { id: 'b2', name: 'Luz Eléctrica', amount: 80, dueDate: '2026-10-15' };
    const status = computeBillStatus(bill, { referenceDate });

    expect(status.status).toBe(BILL_STATUS.PENDING);
    expect(status.statusLabel).toBe('Pendiente');
    expect(status.daysRemaining).toBe(5);
    expect(status.daysLate).toBe(0);
  });

  it('correctly classifies a bill in grace period', () => {
    // 2 days past due date, within 3 days grace
    const bill = { id: 'b3', name: 'Telefonía', amount: 50, dueDate: '2026-10-08', gracePeriodDays: 3 };
    const status = computeBillStatus(bill, { referenceDate });

    expect(status.status).toBe(BILL_STATUS.GRACE_PERIOD);
    expect(status.statusLabel).toBe('En Gracia');
    expect(status.inGracePeriod).toBe(true);
    expect(status.daysLate).toBe(2);
    expect(status.graceDaysLeft).toBe(1);
    expect(status.isOverdue).toBe(false);
  });

  it('correctly classifies an overdue bill past grace period', () => {
    // 6 days past due date, grace is 3 days
    const bill = { id: 'b4', name: 'Alquiler', amount: 800, dueDate: '2026-10-04', gracePeriodDays: 3 };
    const status = computeBillStatus(bill, { referenceDate });

    expect(status.status).toBe(BILL_STATUS.OVERDUE);
    expect(status.statusLabel).toBe('Vencida');
    expect(status.isOverdue).toBe(true);
    expect(status.inGracePeriod).toBe(false);
    expect(status.daysLate).toBe(6);
  });

  it('filters bills by single status and multiple statuses', () => {
    const bills = [
      { id: '1', dueDate: '2026-10-15', amount: 100 }, // PENDING
      { id: '2', dueDate: '2026-10-09', gracePeriodDays: 3, amount: 50 }, // GRACE_PERIOD
      { id: '3', dueDate: '2026-10-01', gracePeriodDays: 3, amount: 200 }, // OVERDUE
      { id: '4', isPaid: true, amount: 75 }, // PAID
    ];

    const pending = filterBillsByStatus(bills, BILL_STATUS.PENDING, { referenceDate });
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe('1');

    const actionNeeded = filterBillsByStatus(bills, [BILL_STATUS.GRACE_PERIOD, BILL_STATUS.OVERDUE], { referenceDate });
    expect(actionNeeded.length).toBe(2);

    const all = filterBillsByStatus(bills, 'ALL', { referenceDate });
    expect(all.length).toBe(4);
  });

  it('calculates accurate aggregate status summary and metrics', () => {
    const bills = [
      { id: '1', dueDate: '2026-10-15', amount: 100 }, // PENDING
      { id: '2', dueDate: '2026-10-09', gracePeriodDays: 3, amount: 50 }, // GRACE
      { id: '3', dueDate: '2026-10-01', gracePeriodDays: 3, amount: 200 }, // OVERDUE
      { id: '4', isPaid: true, amount: 150 }, // PAID
    ];

    const summary = getBillStatusSummary(bills, { referenceDate });
    expect(summary.total.count).toBe(4);
    expect(summary.total.amount).toBe(500);

    expect(summary[BILL_STATUS.PAID].amount).toBe(150);
    expect(summary[BILL_STATUS.PENDING].amount).toBe(100);
    expect(summary[BILL_STATUS.GRACE_PERIOD].amount).toBe(50);
    expect(summary[BILL_STATUS.OVERDUE].amount).toBe(200);

    expect(summary.actionRequired.count).toBe(2);
    expect(summary.actionRequired.amount).toBe(250);
    expect(summary.percentages.paidPct).toBe(30);
    expect(summary.percentages.overduePct).toBe(40);
  });

  it('sorts bills by urgency level properly', () => {
    const bills = [
      { id: 'paid', isPaid: true, amount: 100 },
      { id: 'pending-far', dueDate: '2026-10-20', amount: 50 },
      { id: 'overdue-severe', dueDate: '2026-09-20', gracePeriodDays: 3, amount: 300 },
      { id: 'grace', dueDate: '2026-10-08', gracePeriodDays: 3, amount: 80 },
      { id: 'pending-near', dueDate: '2026-10-12', amount: 60 },
    ];

    const sorted = sortBillsByUrgency(bills, { referenceDate });
    expect(sorted[0].id).toBe('overdue-severe');
    expect(sorted[1].id).toBe('grace');
    expect(sorted[2].id).toBe('pending-near');
    expect(sorted[3].id).toBe('pending-far');
    expect(sorted[4].id).toBe('paid');
  });
});
