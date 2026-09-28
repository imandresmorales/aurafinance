import { describe, it, expect } from 'vitest';
import {
  calculateRule502030,
  getCategoryPillar,
  PILLAR_TYPES,
} from '../rule502030Engine';

describe('AuraFinance 50/30/20 Rule Engine', () => {
  it('debe mapear categorías a los tres pilares adecuadamente', () => {
    expect(getCategoryPillar('Vivienda & Servicios')).toBe(PILLAR_TYPES.NEEDS);
    expect(getCategoryPillar('Alimentación')).toBe(PILLAR_TYPES.NEEDS);
    expect(getCategoryPillar('Ocio & Cultura')).toBe(PILLAR_TYPES.WANTS);
    expect(getCategoryPillar('Restaurantes')).toBe(PILLAR_TYPES.WANTS);
    expect(getCategoryPillar('Inversión & Ahorro')).toBe(PILLAR_TYPES.SAVINGS);
  });

  it('debe calcular la distribución y desviaciones exactas respecto a los ingresos', () => {
    const transactions = [
      { id: 't1', type: 'EXPENSE', category: 'Vivienda & Servicios', amount: 1500 }, // Needs
      { id: 't2', type: 'EXPENSE', category: 'Alimentación', amount: 500 },          // Needs (Total Needs = 2000 => 50%)
      { id: 't3', type: 'EXPENSE', category: 'Ocio & Cultura', amount: 1200 },       // Wants (Total Wants = 1200 => 30%)
      { id: 't4', type: 'EXPENSE', category: 'Inversión & Ahorro', amount: 800 },    // Savings (Total Savings = 800 => 20%)
    ];

    const result = calculateRule502030(transactions, 4000);

    expect(result.monthlyIncome).toBe(4000);
    expect(result.pillars.needs.spent).toBe(2000);
    expect(result.pillars.needs.percentage).toBe(50);
    expect(result.pillars.needs.isCompliant).toBe(true);

    expect(result.pillars.wants.spent).toBe(1200);
    expect(result.pillars.wants.percentage).toBe(30);
    expect(result.pillars.wants.isCompliant).toBe(true);

    expect(result.pillars.savings.spent).toBe(800);
    expect(result.pillars.savings.percentage).toBe(20);
    expect(result.pillars.savings.isCompliant).toBe(true);

    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('debe alertar cuando los gastos en deseos o necesidades exceden las proporciones recomendadas', () => {
    const transactions = [
      { id: 't1', type: 'EXPENSE', category: 'Vivienda & Servicios', amount: 2500 }, // Needs = 2500 => 62.5% (>50%)
      { id: 't2', type: 'EXPENSE', category: 'Ocio & Cultura', amount: 1400 },       // Wants = 1400 => 35% (>30%)
      { id: 't3', type: 'EXPENSE', category: 'Inversión & Ahorro', amount: 100 },    // Savings = 100 => 2.5% (<20%)
    ];

    const result = calculateRule502030(transactions, 4000);
    expect(result.pillars.needs.isCompliant).toBe(false);
    expect(result.pillars.wants.isCompliant).toBe(false);
    expect(result.pillars.savings.isCompliant).toBe(false);
    expect(result.recommendations.length).toBe(3);
  });
});
