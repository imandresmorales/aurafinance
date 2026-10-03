import { describe, it, expect } from 'vitest';
import {
  ACCESSIBLE_PATTERNS,
  getSvgPatternDefinitions,
  getPatternIdByIndex,
} from '../chartPatterns';

describe('Chart Patterns Engine - Colorblind & High Contrast Accessibility', () => {
  it('defines 6 distinct accessible patterns', () => {
    expect(ACCESSIBLE_PATTERNS).toHaveLength(6);
    expect(ACCESSIBLE_PATTERNS.map((p) => p.id)).toContain('pat-stripes-diag');
    expect(ACCESSIBLE_PATTERNS.map((p) => p.id)).toContain('pat-dots');
  });

  it('generates SVG pattern descriptors with valid geometry', () => {
    const defs = getSvgPatternDefinitions('#ffffff');
    expect(defs).toHaveLength(6);

    const dots = defs.find((d) => d.id === 'pat-dots');
    expect(dots).toHaveProperty('circle');
    expect(dots.circle.fill).toBe('#ffffff');

    const stripes = defs.find((d) => d.id === 'pat-stripes-diag');
    expect(stripes).toHaveProperty('path');
    expect(stripes.path).toContain('M');
  });

  it('rotates pattern IDs cyclically for arbitrary dataset lengths', () => {
    expect(getPatternIdByIndex(0)).toBe('pat-stripes-diag');
    expect(getPatternIdByIndex(6)).toBe('pat-stripes-diag');
    expect(getPatternIdByIndex(1)).toBe('pat-dots');
  });
});
