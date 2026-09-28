import { describe, it, expect } from 'vitest';
import {
  calculateEnvelopeExecution,
  reallocateEnvelopeFunds,
  calculateZeroBasedBudgetSummary,
  ENVELOPE_STATUS,
} from '../envelopeBudgetEngine';

describe('AuraFinance Envelope Budgeting Engine', () => {
  const sampleEnvelopes = [
    { id: 'env-1', name: 'Alimentación', category: 'Alimentación', allocated: 500 },
    { id: 'env-2', name: 'Vivienda', category: 'Vivienda & Servicios', allocated: 1200 },
    { id: 'env-3', name: 'Ocio', category: 'Ocio & Cultura', allocated: 200 },
  ];

  const sampleTransactions = [
    { id: 't1', type: 'EXPENSE', category: 'Alimentación', amount: 350, date: '2026-09-05' },
    { id: 't2', type: 'EXPENSE', category: 'Alimentación', amount: 200, date: '2026-09-12' }, // Total Alimentación: 550 (Overbudget)
    { id: 't3', type: 'EXPENSE', category: 'Vivienda & Servicios', amount: 1000, date: '2026-09-01' }, // 1000 / 1200 (Warning >75%)
    { id: 't4', type: 'EXPENSE', category: 'Ocio & Cultura', amount: 50, date: '2026-09-15' }, // 50 / 200 (OK)
    { id: 't5', type: 'EXPENSE', category: 'Alimentación', amount: 100, date: '2026-09-20', deleted: true }, // Ignored soft-deleted
    { id: 't6', type: 'INCOME', category: 'Ingresos Profesionales', amount: 3000, date: '2026-09-01' }, // Ignored income
  ];

  it('debe calcular con exactitud el gasto ejecutado, remanente y estados de cada sobre', () => {
    const result = calculateEnvelopeExecution(sampleEnvelopes, sampleTransactions, '2026-09');

    expect(result.summary.totalAllocated).toBe(1900);
    expect(result.summary.totalSpent).toBe(1600);
    expect(result.summary.totalRemaining).toBe(300);
    expect(result.summary.overbudgetCount).toBe(1);
    expect(result.summary.totalOverbudgetAmount).toBe(50);

    const envAlim = result.envelopes.find((e) => e.id === 'env-1');
    expect(envAlim.spent).toBe(550);
    expect(envAlim.remaining).toBe(-50);
    expect(envAlim.status).toBe(ENVELOPE_STATUS.OVERBUDGET);

    const envViv = result.envelopes.find((e) => e.id === 'env-2');
    expect(envViv.spent).toBe(1000);
    expect(envViv.percentSpent).toBe(83.33);
    expect(envViv.status).toBe(ENVELOPE_STATUS.WARNING);

    const envOcio = result.envelopes.find((e) => e.id === 'env-3');
    expect(envOcio.spent).toBe(50);
    expect(envOcio.status).toBe(ENVELOPE_STATUS.OK);
  });

  it('debe reasignar fondos entre sobres manteniendo constante el total asignado', () => {
    const updated = reallocateEnvelopeFunds(sampleEnvelopes, 'env-2', 'env-1', 100);

    const envViv = updated.find((e) => e.id === 'env-2');
    const envAlim = updated.find((e) => e.id === 'env-1');

    expect(envViv.allocated).toBe(1100);
    expect(envAlim.allocated).toBe(600);

    const sumBefore = sampleEnvelopes.reduce((s, e) => s + e.allocated, 0);
    const sumAfter = updated.reduce((s, e) => s + e.allocated, 0);
    expect(sumBefore).toBe(sumAfter);
  });

  it('debe rechazar reasignaciones inválidas o con fondos insuficientes', () => {
    expect(() => reallocateEnvelopeFunds(sampleEnvelopes, 'env-3', 'env-1', 500)).toThrow();
    expect(() => reallocateEnvelopeFunds(sampleEnvelopes, 'env-1', 'env-1', 50)).toThrow();
  });

  it('debe calcular el resumen de presupuesto Base Cero correctamente', () => {
    const balanced = calculateZeroBasedBudgetSummary(1900, sampleEnvelopes);
    expect(balanced.isZeroBalanced).toBe(true);
    expect(balanced.unallocatedFunds).toBe(0);

    const surplus = calculateZeroBasedBudgetSummary(2500, sampleEnvelopes);
    expect(surplus.isZeroBalanced).toBe(false);
    expect(surplus.unallocatedFunds).toBe(600);

    const deficit = calculateZeroBasedBudgetSummary(1500, sampleEnvelopes);
    expect(deficit.isZeroBalanced).toBe(false);
    expect(deficit.unallocatedFunds).toBe(-400);
  });
});
