import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpcomingBillsWidget } from '../UpcomingBillsWidget';

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    wallets: [{ id: 'w1', name: 'Main Checking', balance: 500 }],
    subscriptions: [],
    baseCurrency: 'USD',
  }),
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('UpcomingBillsWidget Component', () => {
  const referenceDate = '2026-10-10';
  const mockBills = [
    {
      id: 'bill-1',
      name: 'Internet Fibra',
      amount: 60.00,
      dueDate: '2026-10-10', // Today
      category: 'Servicios',
    },
    {
      id: 'bill-2',
      name: 'Gimnasio',
      amount: 45.00,
      dueDate: '2026-10-11', // Tomorrow
      category: 'Salud',
    },
    {
      id: 'bill-3',
      name: 'Seguro Auto',
      amount: 120.00,
      dueDate: '2026-10-15', // in 5 days
      category: 'Transporte',
    },
    {
      id: 'bill-far',
      name: 'Alquiler Futuro',
      amount: 900.00,
      dueDate: '2026-10-25', // in 15 days (outside 7 days window)
      category: 'Vivienda',
    },
  ];

  it('renders bills within 7 days window and excludes further ones', () => {
    render(
      <UpcomingBillsWidget
        bills={mockBills}
        daysWindow={7}
        referenceDate={referenceDate}
      />
    );

    expect(screen.getByText(/Próximos Pagos \(7 días\)/i)).toBeDefined();
    expect(screen.getByText('Internet Fibra')).toBeDefined();
    expect(screen.getByText('Gimnasio')).toBeDefined();
    expect(screen.getByText('Seguro Auto')).toBeDefined();
    expect(screen.queryByText('Alquiler Futuro')).toBeNull();
  });

  it('displays correct urgency badges and handles marking as paid', () => {
    const onPayMock = vi.fn();
    render(
      <UpcomingBillsWidget
        bills={mockBills}
        daysWindow={7}
        referenceDate={referenceDate}
        onPayBill={onPayMock}
      />
    );

    expect(screen.getByText('¡VENCE HOY!')).toBeDefined();
    expect(screen.getByText('Mañana')).toBeDefined();
    expect(screen.getByText('En 5 días')).toBeDefined();

    // Click pay on first item
    const payButtons = screen.getAllByRole('button', { name: /Marcar .* como pagado/i });
    expect(payButtons.length).toBe(3);

    fireEvent.click(payButtons[0]);
    expect(onPayMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'bill-1' }));
    
    // Once paid, item should disappear from the list
    expect(screen.queryByText('Internet Fibra')).toBeNull();
  });

  it('shows empty state when no bills fall in window', () => {
    render(
      <UpcomingBillsWidget
        bills={[]}
        daysWindow={7}
        referenceDate={referenceDate}
      />
    );

    expect(screen.getByTestId('upcoming-empty')).toBeDefined();
    expect(screen.getByText(/¡Sin pagos pendientes!/i)).toBeDefined();
  });
});
