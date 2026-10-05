import { describe, it, expect } from 'vitest';
import { generateBillAlerts, ALERT_URGENCY } from '../billAlertEngine';

describe('billAlertEngine - Proactive Bill Reminders and Liquidity Warning Engine', () => {
  it('identifies overdue, due today, and upcoming bills with precise sorting', () => {
    const bills = [
      { id: 'b1', name: 'Internet Fibra', amount: 50, dueDate: '2026-10-06' }, // in 5 days
      { id: 'b2', name: 'Alquiler', amount: 800, dueDate: '2026-10-01' }, // today
      { id: 'b3', name: 'Gimnasio', amount: 30, dueDate: '2026-09-28' }, // overdue
      { id: 'b4', name: 'Seguro Anual', amount: 300, dueDate: '2026-10-03' }, // in 2 days
    ];

    const alerts = generateBillAlerts({
      bills,
      currentDate: '2026-10-01',
      warningHorizonDays: 7,
    });

    expect(alerts).toHaveLength(4);
    expect(alerts[0].name).toBe('Gimnasio');
    expect(alerts[0].urgency).toBe(ALERT_URGENCY.OVERDUE);

    expect(alerts[1].name).toBe('Alquiler');
    expect(alerts[1].urgency).toBe(ALERT_URGENCY.DUE_TODAY);

    expect(alerts[2].name).toBe('Seguro Anual');
    expect(alerts[2].urgency).toBe(ALERT_URGENCY.URGENT);

    expect(alerts[3].name).toBe('Internet Fibra');
    expect(alerts[3].urgency).toBe(ALERT_URGENCY.UPCOMING);
  });

  it('detects liquidity shortage on linked payment wallet', () => {
    const bills = [
      { id: 'b1', name: 'Tarjeta Crédito', amount: 1200, dueDate: '2026-10-02', walletId: 'w1' },
    ];
    const wallets = [
      { id: 'w1', name: 'Cuenta Corriente', balance: 500 },
    ];

    const alerts = generateBillAlerts({
      bills,
      wallets,
      currentDate: '2026-10-01',
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].isLiquidityShortage).toBe(true);
    expect(alerts[0].shortageAmount).toBe(700);
    expect(alerts[0].walletName).toBe('Cuenta Corriente');
  });
});
