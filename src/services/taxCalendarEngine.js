/**
 * taxCalendarEngine.js
 * Tax Calendar & Fiscal Deadlines Engine for AuraFinance.
 * Tracks annual tax return deadlines, quarterly estimated tax payments,
 * deduction cutoffs, and countdown alerts with timezone safety.
 * Zero-Knowledge local processing.
 */

import { parseCivilDate, formatCivilDate, calculateCivilDaysDiff } from './timezoneSafeScheduler';

export const TAX_EVENT_TYPES = {
  ANNUAL_RETURN: { id: 'ANNUAL_RETURN', label: 'Declaración Anual', icon: '📑', color: '#ef4444' },
  QUARTERLY_ESTIMATED: { id: 'QUARTERLY_ESTIMATED', label: 'Pago Provisional Trimestral', icon: '⏱️', color: '#f59e0b' },
  MONTHLY_PROVISIONAL: { id: 'MONTHLY_PROVISIONAL', label: 'Declaración Mensual de Impuestos', icon: '🗓️', color: '#3b82f6' },
  DEDUCTION_CUTOFF: { id: 'DEDUCTION_CUTOFF', label: 'Cierre de Facturación Deducible', icon: '🛑', color: '#ec4899' },
  INFORMATIONAL: { id: 'INFORMATIONAL', label: 'Aviso Informativo Fiscal', icon: 'ℹ️', color: '#64748b' },
};

/**
 * Standard default fiscal calendar events generator for a given year.
 * @param {number} [year=new Date().getFullYear()]
 * @returns {Array<Object>}
 */
export function getDefaultTaxEvents(year = new Date().getFullYear()) {
  const y = Number(year) || new Date().getFullYear();

  return [
    {
      id: `tax-q1-${y}`,
      title: '1er Pago Trimestral Estimado (Q1)',
      type: 'QUARTERLY_ESTIMATED',
      dueDate: `${y}-04-15`,
      description: 'Fecha límite para el pago provisional de impuestos correspondiente al primer trimestre.',
      requiresFiling: true,
    },
    {
      id: `tax-annual-${y}`,
      title: `Declaración Anual Personas Físicas (Ejercicio ${y - 1})`,
      type: 'ANNUAL_RETURN',
      dueDate: `${y}-04-30`,
      description: 'Límite legal para presentar la declaración anual de impuestos y solicitar saldo a favor.',
      requiresFiling: true,
    },
    {
      id: `tax-q2-${y}`,
      title: '2do Pago Trimestral Estimado (Q2)',
      type: 'QUARTERLY_ESTIMATED',
      dueDate: `${y}-06-15`,
      description: 'Pago provisional del segundo trimestre.',
      requiresFiling: true,
    },
    {
      id: `tax-q3-${y}`,
      title: '3er Pago Trimestral Estimado (Q3)',
      type: 'QUARTERLY_ESTIMATED',
      dueDate: `${y}-09-15`,
      description: 'Pago provisional del tercer trimestre.',
      requiresFiling: true,
    },
    {
      id: `tax-cutoff-${y}`,
      title: `Cierre Fiscal Anual ${y} (Último día de Facturas Deducibles)`,
      type: 'DEDUCTION_CUTOFF',
      dueDate: `${y}-12-31`,
      description: 'Último día para solicitar comprobantes fiscales y deducir aportes a planes de retiro (PPR).',
      requiresFiling: false,
    },
    {
      id: `tax-q4-${y + 1}`,
      title: '4to Pago Trimestral Estimado (Q4)',
      type: 'QUARTERLY_ESTIMATED',
      dueDate: `${y + 1}-01-15`,
      description: 'Pago provisional del cuarto trimestre.',
      requiresFiling: true,
    },
  ];
}

/**
 * Evaluates urgency, days remaining, and status for a tax calendar event against a reference date.
 * @param {Object} event
 * @param {string|Date} [referenceDate=new Date()]
 * @returns {Object} Evaluated tax event
 */
export function evaluateTaxEvent(event = {}, referenceDate = new Date()) {
  const ref = parseCivilDate(referenceDate);
  const due = parseCivilDate(event.dueDate || formatCivilDate(ref));
  const daysRemaining = calculateCivilDaysDiff(due, ref);

  let status = 'UPCOMING';
  let urgency = 'NORMAL';
  let urgencyBadgeClass = 'badge-normal';

  if (event.isCompleted) {
    status = 'COMPLETED';
    urgency = 'NONE';
    urgencyBadgeClass = 'badge-completed';
  } else if (daysRemaining < 0) {
    status = 'OVERDUE';
    urgency = 'CRITICAL';
    urgencyBadgeClass = 'badge-critical';
  } else if (daysRemaining === 0) {
    status = 'DUE_TODAY';
    urgency = 'CRITICAL';
    urgencyBadgeClass = 'badge-critical';
  } else if (daysRemaining <= 7) {
    status = 'DUE_SOON';
    urgency = 'HIGH';
    urgencyBadgeClass = 'badge-high';
  } else if (daysRemaining <= 30) {
    status = 'UPCOMING';
    urgency = 'MEDIUM';
    urgencyBadgeClass = 'badge-medium';
  }

  const typeMeta = TAX_EVENT_TYPES[event.type] || TAX_EVENT_TYPES.INFORMATIONAL;

  return {
    ...event,
    daysRemaining,
    status,
    urgency,
    urgencyBadgeClass,
    typeMeta,
  };
}

/**
 * Returns upcoming tax events sorted chronologically with summary counts.
 * @param {Array<Object>} [customEvents]
 * @param {Object} [options]
 * @param {string|Date} [options.referenceDate=new Date()]
 * @param {number} [options.year]
 * @returns {Object} Full tax calendar summary
 */
export function getTaxCalendarSummary(customEvents = null, options = {}) {
  const refDate = options.referenceDate ? parseCivilDate(options.referenceDate) : new Date();
  const year = options.year || refDate.getFullYear();
  const rawEvents = Array.isArray(customEvents) && customEvents.length > 0
    ? customEvents
    : getDefaultTaxEvents(year);

  const evaluated = rawEvents
    .map((evt) => evaluateTaxEvent(evt, refDate))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const overdueCount = evaluated.filter((e) => e.status === 'OVERDUE').length;
  const dueSoonCount = evaluated.filter((e) => e.status === 'DUE_SOON' || e.status === 'DUE_TODAY').length;
  const upcomingCount = evaluated.filter((e) => e.status === 'UPCOMING').length;

  const nextUpcomingEvent = evaluated.find((e) => !e.isCompleted && e.daysRemaining >= 0) || null;

  return {
    referenceDate: formatCivilDate(refDate),
    totalEventsCount: evaluated.length,
    overdueCount,
    dueSoonCount,
    upcomingCount,
    nextUpcomingEvent,
    events: evaluated,
  };
}

/**
 * Generates an estimated quarterly tax payment schedule given annual gross forecast.
 * @param {number} annualGrossEstimate
 * @param {number} estimatedTaxRate - e.g. 0.15 for 15%
 * @param {number} [year=new Date().getFullYear()]
 * @returns {Array<Object>} 4 quarterly payment deadlines with estimated amounts
 */
export function generateQuarterlyTaxEstimates(annualGrossEstimate = 40000, estimatedTaxRate = 0.15, year = new Date().getFullYear()) {
  const totalTax = Math.max(0, Number(annualGrossEstimate) || 0) * Math.max(0, Number(estimatedTaxRate) || 0.15);
  const quarterlyPayment = Math.round((totalTax / 4) * 100) / 100;

  const quarters = [
    { quarter: 'Q1', dueDate: `${year}-04-15`, periodLabel: 'Ene - Mar' },
    { quarter: 'Q2', dueDate: `${year}-06-15`, periodLabel: 'Abr - Jun' },
    { quarter: 'Q3', dueDate: `${year}-09-15`, periodLabel: 'Jul - Sep' },
    { quarter: 'Q4', dueDate: `${year + 1}-01-15`, periodLabel: 'Oct - Dic' },
  ];

  return quarters.map((q) => ({
    ...q,
    estimatedAmount: quarterlyPayment,
    title: `Pago Estimado ${q.quarter} (${q.periodLabel})`,
    totalAnnualTaxProjected: Math.round(totalTax * 100) / 100,
  }));
}
