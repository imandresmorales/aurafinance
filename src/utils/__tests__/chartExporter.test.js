import { describe, it, expect } from 'vitest';
import { serializeSvgToString } from '../chartExporter';

describe('Chart Exporter Utility - Clean Vector Serialization', () => {
  it('serializes SVG DOM node with valid XML namespace and doctype', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '25');
    svg.appendChild(circle);

    const serialized = serializeSvgToString(svg);

    expect(serialized).toContain('<?xml version="1.0"');
    expect(serialized).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(serialized).toContain('<circle');
    expect(serialized).toContain('cx="50"');
  });

  it('handles null or undefined SVG gracefully', () => {
    expect(serializeSvgToString(null)).toBe('');
    expect(serializeSvgToString(undefined)).toBe('');
  });
});
