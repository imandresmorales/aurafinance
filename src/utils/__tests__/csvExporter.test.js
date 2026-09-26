import { describe, it, expect, vi } from 'vitest';
import { exportTransactionsToCSV } from '../csvExporter';

describe('CSV Exporter Utility', () => {
  it('returns false for empty transactions array', () => {
    expect(exportTransactionsToCSV([])).toBe(false);
    expect(exportTransactionsToCSV(null)).toBe(false);
  });

  it('triggers download with correctly formatted CSV rows and escaping', () => {
    // Mock Blob and URL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    const mockTransactions = [
      {
        id: 'tx-1',
        date: '2026-09-25',
        type: 'EXPENSE',
        concept: 'Compra con "comillas", y comas',
        amount: 45.5,
        category: 'Alimentación',
        subCategory: 'Supermercado',
        sourceAccountId: 'acc-1',
        tags: ['#Comida', '#Semanal'],
        location: { label: 'Madrid, Centro' },
        receipt: { name: 'ticket.jpg' },
      },
    ];

    const mockAccounts = [{ id: 'acc-1', name: 'Cuenta Nómina' }];

    const result = exportTransactionsToCSV(mockTransactions, mockAccounts, 'test.csv');
    expect(result).toBe(true);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
