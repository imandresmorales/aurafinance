import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalConfigModal from '../GoalConfigModal';

describe('GoalConfigModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(<GoalConfigModal isOpen={false} />);
    expect(screen.queryByTestId('goal-config-modal')).toBeNull();
  });

  it('renders correctly when open and populates default values', () => {
    render(<GoalConfigModal isOpen={true} />);

    expect(screen.getByTestId('goal-config-modal')).toBeDefined();
    expect(screen.getByText('Crear Nueva Meta de Ahorro')).toBeDefined();
    expect(screen.getByLabelText(/Nombre de la Meta/i)).toBeDefined();
    expect(screen.getByText('Previsualización en Vivo')).toBeDefined();
  });

  it('populates existing goal data when goalToEdit is passed', () => {
    const goalToEdit = {
      id: 'g-trip',
      name: 'Viaje a Japón',
      targetAmount: 6000,
      currentAmount: 3000,
      monthlyContribution: 500,
      targetDate: '2027-06-30',
      category: 'TRAVEL',
      priority: 'HIGH',
    };

    render(<GoalConfigModal isOpen={true} goalToEdit={goalToEdit} />);

    expect(screen.getByText('Editar Meta de Ahorro')).toBeDefined();
    const nameInput = screen.getByLabelText(/Nombre de la Meta/i);
    expect(nameInput.value).toBe('Viaje a Japón');
    expect(screen.getByText('50%')).toBeDefined(); // 3000 / 6000
  });

  it('handles form submission with validated data', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<GoalConfigModal isOpen={true} onSave={onSave} onClose={onClose} />);

    const nameInput = screen.getByLabelText(/Nombre de la Meta/i);
    fireEvent.change(nameInput, { target: { value: 'Fondo Libertad Financiera' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Meta/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Fondo Libertad Financiera',
        targetAmount: 5000,
      })
    );
  });

  it('calls onClose when clicking close or cancel button', () => {
    const onClose = vi.fn();
    render(<GoalConfigModal isOpen={true} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
