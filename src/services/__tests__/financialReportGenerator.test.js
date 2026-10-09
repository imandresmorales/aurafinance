import { describe, it, expect } from 'vitest';
import { generateFinancialReport } from '../financialReportGenerator';

describe('financialReportGenerator', () => {
  const sampleData = {
    userProfile: {
      name: 'Alex Morales',
      baseCurrency: 'USD',
    },
    healthScore: {
      totalScore: 88,
      tierLabel: 'Fortaleza Financiera AAA',
    },
    netWorth: {
      netWorth: 45000,
      totalAssets: 50000,
      totalLiabilities: 5000,
    },
    goalsSummary: {
      totalGoalsCount: 3,
      totalSaved: 12000,
      totalTarget: 25000,
    },
    fireMetrics: {
      yearsToFire: 8,
      targets: {
        standardFire: { number: 750000 },
      },
    },
    recommendations: [
      { title: 'Optimizar Sobres', text: 'Revisa gastos de ocio' },
      { title: 'Inversión Indexada', text: 'Mantén aportes constantes' },
    ],
  };

  it('generates report metadata and summary correctly', () => {
    const report = generateFinancialReport(sampleData, { asOfDate: '2026-10-08' });

    expect(report.metadata.userName).toBe('Alex Morales');
    expect(report.metadata.generatedAt).toBe('2026-10-08');
    expect(report.summary.healthScore).toBe(88);
    expect(report.summary.netWorthTotal).toBe(45000);
    expect(report.summary.fireYears).toBe(8);
  });

  it('generates rich markdown with all sections', () => {
    const report = generateFinancialReport(sampleData);

    expect(report.markdown).toContain('# 🏛️ Informe de Diagnóstico y Plan Financiero');
    expect(report.markdown).toContain('Alex Morales');
    expect(report.markdown).toContain('88 / 100');
    expect(report.markdown).toContain('$45,000.00');
    expect(report.markdown).toContain('8 años');
    expect(report.markdown).toContain('Optimizar Sobres');
  });

  it('generates standalone valid HTML with embedded CSS styling', () => {
    const report = generateFinancialReport(sampleData);

    expect(report.html).toContain('<!DOCTYPE html>');
    expect(report.html).toContain('<html lang="es">');
    expect(report.html).toContain('AuraFinance — Informe de Diagnóstico y Plan Financiero');
    expect(report.html).toContain('Fortaleza Financiera AAA');
    expect(report.html).toContain('88/100');
    expect(report.html).toContain('</html>');
  });

  it('handles empty data gracefully with fallback defaults', () => {
    const report = generateFinancialReport({});

    expect(report.metadata.userName).toBe('Usuario');
    expect(report.summary.healthScore).toBe(75);
    expect(report.markdown).toBeDefined();
    expect(report.html).toBeDefined();
  });
});
