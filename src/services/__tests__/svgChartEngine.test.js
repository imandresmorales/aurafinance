import { describe, it, expect } from 'vitest';
import {
  createLinearScale,
  calculateNiceTicks,
  generateSmoothPath,
  generateSmoothAreaPath,
  calculateDonutSlices,
  calculateGroupedBars,
} from '../svgChartEngine';

describe('SVG Chart Engine - Vector Geometry & Mathematical Precision', () => {
  it('creates accurate linear scales with boundary clamping', () => {
    const scale = createLinearScale([0, 100], [0, 500]);
    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(250);
    expect(scale(100)).toBe(500);

    const clampedScale = createLinearScale([0, 100], [0, 500], true);
    expect(clampedScale(150)).toBe(500);
    expect(clampedScale(-20)).toBe(0);
  });

  it('calculates clean and rounded ticks across various numeric ranges', () => {
    const ticks = calculateNiceTicks(0, 95, 5);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(95);
  });

  it('generates smooth cubic Bezier spline SVG path', () => {
    const points = [
      { x: 0, y: 100 },
      { x: 50, y: 20 },
      { x: 100, y: 80 },
    ];
    const path = generateSmoothPath(points);

    expect(path).toContain('M 0.00,100.00');
    expect(path).toContain('C ');
    expect(path).toContain('100.00,80.00');
  });

  it('generates closed smooth area path for gradients', () => {
    const points = [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ];
    const area = generateSmoothAreaPath(points, 200);

    expect(area).toContain('M 0.00,50.00');
    expect(area).toContain('L 100.00,200.00');
    expect(area).toContain('L 0.00,200.00 Z');
  });

  it('calculates donut sector geometry with centroids and percentages', () => {
    const data = [
      { label: 'Vivienda', value: 500, color: '#10b981' },
      { label: 'Comida', value: 500, color: '#3b82f6' },
    ];

    const slices = calculateDonutSlices(data, 100, 100, 40, 80);
    expect(slices).toHaveLength(2);
    expect(slices[0].percentage).toBe(50);
    expect(slices[1].percentage).toBe(50);
    expect(slices[0].path).toContain('M ');
    expect(slices[0].path).toContain('A 80,80');
    expect(slices[0].centroid).toHaveProperty('x');
    expect(slices[0].centroid).toHaveProperty('y');
  });

  it('computes grouped bar layouts with correct proportions', () => {
    const data = [
      {
        group: 'Enero',
        values: [
          { key: 'income', value: 1000, color: '#10b981' },
          { key: 'expense', value: 600, color: '#ef4444' },
        ],
      },
      {
        group: 'Febrero',
        values: [
          { key: 'income', value: 1200, color: '#10b981' },
          { key: 'expense', value: 800, color: '#ef4444' },
        ],
      },
    ];

    const layout = calculateGroupedBars(data, 400, 200);
    expect(layout.groups).toHaveLength(2);
    expect(layout.groups[0].bars).toHaveLength(2);
    expect(layout.groups[0].bars[0].height).toBeGreaterThan(0);
    expect(layout.groups[0].bars[0].width).toBeGreaterThan(0);
  });
});
