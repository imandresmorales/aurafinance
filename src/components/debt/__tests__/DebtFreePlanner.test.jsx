import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DebtFreePlanner } from '../DebtFreePlanner';

describe('DebtFreePlanner Component', () => {
  const sampleDebts = [
    { id: 'd1', name: 'Tarjeta Crédito Oro', principalBalance: 3000, interestRate: 0.24, minimumMonthlyPayment: 100 },
    { id: 'd2', name: 'Préstamo Auto', principalBalance: 8000, interestRate: 0.08, minimumMonthlyPayment: 220 }
  ];

  it('renders hero countdown and key milestone metrics', () => {
    render(<DebtFreePlanner debts={sampleDebts} />);

    expect(screen.getByText('Planificador Hacia Cero Deuda')).toBeDefined();
    expect(screen.getByText('Tu Día de Libertad Financiera')).toBeDefined();
    expect(screen.getByText('Meses para Libertad Total')).toBeDefined();
    expect(screen.getByText('Intereses Proyectados')).toBeDefined();
    expect(screen.getByText('Ahorro en Intereses Bancarios')).toBeDefined();
  });

  it('allows switching between Avalanche and Snowball strategies', () => {
    render(<DebtFreePlanner debts={sampleDebts} />);

    const snowballBtn = screen.getByText('❄️ Bola de Nieve');
    fireEvent.click(snowballBtn);

    const avalancheBtn = screen.getByText('🏔️ Avalancha de Intereses');
    fireEvent.click(avalancheBtn);
  });

  it('adjusts extra monthly budget using presets', () => {
    render(<DebtFreePlanner debts={sampleDebts} hourlyWage={20} />);

    const preset200 = screen.getByRole('button', { name: '+$200' });
    fireEvent.click(preset200);

    expect(screen.getAllByText(/\$200\/mes/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/rescatas/i)).toBeDefined();
  });

  it('renders the sequential payoff track with debts list', () => {
    render(<DebtFreePlanner debts={sampleDebts} />);

    expect(screen.getByText('Ruta de Victoria: Orden de Liquidación Consecutiva')).toBeDefined();
    expect(screen.getByText('Tarjeta Crédito Oro')).toBeDefined();
    expect(screen.getByText('Préstamo Auto')).toBeDefined();
  });

  it('renders congratulatory notice when there are no active debts', () => {
    render(<DebtFreePlanner debts={[]} />);

    expect(screen.getByText(/¡felicitaciones! no tienes deudas con saldo pendiente/i)).toBeDefined();
  });
});
