/**
 * contractRenewalEngine.js
 * Service Contract & Notice-Period Renewal Tracker Engine for AuraFinance.
 * Prevents unwanted automatic renewals and lock-in traps.
 * Zero-Knowledge local processing.
 */

import { parseLocalDate, formatToDateStr } from './recurringEngine';

export const CONTRACT_STATUS = {
  SAFE: 'safe', // Deadline > 30 days away
  NOTICE_WINDOW_OPEN: 'notice_window_open', // 15 - 30 days away
  ACTION_REQUIRED: 'action_required', // <= 14 days away
  LOCKED_IN: 'locked_in', // Deadline passed; contract auto-renewed
};

/**
 * Calculates cancellation deadline, notice window, and penalty metrics for a service contract.
 * @param {Object} contract
 * @param {string} contract.renewalDate - YYYY-MM-DD next contract expiration/renewal date
 * @param {number} [contract.noticePeriodDays=30] - Required advance notice days (e.g. 30 days prior)
 * @param {number} [contract.amount=0] - Recurring billing amount
 * @param {string} [contract.frequency='annual']
 * @param {number} [contract.earlyExitFee=0] - Fixed fee for early termination
 * @param {Date|string} [currentDate=new Date()]
 * @returns {Object} Contract audit and deadline metrics
 */
export function auditContractRenewal(contract, currentDate = new Date()) {
  if (!contract || !contract.renewalDate) return null;

  const today = parseLocalDate(currentDate);
  const renewal = parseLocalDate(contract.renewalDate);
  const noticeDays = Math.max(0, parseInt(contract.noticePeriodDays || 30, 10));

  // Cancellation deadline = renewalDate - noticePeriodDays
  const cancellationDeadline = new Date(renewal);
  cancellationDeadline.setDate(cancellationDeadline.getDate() - noticeDays);

  const diffTime = cancellationDeadline.getTime() - today.getTime();
  const daysUntilDeadline = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let status = CONTRACT_STATUS.SAFE;
  let statusMessage = `Plazo para preaviso de cancelación seguro (${daysUntilDeadline} días restantes).`;

  if (daysUntilDeadline < 0) {
    status = CONTRACT_STATUS.LOCKED_IN;
    statusMessage = `Fecha límite de preaviso superada (${formatToDateStr(cancellationDeadline)}). El contrato se auto-renovará el ${contract.renewalDate}.`;
  } else if (daysUntilDeadline <= 14) {
    status = CONTRACT_STATUS.ACTION_REQUIRED;
    statusMessage = `¡Atención Urgente! Solo quedan ${daysUntilDeadline} día(s) para cancelar o renegociar antes del bloqueo.`;
  } else if (daysUntilDeadline <= 30) {
    status = CONTRACT_STATUS.NOTICE_WINDOW_OPEN;
    statusMessage = `Ventana de preaviso abierta. Puedes solicitar la cancelación con anticipación.`;
  }

  const annualValue = contract.frequency === 'monthly' ? (Number(contract.amount) || 0) * 12 : (Number(contract.amount) || 0);

  return {
    id: contract.id,
    name: contract.name || 'Contrato de Servicio',
    provider: contract.provider || contract.name,
    renewalDate: contract.renewalDate,
    noticePeriodDays: noticeDays,
    cancellationDeadline: formatToDateStr(cancellationDeadline),
    daysUntilDeadline,
    status,
    statusMessage,
    isActionRequired: status === CONTRACT_STATUS.ACTION_REQUIRED,
    isLockedIn: status === CONTRACT_STATUS.LOCKED_IN,
    annualCommitment: Math.round(annualValue * 100) / 100,
    earlyExitFee: Number(contract.earlyExitFee) || 0,
  };
}

/**
 * Audits an array of contracts and returns urgent items requiring attention.
 * @param {Array<Object>} contracts
 * @param {Date|string} [currentDate=new Date()]
 * @returns {{ contracts: Array<Object>, actionRequiredCount: number, lockedInCount: number }}
 */
export function auditAllContracts(contracts = [], currentDate = new Date()) {
  const audited = contracts
    .map((c) => auditContractRenewal(c, currentDate))
    .filter(Boolean);

  const actionRequiredCount = audited.filter((c) => c.status === CONTRACT_STATUS.ACTION_REQUIRED).length;
  const lockedInCount = audited.filter((c) => c.status === CONTRACT_STATUS.LOCKED_IN).length;

  return {
    contracts: audited.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline),
    actionRequiredCount,
    lockedInCount,
  };
}
