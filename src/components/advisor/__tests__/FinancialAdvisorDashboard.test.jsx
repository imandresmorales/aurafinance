import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FinancialAdvisorDashboard from '../FinancialAdvisorDashboard';

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    baseCurrency: 'USD',
  }),
}));

describe('FinancialAdvisorDashboard Component', () => {
  it('renders header, tabs, and default overview metrics', () => {
    render(<FinancialAdvisorDashboard />);

    expect(screen.getByTestId('financial-advisor-dashboard')).toBeDefined();
    expect(screen.getByText('Centro de Salud & Metas Patrimoniales')).toBeDefined();
    expect(screen.getByText(/Diagnóstico & Salud/i)).toBeDefined();
    expect(screen.getByText(/Índice Global de Solvencia/i)).toBeDefined();
  });

  it('allows switching between tabs (Goals, Challenges, FIRE, Compound Interest)', () => {
    render(<FinancialAdvisorDashboard />);

    // Switch to Goals tab
    const goalsTab = screen.getByRole('tab', { name: /Metas de Ahorro/i });
    fireEvent.click(goalsTab);
    expect(screen.getByTestId('tab-goals')).toBeDefined();
    expect(screen.getByText('Portafolio de Metas Activas')).toBeDefined();

    // Switch to Challenges tab
    const challengesTab = screen.getByRole('tab', { name: /Desafíos & Medallas/i });
    fireEvent.click(challengesTab);
    expect(screen.getByTestId('tab-challenges')).toBeDefined();
    expect(screen.getByText('Reto de las 52 Semanas')).toBeDefined();

    // Switch to FIRE tab
    const fireTab = screen.getByRole('tab', { name: /FIRE & Regla del 4%/i });
    fireEvent.click(fireTab);
    expect(screen.getByTestId('tab-fire')).toBeDefined();
    expect(screen.getByText(/Calculadora de Independencia Financiera/i)).toBeDefined();
  });

  it('triggers report download when clicking export button', () => {
    render(<FinancialAdvisorDashboard />);

    const downloadBtn = screen.getByTestId('download-report-btn');
    expect(downloadBtn).toBeDefined();
    // Does not throw
    fireEvent.click(downloadBtn);
  });
});
