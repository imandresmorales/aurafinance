import { describe, it, expect } from 'vitest';
import {
  detectDuplicateTransactions,
  detectUnusualSpikes,
  scanLedgerAnomalies,
} from '../anomalyDetectionEngine';

describe('Anomaly and Duplicate Detection Engine', () => {
  it('detects duplicate transactions with exact amount, account and close dates', () => {
    const transactions = [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        sourceAccountId: 'acc-main',
        amount: 89.99,
        concept: 'Restaurante Asador Central',
        date: '2026-09-20',
      },
      {
        id: 'tx-2',
        type: 'EXPENSE',
        sourceAccountId: 'acc-main',
        amount: 89.99,
        concept: 'Restaurante Asador Central',
        date: '2026-09-20',
      },
      {
        id: 'tx-3',
        type: 'EXPENSE',
        sourceAccountId: 'acc-main',
        amount: 25.0,
        concept: 'Farmacia',
        date: '2026-09-20',
      },
    ];

    const duplicates = detectDuplicateTransactions(transactions);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].primaryTx.id).toBe('tx-1');
    expect(duplicates[0].candidates[0].duplicateTx.id).toBe('tx-2');
    expect(duplicates[0].candidates[0].confidence).toBe('HIGH');
  });

  it('detects unusual high spikes relative to category average', () => {
    const transactions = [
      { id: '1', type: 'EXPENSE', category: 'Alimentación', amount: 30 },
      { id: '2', type: 'EXPENSE', category: 'Alimentación', amount: 35 },
      { id: '3', type: 'EXPENSE', category: 'Alimentación', amount: 25 },
      { id: '4', type: 'EXPENSE', category: 'Alimentación', amount: 300 }, // Outlier: 10x average
    ];

    const outliers = detectUnusualSpikes(transactions, 3);
    expect(outliers.length).toBe(1);
    expect(outliers[0].tx.id).toBe('4');
    expect(outliers[0].factor).toBeGreaterThanOrEqual(3);
  });

  it('runs complete ledger anomaly scanner and reports clean status when no issues exist', () => {
    const cleanTxs = [
      { id: '1', type: 'EXPENSE', category: 'General', amount: 10, sourceAccountId: 'acc-1', date: '2026-09-01' },
      { id: '2', type: 'EXPENSE', category: 'General', amount: 20, sourceAccountId: 'acc-1', date: '2026-09-10' },
    ];

    const report = scanLedgerAnomalies(cleanTxs);
    expect(report.hasAnomalies).toBe(false);
    expect(report.totalWarnings).toBe(0);
  });
});
