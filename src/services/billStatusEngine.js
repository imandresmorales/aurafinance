/**
 * billStatusEngine.js
 * Comprehensive bill lifecycle status evaluation:
 * States: Pagada (PAID), Pendiente (PENDING), En Gracia (GRACE_PERIOD), Vencida (OVERDUE).
 */

export const BILL_STATUS = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  GRACE_PERIOD: 'GRACE_PERIOD',
  OVERDUE: 'OVERDUE',
};

export const BILL_STATUS_META = {
  [BILL_STATUS.PAID]: {
    key: 'PAID',
    label: 'Pagada',
    color: '#10b981',
    badgeClass: 'status-paid',
    description: 'Factura liquidada satisfactoriamente.',
  },
  [BILL_STATUS.PENDING]: {
    key: 'PENDING',
    label: 'Pendiente',
    color: '#3b82f6',
    badgeClass: 'status-pending',
    description: 'Factura dentro del plazo reglamentario.',
  },
  [BILL_STATUS.GRACE_PERIOD]: {
    key: 'GRACE_PERIOD',
    label: 'En Gracia',
    color: '#f59e0b',
    badgeClass: 'status-grace',
    description: 'Superó fecha de vencimiento pero dentro del período de tolerancia comercial.',
  },
  [BILL_STATUS.OVERDUE]: {
    key: 'OVERDUE',
    label: 'Vencida',
    color: '#ef4444',
    badgeClass: 'status-overdue',
    description: 'Factura en mora; susceptible a recargos o suspensión de servicio.',
  },
};

/**
 * Normalizes a date into a clean Date object at noon to prevent timezone shifts.
 */
function parseSafeDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 12, 0, 0);
  }
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    }
  }
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

/**
 * Computes individual bill status and temporal metadata.
 * @param {Object} bill - Bill object { dueDate, isPaid, paidDate, gracePeriodDays, ... }
 * @param {Object} options - { referenceDate, defaultGraceDays }
 */
export function computeBillStatus(bill = {}, options = {}) {
  const referenceDate = parseSafeDate(options.referenceDate) || parseSafeDate(new Date());
  const defaultGraceDays = Number(options.defaultGraceDays ?? 3);

  const isPaid = Boolean(bill.isPaid || bill.paidDate || bill.status === 'PAID' || bill.status === 'pagada');
  const amount = Number(bill.amount) || 0;
  const graceDays = Number(bill.gracePeriodDays ?? defaultGraceDays);

  if (isPaid) {
    return {
      billId: bill.id,
      status: BILL_STATUS.PAID,
      statusLabel: BILL_STATUS_META[BILL_STATUS.PAID].label,
      statusColor: BILL_STATUS_META[BILL_STATUS.PAID].color,
      badgeClass: BILL_STATUS_META[BILL_STATUS.PAID].badgeClass,
      daysDiff: 0,
      daysRemaining: 0,
      daysLate: 0,
      isPaid: true,
      inGracePeriod: false,
      isOverdue: false,
      amount,
    };
  }

  const dueDate = parseSafeDate(bill.dueDate);
  if (!dueDate) {
    return {
      billId: bill.id,
      status: BILL_STATUS.PENDING,
      statusLabel: BILL_STATUS_META[BILL_STATUS.PENDING].label,
      statusColor: BILL_STATUS_META[BILL_STATUS.PENDING].color,
      badgeClass: BILL_STATUS_META[BILL_STATUS.PENDING].badgeClass,
      daysDiff: 0,
      daysRemaining: 0,
      daysLate: 0,
      isPaid: false,
      inGracePeriod: false,
      isOverdue: false,
      amount,
    };
  }

  const diffMs = dueDate.getTime() - referenceDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    // Due today or in the future
    return {
      billId: bill.id,
      status: BILL_STATUS.PENDING,
      statusLabel: BILL_STATUS_META[BILL_STATUS.PENDING].label,
      statusColor: BILL_STATUS_META[BILL_STATUS.PENDING].color,
      badgeClass: BILL_STATUS_META[BILL_STATUS.PENDING].badgeClass,
      daysDiff: diffDays,
      daysRemaining: diffDays,
      daysLate: 0,
      isPaid: false,
      inGracePeriod: false,
      isOverdue: false,
      amount,
    };
  }

  // Bill is past due date
  const lateDays = Math.abs(diffDays);
  if (lateDays <= graceDays) {
    return {
      billId: bill.id,
      status: BILL_STATUS.GRACE_PERIOD,
      statusLabel: BILL_STATUS_META[BILL_STATUS.GRACE_PERIOD].label,
      statusColor: BILL_STATUS_META[BILL_STATUS.GRACE_PERIOD].color,
      badgeClass: BILL_STATUS_META[BILL_STATUS.GRACE_PERIOD].badgeClass,
      daysDiff: diffDays,
      daysRemaining: 0,
      daysLate: lateDays,
      graceDaysLeft: graceDays - lateDays,
      isPaid: false,
      inGracePeriod: true,
      isOverdue: false,
      amount,
    };
  }

  // Beyond grace period -> Overdue
  return {
    billId: bill.id,
    status: BILL_STATUS.OVERDUE,
    statusLabel: BILL_STATUS_META[BILL_STATUS.OVERDUE].label,
    statusColor: BILL_STATUS_META[BILL_STATUS.OVERDUE].color,
    badgeClass: BILL_STATUS_META[BILL_STATUS.OVERDUE].badgeClass,
    daysDiff: diffDays,
    daysRemaining: 0,
    daysLate: lateDays,
    isPaid: false,
    inGracePeriod: false,
    isOverdue: true,
    amount,
  };
}

/**
 * Filter bills according to one or more statuses.
 * @param {Array} bills
 * @param {string|Array<string>} statusFilter - 'ALL' | BILL_STATUS.* | ['PENDING', 'OVERDUE']
 * @param {Object} options
 */
export function filterBillsByStatus(bills = [], statusFilter = 'ALL', options = {}) {
  const evaluatedBills = bills.map((bill) => ({
    ...bill,
    statusMeta: computeBillStatus(bill, options),
  }));

  if (!statusFilter || statusFilter === 'ALL') {
    return evaluatedBills;
  }

  const allowedStatuses = Array.isArray(statusFilter)
    ? statusFilter.map((s) => s.toUpperCase())
    : [statusFilter.toUpperCase()];

  return evaluatedBills.filter((item) =>
    allowedStatuses.includes(item.statusMeta.status.toUpperCase())
  );
}

/**
 * Generates aggregated metrics and status breakdown.
 * @param {Array} bills
 * @param {Object} options
 */
export function getBillStatusSummary(bills = [], options = {}) {
  const evaluated = bills.map((b) => computeBillStatus(b, options));

  const summary = {
    total: { count: evaluated.length, amount: 0 },
    [BILL_STATUS.PAID]: { count: 0, amount: 0 },
    [BILL_STATUS.PENDING]: { count: 0, amount: 0 },
    [BILL_STATUS.GRACE_PERIOD]: { count: 0, amount: 0 },
    [BILL_STATUS.OVERDUE]: { count: 0, amount: 0 },
    actionRequired: { count: 0, amount: 0 },
  };

  evaluated.forEach((item) => {
    summary.total.amount += item.amount;
    summary[item.status].count += 1;
    summary[item.status].amount += item.amount;

    if (item.status === BILL_STATUS.GRACE_PERIOD || item.status === BILL_STATUS.OVERDUE) {
      summary.actionRequired.count += 1;
      summary.actionRequired.amount += item.amount;
    }
  });

  // Calculate percentages
  const totalAmount = summary.total.amount || 1;
  const totalCount = summary.total.count || 1;

  summary.percentages = {
    paidPct: Number(((summary[BILL_STATUS.PAID].amount / totalAmount) * 100).toFixed(1)),
    pendingPct: Number(((summary[BILL_STATUS.PENDING].amount / totalAmount) * 100).toFixed(1)),
    gracePct: Number(((summary[BILL_STATUS.GRACE_PERIOD].amount / totalAmount) * 100).toFixed(1)),
    overduePct: Number(((summary[BILL_STATUS.OVERDUE].amount / totalAmount) * 100).toFixed(1)),
  };

  return summary;
}

/**
 * Sorts bills by urgency: OVERDUE > GRACE_PERIOD > PENDING (closest first) > PAID
 */
export function sortBillsByUrgency(bills = [], options = {}) {
  const urgencyWeight = {
    [BILL_STATUS.OVERDUE]: 4,
    [BILL_STATUS.GRACE_PERIOD]: 3,
    [BILL_STATUS.PENDING]: 2,
    [BILL_STATUS.PAID]: 1,
  };

  return [...bills].sort((a, b) => {
    const metaA = a.statusMeta || computeBillStatus(a, options);
    const metaB = b.statusMeta || computeBillStatus(b, options);

    const weightA = urgencyWeight[metaA.status] || 0;
    const weightB = urgencyWeight[metaB.status] || 0;

    if (weightA !== weightB) {
      return weightB - weightA; // higher weight first
    }

    // If both pending, closest due date first (ascending daysDiff)
    if (metaA.status === BILL_STATUS.PENDING) {
      return metaA.daysDiff - metaB.daysDiff;
    }

    // If both overdue/grace, most late first (descending daysLate)
    if (metaA.status === BILL_STATUS.OVERDUE || metaA.status === BILL_STATUS.GRACE_PERIOD) {
      return metaB.daysLate - metaA.daysLate;
    }

    return 0;
  });
}
