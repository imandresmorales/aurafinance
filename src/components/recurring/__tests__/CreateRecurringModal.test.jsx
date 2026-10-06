import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateRecurringModal } from '../CreateRecurringModal';

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    wallets: [{ id: 'w-1', name: 'Billetera Principal', balance: 1500 }],
    baseCurrency: 'USD',
  }),
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('CreateRecurringModal Component', () => {
  it('renders correctly when open and handles close action', () => {
    const onClose = vi.fn();
    render(
      <CreateRecurringModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByTestId('create-recurring-modal')).toBeDefined();
    expect(screen.getByText('Nueva Regla Recurrente')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /Cerrar modal/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('validates required fields before saving', () => {
    const onSave = vi.fn();
    render(
      <CreateRecurringModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const submitBtn = screen.getByText(/Guardar Regla Recurrente/i);
    fireEvent.click(submitBtn);

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('El nombre o descripción es obligatorio')).toBeDefined();
  });

  it('allows filling in rule details and saves properly with advanced options', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <CreateRecurringModal
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Fill name and amount
    const nameInput = screen.getByPlaceholderText(/Ej\. AWS Cloud/i);
    fireEvent.change(nameInput, { target: { value: 'Hosting Servidor Cloud' } });

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '89.50' } });

    // Open advanced
    const advBtn = screen.getByText(/Opciones y Reglas Avanzadas de Proyección/i);
    fireEvent.click(advBtn);

    // Toggle pin end of month
    const pinCheckbox = screen.getByLabelText(/Ajustar a último día de mes/i);
    fireEvent.click(pinCheckbox);

    // Submit
    const submitBtn = screen.getByText(/Guardar Regla Recurrente/i);
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Hosting Servidor Cloud',
        amount: 89.50,
        type: 'expense',
        pinEndOfMonth: true,
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
