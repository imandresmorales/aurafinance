import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DebtManagementCenter } from '../DebtManagementCenter';

describe('DebtManagementCenter Component', () => {
  it('renders header, KPI cards, and default inventory tab', () => {
    render(<DebtManagementCenter />);

    expect(screen.getByText('Gestión Integral de Pasivos')).toBeDefined();
    expect(screen.getByText('Centro de Control y Amortización de Deudas')).toBeDefined();
    expect(screen.getByText('Saldo Total Adeudado')).toBeDefined();
    expect(screen.getByText('Tasa Media Ponderada (APR)')).toBeDefined();
    expect(screen.getByText('Compromiso Mensual Mínimo')).toBeDefined();
    expect(screen.getByText('Ratio de Endeudamiento (DTI)')).toBeDefined();

    // Default inventory tab has loans
    expect(screen.getByText('Tarjeta Santander Infinite')).toBeDefined();
    expect(screen.getByText('Crédito Vehículo Mazda')).toBeDefined();
  });

  it('switches between tabs (Inventory, Strategies, Planner, Amortization)', () => {
    render(<DebtManagementCenter />);

    // Click Strategies tab
    const strategiesTab = screen.getByRole('tab', { name: /comparativa de estrategias/i });
    fireEvent.click(strategiesTab);
    expect(screen.getByText('Estrategia Avalancha')).toBeDefined();
    expect(screen.getByText('Estrategia Bola de Nieve')).toBeDefined();

    // Click Planner tab
    const plannerTab = screen.getByRole('tab', { name: /planificador cero deuda/i });
    fireEvent.click(plannerTab);
    expect(screen.getByText('Tu Día de Libertad Financiera')).toBeDefined();

    // Click Amortization tab
    const amortTab = screen.getByRole('tab', { name: /tablas de amortización/i });
    fireEvent.click(amortTab);
    expect(screen.getByText(/cronograma de amortización/i)).toBeDefined();
    expect(screen.getByText('Amortización Capital')).toBeDefined();
  });

  it('opens and closes the CreateLoanModal', () => {
    render(<DebtManagementCenter />);

    const addBtn = screen.getByRole('button', { name: /\+ registrar préstamo \/ tarjeta/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: /nuevo préstamo o deuda/i })).toBeDefined();

    const closeBtn = screen.getByLabelText(/cerrar modal/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('deletes a debt when clicking the delete button', () => {
    render(<DebtManagementCenter />);

    const deleteBtn = screen.getByLabelText(/eliminar tarjeta santander infinite/i);
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('Tarjeta Santander Infinite')).toBeNull();
  });
});
