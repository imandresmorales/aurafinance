import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DailyFinancialDiagnosticCard from '../DailyFinancialDiagnosticCard';

describe('DailyFinancialDiagnosticCard Component', () => {
  const sampleProps = {
    healthScore: 84,
    healthScoreLabel: 'Excelente',
    runwayMonths: 6.2,
    upcomingBillsCount: 3,
    upcomingBillsTotal: 240.5,
    activeAlerts: [
      {
        id: 'a-1',
        text: 'Presupuesto de Ocio al 90%',
        severity: 'warning',
        actionType: 'NAV_BUDGET',
        actionLabel: 'Revisar',
      },
    ],
    dailyWisdom: {
      quote: 'Págate a ti mismo primero antes de gastar.',
      author: 'George S. Clason',
      tag: 'Regla de Oro',
    },
    onActionClick: vi.fn(),
  };

  it('renders card title, health score pill, and KPI items correctly', () => {
    render(<DailyFinancialDiagnosticCard {...sampleProps} />);

    expect(screen.getByText('Diagnóstico Financiero Diario')).toBeDefined();
    expect(screen.getByText(/84\/100 • Excelente/i)).toBeDefined();
    expect(screen.getByText('6.2 meses')).toBeDefined();
    expect(screen.getByText(/3 \(\$240.50\)/i)).toBeDefined();
    expect(screen.getByText('1 pendientes')).toBeDefined();
  });

  it('renders daily wisdom quote and author', () => {
    render(<DailyFinancialDiagnosticCard {...sampleProps} />);

    expect(screen.getByText(/"Págate a ti mismo primero antes de gastar."/i)).toBeDefined();
    expect(screen.getByText(/— George S. Clason/i)).toBeDefined();
    expect(screen.getByText(/Regla de Oro/i)).toBeDefined();
  });

  it('fires callbacks when clicking action buttons and alert action', () => {
    const handleAction = vi.fn();
    render(<DailyFinancialDiagnosticCard {...sampleProps} onActionClick={handleAction} />);

    const advisorBtn = screen.getByText(/Ver Asesor Financiero Completo/i);
    fireEvent.click(advisorBtn);
    expect(handleAction).toHaveBeenCalledWith('VIEW_ADVISOR');

    const alertActionBtn = screen.getByText('Revisar');
    fireEvent.click(alertActionBtn);
    expect(handleAction).toHaveBeenCalledWith('NAV_BUDGET', sampleProps.activeAlerts[0]);
  });
});
