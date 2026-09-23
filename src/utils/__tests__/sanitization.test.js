import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeObject, normalizeMoney, normalizeIsoDate } from '../sanitization';

describe('AuraFinance Sanitization & Financial Parsers', () => {
  it('debe limpiar scripts y etiquetas peligrosas contra XSS', () => {
    const dirty = '<script>alert("hack")</script>Hola & Mundo';
    const clean = sanitizeText(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('&lt;script&gt;');
  });

  it('debe sanitizar objetos anidados', () => {
    const dirtyObj = {
      concept: '<img src=x onerror=alert(1)>Comida',
      amount: 150,
      tags: ['<b>#Viaje</b>'],
    };

    const cleanObj = sanitizeObject(dirtyObj);
    expect(cleanObj.concept).toContain('&lt;img');
    expect(cleanObj.tags[0]).toContain('&lt;b&gt;');
  });

  it('debe normalizar diferentes formatos de dinero a números estándar', () => {
    expect(normalizeMoney('1,250.50')).toBe(1250.50);
    expect(normalizeMoney('$ 4,500.00')).toBe(4500.00);
    expect(normalizeMoney('1.500,25 €')).toBe(1500.25);
    expect(normalizeMoney(-340.75)).toBe(-340.75);
    expect(normalizeMoney('invalido', 0)).toBe(0);
  });

  it('debe normalizar fechas a formato ISO YYYY-MM-DD', () => {
    const date = normalizeIsoDate('2026-09-23');
    expect(date).toBe('2026-09-23');

    const fallback = normalizeIsoDate('fecha-invalida');
    expect(fallback).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
