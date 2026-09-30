import { describe, it, expect } from 'vitest';
import {
  calculateDynamicVariableBudget,
  calculateIncomeSmoothingBuffer,
  BUDGET_TIERS,
} from '../variableIncomeBudgetEngine';

describe('AuraFinance Variable Income Budget Engine', () => {
  it('debe priorizar el Nivel 1 (Supervivencia) cuando los ingresos son reducidos', () => {
    // Survival requires 1200 + 450 + 150 = 1800
    const result = calculateDynamicVariableBudget(1200);

    expect(result.activeTier).toBe(BUDGET_TIERS.TIER_1_SURVIVAL);
    expect(result.totalAllocated).toBe(1200);
    expect(result.tierBreakdown.tier1.isFullyFunded).toBe(false);
    expect(result.tierBreakdown.tier2.total).toBe(0);
    expect(result.tierBreakdown.tier3.total).toBe(0);
  });

  it('debe fondear completamente Nivel 1 y parcialmente Nivel 2 en ingresos moderados', () => {
    // Survival = 1800, Comfort = 650 => Total for Tier 1 + 2 = 2450
    const result = calculateDynamicVariableBudget(2100);

    expect(result.activeTier).toBe(BUDGET_TIERS.TIER_2_COMFORT);
    expect(result.tierBreakdown.tier1.isFullyFunded).toBe(true);
    expect(result.tierBreakdown.tier1.total).toBe(1800);
    expect(result.tierBreakdown.tier2.total).toBe(300); // 2100 - 1800
    expect(result.tierBreakdown.tier2.isFullyFunded).toBe(false);
    expect(result.tierBreakdown.tier3.total).toBe(0);
  });

  it('debe activar el Nivel 3 (Crecimiento e Inversión) ante excedentes extraordinarios', () => {
    // Survival = 1800, Comfort = 650 => 2450. Income = 4000 => 1550 to Tier 3
    const result = calculateDynamicVariableBudget(4000);

    expect(result.activeTier).toBe(BUDGET_TIERS.TIER_3_GROWTH);
    expect(result.tierBreakdown.tier1.isFullyFunded).toBe(true);
    expect(result.tierBreakdown.tier2.isFullyFunded).toBe(true);
    expect(result.tierBreakdown.tier3.total).toBe(1550);
  });

  it('debe calcular el cojín de retención según la volatilidad histórica de ingresos', () => {
    const stableHistory = [3000, 3100, 2900, 3050];
    const stableResult = calculateIncomeSmoothingBuffer(stableHistory, 2000);
    expect(stableResult.volatilityIndex).toBe('LOW');
    expect(stableResult.recommendedMonths).toBe(3);
    expect(stableResult.recommendedBuffer).toBe(6000);

    const volatileHistory = [1000, 6000, 1200, 5500, 800];
    const volatileResult = calculateIncomeSmoothingBuffer(volatileHistory, 2000);
    expect(volatileResult.volatilityIndex).toBe('HIGH');
    expect(volatileResult.recommendedMonths).toBe(6);
    expect(volatileResult.recommendedBuffer).toBe(12000);
  });
});
