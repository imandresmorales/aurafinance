import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubscriptionManager from '../SubscriptionManager';

const mockTransactions = [
  { id: 'tx1', description: 'Netflix 4K', amount: 17.99, type: 'expense', date: '2026-01-10' },
  { id: 'tx2', description: 'Netflix 4K', amount: 17.99, type: 'expense', date: '2026-02-10' },
  { id: 'tx3', description: 'Netflix 4K', amount: 19.99, type: 'expense', date: '2026-03-10' },
];

vi.mock('../../../hooks', () => ({
  useAccounts: () => ({
    transactions: mockTransactions,
    wallets: [{ id: 'w1', name: 'Cuenta Principal', balance: 5000 }],
    subscriptions: [],
    baseCurrency: 'USD',
  }),
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('SubscriptionManager Component', () => {
  it('renders the header, KPI cards, and active subscriptions list', () => {
    render(<SubscriptionManager />);

    expect(screen.getByText('Gestor de Suscripciones Digitales')).toBeDefined();
    expect(screen.getByText('Detector & Auditor Financiero')).toBeDefined();
    expect(screen.getByText('Gasto Mensual Normalizado')).toBeDefined();
    expect(screen.getByText('Costo Anual Proyectado')).toBeDefined();
  });

  it('allows switching to the smart detection tab and displays detected subscriptions', () => {
    render(<SubscriptionManager />);

    const detTab = screen.getByRole('tab', { name: /Detección Inteligente/i });
    fireEvent.click(detTab);
    expect(detTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/Motor de Inteligencia de Pagos Periódicos/i)).toBeDefined();
  });

  it('opens and closes the new subscription modal', () => {
    render(<SubscriptionManager />);

    const openBtn = screen.getByRole('button', { name: /\+ Nueva Suscripción/i });
    fireEvent.click(openBtn);

    expect(screen.getByText('Añadir Nueva Suscripción')).toBeDefined();

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Añadir Nueva Suscripción')).toBeNull();
  });
});
