import { describe, it, expect } from 'vitest';
import {
  calculateEmergencyFundMetrics,
  getLiquidEmergencyReserves,
  calculateEssentialMonthlyBurnRate,
  EMERGENCY_STATUS,
} from '../emergencyFundEngine';

describe('AuraFinance Emergency Fund Engine', () => {
  const sampleAccounts = [
    { id: 'a1', name: 'Banco Nómina', type: 'ASSET', category: 'BANK', initialBalance: 6000 },
    { id: 'a2', name: 'Efectivo', type: 'ASSET', category: 'CASH', initialBalance: 1200 },
    { id: 'a3', name: 'Inversión Indexada', type: 'ASSET', category: 'INVESTMENT', initialBalance: 50000 }, // Not included in liquid emergency
    { id: 'a4', name: 'Tarjeta Crédito', type: 'LIABILITY', category: 'CREDIT_CARD', initialBalance: -1500 },
  ];

  const sampleBalances = {
    a1: 6000,
    a2: 1200,
    a3: 50000,
    a4: -1500,
  };

  const sampleTransactions = [
    { id: 't1', type: 'EXPENSE', category: 'Vivienda & Servicios', amount: 800, date: '2026-09-01' },
    { id: 't2', type: 'EXPENSE', category: 'Alimentación', amount: 400, date: '2026-09-05' }, // Total Essential = 1200 / month
    { id: 't3', type: 'EXPENSE', category: 'Ocio & Cultura', amount: 500, date: '2026-09-10' }, // Wants (ignored for essential burn rate)
  ];

  it('debe filtrar exclusivamente cuentas líquidas para el fondo de emergencia', () => {
    const liquid = getLiquidEmergencyReserves(sampleAccounts, sampleBalances);
    expect(liquid.totalLiquid).toBe(7200); // 6000 + 1200
    expect(liquid.liquidAccounts.length).toBe(2);
  });

  it('debe calcular la tasa de gasto mensual esencial', () => {
    const burnRate = calculateEssentialMonthlyBurnRate(sampleTransactions);
    expect(burnRate).toBe(1200); // 800 + 400
  });

  it('debe calcular con precisión los meses de cobertura y progreso hacia la meta', () => {
    const metrics = calculateEmergencyFundMetrics(sampleAccounts, sampleBalances, sampleTransactions, 6);

    expect(metrics.totalLiquid).toBe(7200);
    expect(metrics.monthlyBurnRate).toBe(1200);
    expect(metrics.monthsCovered).toBe(6);
    expect(metrics.targetAmount).toBe(7200);
    expect(metrics.gapToTarget).toBe(0);
    expect(metrics.percentCompleted).toBe(100);
    expect(metrics.isTargetAchieved).toBe(true);
    expect(metrics.status).toBe(EMERGENCY_STATUS.ROBUST);
  });

  it('debe alertar cuando la cobertura es crítica o básica', () => {
    const lowBalances = { a1: 1000, a2: 200 };
    const metrics = calculateEmergencyFundMetrics(sampleAccounts, lowBalances, sampleTransactions, 6);

    expect(metrics.totalLiquid).toBe(1200);
    expect(metrics.monthsCovered).toBe(1);
    expect(metrics.status).toBe(EMERGENCY_STATUS.BASIC);
    expect(metrics.isTargetAchieved).toBe(false);
    expect(metrics.gapToTarget).toBe(6000); // 7200 - 1200
  });
});
