import { describe, it, expect } from 'vitest';
import { calculateSankeyFlow } from '../sankeyEngine';

describe('Sankey Money Flow Engine - Vector Geometry', () => {
  const accounts = [
    { id: 'acc1', name: 'Banco Santander' },
    { id: 'acc2', name: 'Bóveda Cripto' },
  ];

  const budgets = [
    { id: 'b1', name: 'Alimentación' },
    { id: 'b2', name: 'Vivienda' },
  ];

  const transactions = [
    { id: 't1', type: 'INCOME', category: 'Salario Tech', accountId: 'acc1', amount: 3000, date: '2026-03-05' },
    { id: 't2', type: 'EXPENSE', category: 'Vivienda', accountId: 'acc1', amount: 1000, date: '2026-03-10' },
    { id: 't3', type: 'EXPENSE', category: 'Alimentación', accountId: 'acc1', amount: 500, date: '2026-03-12' },
  ];

  it('correctly builds 3-stage Sankey nodes and ribbons', () => {
    const flow = calculateSankeyFlow(accounts, budgets, transactions, '2026-03');

    expect(flow.totalIncome).toBe(3000);
    expect(flow.totalExpense).toBe(1500);
    expect(flow.netSavings).toBe(1500);
    expect(flow.nodes.length).toBeGreaterThanOrEqual(4);
    expect(flow.links.length).toBeGreaterThanOrEqual(2);

    const firstLink = flow.links[0];
    expect(firstLink.path).toContain('M ');
    expect(firstLink.path).toContain('C ');
    expect(firstLink.path).toContain('Z');
  });

  it('handles empty periods gracefully with placeholder node structures', () => {
    const flow = calculateSankeyFlow(accounts, budgets, [], '2026-04');

    expect(flow.totalIncome).toBe(0);
    expect(flow.nodes.length).toBeGreaterThanOrEqual(3);
    expect(flow.links.length).toBeGreaterThan(0);
  });
});
