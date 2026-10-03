import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FinancialChartsSuite from '../FinancialChartsSuite';

const mockData = {
  transactions: [
    { id: '1', date: '2026-10-01', amount: 3000, type: 'income', category: 'Salario' },
    { id: '2', date: '2026-10-02', amount: 800, type: 'expense', category: 'Alquiler' },
    { id: '3', date: '2026-10-03', amount: 200, type: 'expense', category: 'Alimentación' },
  ],
  wallets: [
    { id: 'w1', name: 'Cuenta Principal', balance: 5000, currency: 'USD' },
  ],
  baseCurrency: 'USD',
  accounts: [],
  categories: [],
};

vi.mock('../../../hooks/useAccounts', () => ({
  useAccounts: () => mockData,
  default: () => mockData,
}));

vi.mock('../../../hooks', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAccounts: () => mockData,
  };
});

describe('FinancialChartsSuite Component', () => {
  it('renders the suite header and KPI bar correctly', () => {
    render(<FinancialChartsSuite />);

    expect(screen.getByText('Centro Visual Financiero')).toBeDefined();
    expect(screen.getByText('Suite de Inteligencia Gráfica')).toBeDefined();
    expect(screen.getByText('Ingresos Totales')).toBeDefined();
    expect(screen.getByText('Gastos Totales')).toBeDefined();
  });

  it('allows switching navigation modes (Executive, Flows, Wealth, Deep Dive)', () => {
    render(<FinancialChartsSuite />);

    const flowsTab = screen.getByRole('tab', { name: /Flujos y Cascada/i });
    fireEvent.click(flowsTab);
    expect(flowsTab.getAttribute('aria-selected')).toBe('true');

    const wealthTab = screen.getByRole('tab', { name: /Patrimonio & Radar/i });
    fireEvent.click(wealthTab);
    expect(wealthTab.getAttribute('aria-selected')).toBe('true');

    const deepDiveTab = screen.getByRole('tab', { name: /Inspección Detallada/i });
    fireEvent.click(deepDiveTab);
    expect(deepDiveTab.getAttribute('aria-selected')).toBe('true');
  });

  it('allows changing date range filters', () => {
    render(<FinancialChartsSuite />);

    const filter30d = screen.getByRole('button', { name: '30D' });
    fireEvent.click(filter30d);
    expect(filter30d.className).toContain('active');
  });
});
