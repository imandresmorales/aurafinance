import { describe, it, expect } from 'vitest';
import {
  auditContractRenewal,
  auditAllContracts,
  CONTRACT_STATUS,
} from '../contractRenewalEngine';

describe('contractRenewalEngine - Service Contract Notice & Renewal Tracker', () => {
  it('calculates cancellation deadline and triggers ACTION_REQUIRED within 14 days', () => {
    // Contract renews on 2026-10-31, requires 30 days notice -> deadline is 2026-10-01
    const contract = {
      id: 'c1',
      name: 'Gimnasio Anual',
      renewalDate: '2026-10-31',
      noticePeriodDays: 30,
      amount: 400,
      frequency: 'annual',
    };

    const audit = auditContractRenewal(contract, '2026-09-25');
    expect(audit).not.toBeNull();
    expect(audit.cancellationDeadline).toBe('2026-10-01');
    expect(audit.daysUntilDeadline).toBe(6); // 6 days before Oct 1st
    expect(audit.status).toBe(CONTRACT_STATUS.ACTION_REQUIRED);
    expect(audit.isActionRequired).toBe(true);
  });

  it('detects locked in status when the notice deadline has already elapsed', () => {
    const contract = {
      id: 'c2',
      name: 'Seguro Hogar',
      renewalDate: '2026-10-15',
      noticePeriodDays: 30, // deadline was Sep 15
    };

    const audit = auditContractRenewal(contract, '2026-10-01');
    expect(audit.status).toBe(CONTRACT_STATUS.LOCKED_IN);
    expect(audit.isLockedIn).toBe(true);
  });

  it('audits list of contracts and flags urgent items', () => {
    const contracts = [
      { id: 'c1', renewalDate: '2026-10-30', noticePeriodDays: 30 }, // deadline: Sep 30 (locked in)
      { id: 'c2', renewalDate: '2026-11-10', noticePeriodDays: 30 }, // deadline: Oct 11 (10 days left -> action required)
      { id: 'c3', renewalDate: '2027-05-01', noticePeriodDays: 30 }, // safe
    ];

    const result = auditAllContracts(contracts, '2026-10-01');
    expect(result.contracts).toHaveLength(3);
    expect(result.lockedInCount).toBe(1);
    expect(result.actionRequiredCount).toBe(1);
  });
});
