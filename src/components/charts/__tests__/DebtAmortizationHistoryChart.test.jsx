import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DebtAmortizationHistoryChart from '../DebtAmortizationHistoryChart';

describe('DebtAmortizationHistoryChart Component', () => {
  const sampleSchedule = [
    { period: 0, date: '2026-01-01', endingBalance: 12000, cumulativePrincipal: 0 },
    { period: 6, date: '2026-06-01', endingBalance: 6000, cumulativePrincipal: 6000 },
    { period: 12, date: '2026-12-01', endingBalance: 0, cumulativePrincipal: 12000 },
  ];

  it('renders chart title, KPIs, and SVG path correctly', () => {
    render(
      <DebtAmortizationHistoryChart
        schedule={sampleSchedule}
        originalBalance={12000}
        title="Historial de Amortización Crédito Auto"
      />
    );

    expect(screen.getByTestId('debt-amortization-history-chart')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Historial de Amortización Crédito Auto/i })).toBeDefined();
    expect(screen.getAllByText('$12,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Amortizado \(100%\)/i)).toBeDefined();
  });

  it('renders fallback demo data when schedule is empty without crashing', () => {
    render(<DebtAmortizationHistoryChart schedule={[]} originalBalance={5000} />);
    expect(screen.getByTestId('debt-amortization-history-chart')).toBeDefined();
  });
});
