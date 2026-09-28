import { describe, it, expect } from 'vitest';
import { suggestCategory } from '../autoCategorizationEngine';

describe('AuraFinance Auto-Categorization Engine', () => {
  it('debe detectar supermercados y alimentación a partir del concepto', () => {
    const result1 = suggestCategory('Compra en MERCADONA S.A.');
    expect(result1).not.toBeNull();
    expect(result1.category).toBe('Alimentación');
    expect(result1.subCategory).toBe('Supermercado');

    const result2 = suggestCategory('Walmart Supercenter #421');
    expect(result2.category).toBe('Alimentación');

    const result3 = suggestCategory('Cena en Pizzeria Napolitana');
    expect(result3.category).toBe('Alimentación');
    expect(result3.subCategory).toBe('Restaurantes & Cenas');
  });

  it('debe categorizar transporte, servicios y entretenimiento', () => {
    const uber = suggestCategory('Viaje Uber Trip 4893');
    expect(uber.category).toBe('Transporte & Movilidad');

    const netflix = suggestCategory('Suscripción Netflix Mensual');
    expect(netflix.category).toBe('Ocio & Cultura');
    expect(netflix.subCategory).toBe('Streaming & Entretenimiento');

    const aws = suggestCategory('AWS Cloud Services Invoice 92837');
    expect(aws.category).toBe('Software & Cloud');

    const luz = suggestCategory('Recibo de Electricidad Iberdrola');
    expect(luz.category).toBe('Vivienda & Servicios');
  });

  it('debe priorizar las reglas personalizadas del usuario sobre el diccionario predeterminado', () => {
    const customRules = [
      {
        pattern: 'mi cafeteria favorita',
        category: 'Ocio & Cultura',
        subCategory: 'Salidas Especiales',
      },
    ];

    const result = suggestCategory('Gasto en Mi Cafeteria Favorita centro', customRules);
    expect(result.source).toBe('CUSTOM_RULE');
    expect(result.category).toBe('Ocio & Cultura');
    expect(result.subCategory).toBe('Salidas Especiales');
    expect(result.confidence).toBe(1.0);
  });

  it('debe retornar null para conceptos no reconocibles', () => {
    const result = suggestCategory('XYZ987123 Inclasificable 543');
    expect(result).toBeNull();
  });
});
