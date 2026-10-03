import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FinancialCalendar from '../FinancialCalendar';

const mockTransactions = [
  { id: 't1', description: 'Compra Supermercado', amount: 120, type: 'expense', date: '2026-10-05' },
];

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    transactions: mockTransactions,
    recurringRules: [
      { id: 'r1', name: 'Alquiler', amount: 900, type: 'expense', frequency: 'monthly', startDate: '2026-01-05' },
    ],
    wallets: [{ id: 'w1', name: 'Cuenta Principal', balance: 5000 }],
    baseCurrency: 'USD',
  }),
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('FinancialCalendar Component', () => {
  it('renders the header, KPI bar, and calendar weekdays', () => {
    render(<FinancialCalendar />);

    expect(screen.getByText('Calendario de Compromisos')).toBeDefined();
    expect(screen.getByText('Agenda Financiera & Proyección')).toBeDefined();
    expect(screen.getByText('Ingresos Esperados')).toBeDefined();
    expect(screen.getByText('Gastos & Compromisos')).toBeDefined();
    expect(screen.getByText('Lun')).toBeDefined();
    expect(screen.getByText('Dom')).toBeDefined();
  });

  it('allows month stepping and returning to today', () => {
    render(<FinancialCalendar />);

    const nextBtn = screen.getByTitle('Mes siguiente');
    fireEvent.click(nextBtn);

    const prevBtn = screen.getByTitle('Mes anterior');
    fireEvent.click(prevBtn);

    const todayBtn = screen.getByRole('button', { name: 'Hoy' });
    fireEvent.click(todayBtn);
  });

  it('switches between Grid and List view modes', () => {
    render(<FinancialCalendar />);

    const listBtn = screen.getByRole('button', { name: /Lista/i });
    fireEvent.click(listBtn);
    expect(screen.getByText(/Lista Cronológica de Vencimientos/i)).toBeDefined();

    const monthBtn = screen.getByRole('button', { name: /Mes/i });
    fireEvent.click(monthBtn);
    expect(screen.getByText('Lun')).toBeDefined();
  });
});
