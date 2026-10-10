import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateLoanModal } from '../CreateLoanModal';

describe('CreateLoanModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<CreateLoanModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog and elements when open', () => {
    render(<CreateLoanModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: /nuevo préstamo o deuda/i })).toBeDefined();
    expect(screen.getByLabelText(/nombre \/ entidad/i)).toBeDefined();
    expect(screen.getByLabelText(/capital solicitado/i)).toBeDefined();
    expect(screen.getByLabelText(/tasa anual/i)).toBeDefined();
    expect(screen.getByLabelText(/plazo de pago/i)).toBeDefined();
  });

  it('calculates monthly installment dynamically in real-time preview', () => {
    render(<CreateLoanModal isOpen={true} />);

    // Default: 10,000 at 12% for 36 months French system:
    // Monthly payment is approx $332.14
    expect(screen.getByText('Cuota Periódica Estimada')).toBeDefined();
    expect(screen.getByText('332,14')).toBeDefined();

    // Change principal to 20,000
    const principalInput = screen.getByLabelText(/capital solicitado/i);
    fireEvent.change(principalInput, { target: { value: '20000' } });

    // Payment doubles to 664.29
    expect(screen.getByText('664,29')).toBeDefined();
  });

  it('validates required fields on submission', () => {
    const onSave = vi.fn();
    const { container } = render(<CreateLoanModal isOpen={true} onSave={onSave} />);

    // Submit form with empty name
    const form = container.querySelector('form');
    fireEvent.submit(form);

    expect(screen.getByText(/el nombre o entidad del préstamo es requerido/i)).toBeDefined();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits valid loan data and triggers onSave callback', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    const { container } = render(<CreateLoanModal isOpen={true} onSave={onSave} onClose={onClose} />);

    const nameInput = screen.getByLabelText(/nombre \/ entidad/i);
    fireEvent.change(nameInput, { target: { value: 'Hipoteca BBVA' } });

    const form = container.querySelector('form');
    fireEvent.submit(form);

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved.name).toBe('Hipoteca BBVA');
    expect(saved.principal).toBe(10000);
    expect(saved.monthlyPayment).toBe(332.14);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
