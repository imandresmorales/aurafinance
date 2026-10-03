import { describe, it, expect } from 'vitest';
import {
  calculateFinancialRadarScores,
  generateRadarGeometry,
} from '../financialRadarEngine';

describe('Financial Radar Engine - 5-Pillar Equilibrium', () => {
  const accounts = [
    { id: 'a1', name: 'Cuenta Principal', type: 'CHECKING', balance: 5000 },
    { id: 'a2', name: 'Bóveda Cripto', type: 'INVESTMENT', balance: 3000 },
    { id: 'a3', name: 'Tarjeta Crédito', type: 'CREDIT', balance: -500 },
  ];

  const transactions = [
    { id: 't1', type: 'INCOME', amount: 2500, date: '2026-03-01' },
    { id: 't2', type: 'EXPENSE', amount: 1200, date: '2026-03-05' },
  ];

  it('calculates realistic normalized scores for all 5 pillars', () => {
    const result = calculateFinancialRadarScores(accounts, [], transactions);

    expect(result.scores).toHaveProperty('liquidity');
    expect(result.scores).toHaveProperty('diversification');
    expect(result.scores).toHaveProperty('solvency');
    expect(result.scores).toHaveProperty('savings');
    expect(result.scores).toHaveProperty('debtControl');

    expect(result.globalIndex).toBeGreaterThan(0);
    expect(result.globalIndex).toBeLessThanOrEqual(100);
  });

  it('generates regular pentagon geometry and polygon paths', () => {
    const scores = {
      liquidity: 80,
      diversification: 60,
      solvency: 90,
      savings: 70,
      debtControl: 85,
    };

    const geom = generateRadarGeometry(scores, 150, 150, 100);

    expect(geom.userVertices).toHaveLength(5);
    expect(geom.gridLevels).toHaveLength(5);
    expect(geom.spokes).toHaveLength(5);
    expect(geom.userPolygonPath).toContain('M ');
    expect(geom.userPolygonPath).toContain('Z');
  });
});
