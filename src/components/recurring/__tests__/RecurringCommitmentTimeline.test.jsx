import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecurringCommitmentTimeline from '../RecurringCommitmentTimeline';

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    transactions: [],
    recurringRules: [
      { id: 'r1', name: 'Alquiler', amount: 800, type: 'expense', frequency: 'monthly', startDate: '2026-10-05', category: 'Vivienda' },
      { id: 'r2', name: 'Nómina', amount: 2500, type: 'income', frequency: 'monthly', startDate: '2026-10-25', category: 'Salario' },
    ],
    wallets: [{ id: 'w1', name: 'Cuenta Principal', balance: 5000 }],
    baseCurrency: 'USD',
  }),
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('RecurringCommitmentTimeline Component', () => {
  it('renders timeline header, filter pills, and recurring nodes', () => {
    render(<RecurringCommitmentTimeline />);

    expect(screen.getByText('Línea de Tiempo Mensual')).toBeDefined();
    expect(screen.getByText('Alquiler')).toBeDefined();
    expect(screen.getByText('Nómina')).toBeDefined();
  });

  it('filters by Income and Expense tabs', () => {
    render(<RecurringCommitmentTimeline />);

    const incomeBtn = screen.getByRole('button', { name: 'Ingresos' });
    fireEvent.click(incomeBtn);

    expect(screen.getByText('Nómina')).toBeDefined();
    expect(screen.queryByText('Alquiler')).toBeNull();

    const expenseBtn = screen.getByRole('button', { name: 'Gastos' });
    fireEvent.click(expenseBtn);

    expect(screen.getByText('Alquiler')).toBeDefined();
    expect(screen.queryByText('Nómina')).toBeNull();
  });
});
