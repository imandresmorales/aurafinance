import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringBillsCenter } from '../RecurringBillsCenter';

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    wallets: [{ id: 'w1', name: 'Main Checking', balance: 5000 }],
    subscriptions: [
      { id: 's1', name: 'Netflix', amount: 15, frequency: 'monthly', type: 'expense', category: 'Streaming' },
      { id: 's2', name: 'Salario Tech', amount: 4000, frequency: 'monthly', type: 'income', category: 'Nómina' },
    ],
    transactions: [],
    baseCurrency: 'USD',
  }),
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('RecurringBillsCenter Component', () => {
  it('renders header, macro KPIs and defaults to subscriptions view', () => {
    render(<RecurringBillsCenter />);

    expect(screen.getByTestId('recurring-bills-center')).toBeDefined();
    expect(screen.getByText('Compromisos & Suscripciones')).toBeDefined();
    expect(screen.getByText('Gastos Recurrentes / Mes')).toBeDefined();
    expect(screen.getByText('Ingresos Recurrentes / Mes')).toBeDefined();

    // Default view
    expect(screen.getByTestId('view-subscriptions')).toBeDefined();
  });

  it('allows switching views across Calendar, Timeline and Stress Simulator', () => {
    render(<RecurringBillsCenter />);

    // Switch to Calendar
    const calendarTab = screen.getByRole('tab', { name: /Calendario Financiero/i });
    fireEvent.click(calendarTab);
    expect(screen.getByTestId('view-calendar')).toBeDefined();

    // Switch to Timeline
    const timelineTab = screen.getByRole('tab', { name: /Timeline Cronológico/i });
    fireEvent.click(timelineTab);
    expect(screen.getByTestId('view-timeline')).toBeDefined();

    // Switch to Stress Simulator
    const stressTab = screen.getByRole('tab', { name: /Simulador de Estrés/i });
    fireEvent.click(stressTab);
    expect(screen.getByTestId('view-stress')).toBeDefined();
    expect(screen.getByText('¿Riesgo de Insolvencia?')).toBeDefined();
  });

  it('opens and interacts with the create rule modal', () => {
    render(<RecurringBillsCenter />);

    const openBtn = screen.getByTestId('open-create-rule-btn');
    fireEvent.click(openBtn);

    expect(screen.getByTestId('create-recurring-modal')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Nueva Regla Recurrente/i })).toBeDefined();
  });
});

