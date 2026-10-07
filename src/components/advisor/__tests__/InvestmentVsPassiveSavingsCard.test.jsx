import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestmentVsPassiveSavingsCard } from '../InvestmentVsPassiveSavingsCard';

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    baseCurrency: 'USD',
  }),
}));

describe('InvestmentVsPassiveSavingsCard Component', () => {
  it('renders correctly with default values and displays opportunity gap', () => {
    render(
      <InvestmentVsPassiveSavingsCard
        defaultPrincipal={1000}
        defaultMonthly={300}
        defaultYears={15}
        defaultRate={0.08}
      />
    );

    expect(screen.getByTestId('investment-comparator-card')).toBeDefined();
    expect(screen.getByText(/Interés Compuesto vs Ahorro Pasivo/i)).toBeDefined();
    expect(screen.getByText(/Ahorro Pasivo \(0% Rendimiento\)/i)).toBeDefined();
    expect(screen.getByText(/Inversión Compuesta \(8% Rendimiento\)/i)).toBeDefined();
    expect(screen.getByText(/La Brecha de Oportunidad/i)).toBeDefined();
  });

  it('updates calculations when user selects different horizon years or rate presets', () => {
    render(
      <InvestmentVsPassiveSavingsCard
        defaultPrincipal={0}
        defaultMonthly={200}
        defaultYears={5}
        defaultRate={0.05}
      />
    );

    // Switch to 20 years preset
    const btn20 = screen.getByRole('button', { name: '20 Años' });
    fireEvent.click(btn20);

    expect(btn20.className).toContain('active');
    expect(screen.getByText(/Horizonte Temporal: 20 años/i)).toBeDefined();

    // Switch to 10% rate preset
    const btn10 = screen.getByRole('button', { name: /10% Crecimiento/i });
    fireEvent.click(btn10);

    expect(btn10.className).toContain('active');
    expect(screen.getByText(/Inversión Compuesta \(10% Rendimiento\)/i)).toBeDefined();
  });

  it('allows toggling inflation adjustment', () => {
    render(
      <InvestmentVsPassiveSavingsCard
        defaultPrincipal={5000}
        defaultMonthly={400}
        defaultYears={10}
      />
    );

    const inflationCheckbox = screen.getByLabelText(/Descontar Inflación estimada/i);
    expect(inflationCheckbox).toBeDefined();

    fireEvent.click(inflationCheckbox);
    expect(inflationCheckbox.checked).toBe(true);
  });
});
