import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalProgressCard } from '../GoalProgressCard';

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    baseCurrency: 'USD',
  }),
}));

describe('GoalProgressCard Component', () => {
  const sampleGoal = {
    id: 'goal-1',
    name: 'Fondo de Emergencia 6M',
    targetAmount: 10000,
    currentAmount: 4000,
    monthlyContribution: 500,
    targetDate: '2027-01-01',
    category: 'EMERGENCY',
    priority: 'HIGH',
  };

  it('renders goal details, percentage and status badge', () => {
    render(<GoalProgressCard goal={sampleGoal} asOfDate="2026-01-01" />);

    expect(screen.getByTestId('goal-card-goal-1')).toBeDefined();
    expect(screen.getByText('Fondo de Emergencia 6M')).toBeDefined();
    expect(screen.getByText('40%')).toBeDefined();
    expect(screen.getByText(/Prioridad Alta/i)).toBeDefined();
    expect(screen.getByText(/En Plazo/i)).toBeDefined();
  });

  it('handles add funds and edit button clicks', () => {
    const onAddFunds = vi.fn();
    const onEdit = vi.fn();

    render(
      <GoalProgressCard
        goal={sampleGoal}
        onAddFunds={onAddFunds}
        onEdit={onEdit}
        asOfDate="2026-01-01"
      />
    );

    const addBtn = screen.getByRole('button', { name: /Aportar fondos/i });
    fireEvent.click(addBtn);
    expect(onAddFunds).toHaveBeenCalledWith(expect.objectContaining({ id: 'goal-1' }));

    const editBtn = screen.getByRole('button', { name: /Editar meta/i });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'goal-1' }));
  });

  it('renders completed celebration badge when target is reached', () => {
    const completedGoal = {
      ...sampleGoal,
      currentAmount: 10000,
    };

    render(<GoalProgressCard goal={completedGoal} asOfDate="2026-01-01" />);
    expect(screen.getByText(/¡Meta Cumplida!/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Aportar fondos/i })).toBeNull();
  });
});
