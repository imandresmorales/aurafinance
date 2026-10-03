import { describe, it, expect } from 'vitest';
import {
  createLinearScale,
  calculateNiceTicks,
  generateSmoothPath,
  generateSmoothAreaPath,
  calculateDonutSlices,
  calculateGroupedBars,
} from '../svgChartEngine';
import { generateRadarGeometry, calculateFinancialRadarScores } from '../financialRadarEngine';
import { calculateSankeyFlow } from '../sankeyEngine';
import { buildSpendingHeatmap } from '../spendingHeatmapEngine';
import { getDateRangeBounds, filterTransactionsByDateRange } from '../dateRangeEngine';

describe('Chart Suite Mathematical & Projection Precision Test Suite', () => {
  describe('Extreme & Boundary Geometry Scaling', () => {
    it('handles flat datasets (min === max) without division by zero', () => {
      const flatScale = createLinearScale([100, 100], [0, 500]);
      expect(flatScale(100)).toBe(250); // midpoint fallback
      expect(flatScale(50)).toBe(250);

      const ticks = calculateNiceTicks(50, 50, 5);
      expect(ticks).toEqual([50]);
    });

    it('generates valid Bezier paths for massive series (1000 points) without NaN or stack overflow', () => {
      const largePoints = Array.from({ length: 1000 }, (_, i) => ({
        x: i * 0.8,
        y: 150 + Math.sin(i * 0.05) * 50,
      }));

      const path = generateSmoothPath(largePoints);
      expect(path.startsWith('M 0.00,150.00')).toBe(true);
      expect(path).not.toContain('NaN');
      expect(path).not.toContain('Infinity');

      const area = generateSmoothAreaPath(largePoints, 300);
      expect(area.endsWith('L 0.00,300.00 Z')).toBe(true);
    });

    it('handles negative and zero values in Donut sector math safely', () => {
      const data = [
        { label: 'Positivo A', value: 100 },
        { label: 'Negativo (Filtrado)', value: -50 },
        { label: 'Cero (Ignorado)', value: 0 },
        { label: 'Positivo B', value: 300 },
      ];

      const slices = calculateDonutSlices(data, 100, 100, 40, 80);
      expect(slices).toHaveLength(2); // Only positive slices included
      expect(slices[0].percentage).toBe(25);
      expect(slices[1].percentage).toBe(75);
      expect(slices[0].percentage + slices[1].percentage).toBe(100);
    });
  });

  describe('Multi-Dimensional Radar & Sankey Mathematical Integrity', () => {
    it('ensures radar geometry vertex coordinates stay strictly within radius bounds', () => {
      const perfectScores = {
        liquidity: 100,
        diversification: 100,
        solvency: 100,
        savings: 100,
        debtControl: 100,
      };

      const geom = generateRadarGeometry(perfectScores, 150, 150, 100);
      geom.userVertices.forEach((v) => {
        const dx = v.x - 150;
        const dy = v.y - 150;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        expect(distFromCenter).toBeCloseTo(100, 1);
      });
    });

    it('preserves conservative mass balance across 3-stage Sankey node links', () => {
      const accounts = [{ id: 'a1', name: 'Cuenta Principal' }];
      const budgets = [{ id: 'b1', name: 'General' }];
      const transactions = [
        { id: '1', type: 'INCOME', category: 'Salario', accountId: 'a1', amount: 5000, date: '2026-07-01' },
        { id: '2', type: 'EXPENSE', category: 'Alimentación', accountId: 'a1', amount: 1500, date: '2026-07-05' },
        { id: '3', type: 'EXPENSE', category: 'Vivienda', accountId: 'a1', amount: 2000, date: '2026-07-10' },
      ];

      const sankey = calculateSankeyFlow(accounts, budgets, transactions, '2026-07');
      expect(sankey.totalIncome).toBe(5000);
      expect(sankey.totalExpense).toBe(3500);
      expect(sankey.netSavings).toBe(1500);

      // Invariant: Total Income = Total Expense + Net Savings
      expect(sankey.totalExpense + sankey.netSavings).toBe(sankey.totalIncome);
    });
  });

  describe('Temporal Bounds & Heatmap Aggregations', () => {
    it('correctly maps 24-hour timestamps into 4 standard behavioral quadrants', () => {
      const tx = [
        { id: '1', type: 'EXPENSE', amount: 100, date: '2026-07-06', time: '08:30' }, // Morning (Monday)
        { id: '2', type: 'EXPENSE', amount: 200, date: '2026-07-06', time: '14:00' }, // Afternoon
        { id: '3', type: 'EXPENSE', amount: 300, date: '2026-07-06', time: '20:00' }, // Evening
        { id: '4', type: 'EXPENSE', amount: 400, date: '2026-07-06', time: '02:00' }, // Night
      ];

      const heatmap = buildSpendingHeatmap(tx, '2026-07');
      const mondayRow = heatmap.matrix[0]; // Monday

      expect(mondayRow[0].totalAmount).toBe(100); // Morning
      expect(mondayRow[1].totalAmount).toBe(200); // Afternoon
      expect(mondayRow[2].totalAmount).toBe(300); // Evening
      expect(mondayRow[3].totalAmount).toBe(400); // Night
      expect(heatmap.grandTotalSpent).toBe(1000);
    });
  });
});
