import { describe, it, expect } from 'vitest';
import {
  normalizeSearchString,
  calculateFuzzyScore,
  fuzzyFilter,
  splitForHighlight,
} from '../fuzzySearch';

describe('Fuzzy Search Engine', () => {
  it('normalizes diacritics and casing correctly', () => {
    expect(normalizeSearchString('Cafetería & Alimentación')).toBe('cafeteria & alimentacion');
    expect(normalizeSearchString('   HÓGAR  ')).toBe('hogar');
  });

  it('calculates fuzzy score with higher points for exact and prefix matches', () => {
    const exactScore = calculateFuzzyScore('Mercadona', 'Mercadona');
    const prefixScore = calculateFuzzyScore('Mercadona Express', 'Mercadona');
    const substringScore = calculateFuzzyScore('Supermercado Mercadona', 'Mercadona');
    const fuzzyCharScore = calculateFuzzyScore('Supermercado', 'sprmrcdo');
    const noMatchScore = calculateFuzzyScore('Alimentación', 'Software');

    expect(exactScore).toBe(100);
    expect(prefixScore).toBeGreaterThanOrEqual(90);
    expect(substringScore).toBeGreaterThanOrEqual(75);
    expect(fuzzyCharScore).toBeGreaterThan(0);
    expect(noMatchScore).toBe(0);
  });

  it('fuzzy filters and ranks items by relevance score', () => {
    const dataset = [
      { id: '1', concept: 'Suscripción Netflix 4K', category: 'Ocio' },
      { id: '2', concept: 'Supermercado Frutería', category: 'Alimentación' },
      { id: '3', concept: 'Netlify Cloud Hosting', category: 'Software' },
    ];

    const results = fuzzyFilter(dataset, 'Net', ['concept', 'category']);
    expect(results.length).toBe(2);
    // Should prioritize Netflix or Netlify based on match position
    expect(results.map((r) => r.id)).toContain('1');
    expect(results.map((r) => r.id)).toContain('3');
  });

  it('splits text for visual highlighting correctly', () => {
    const parts = splitForHighlight('Compra en Mercadona hoy', 'Mercadona');
    expect(parts.length).toBe(3);
    expect(parts[0]).toEqual({ text: 'Compra en ', isMatch: false });
    expect(parts[1]).toEqual({ text: 'Mercadona', isMatch: true });
    expect(parts[2]).toEqual({ text: ' hoy', isMatch: false });
  });
});
