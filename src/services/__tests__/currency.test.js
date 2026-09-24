import { describe, it, expect } from 'vitest';
import {
  convertCurrency,
  getExchangeRate,
  getCurrencySymbol,
  BASE_EXCHANGE_RATES_USD,
} from '../currencyEngine';

describe('AuraFinance Multi-Currency Conversion Engine', () => {
  it('debe mantener el mismo importe si la divisa origen y destino son iguales', () => {
    expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
    expect(convertCurrency(50.25, 'EUR', 'EUR')).toBe(50.25);
  });

  it('debe calcular tipos de cambio cruzados con respecto a USD', () => {
    // USD a EUR: 1 USD = 0.92 EUR
    const rateUsdEur = getExchangeRate('USD', 'EUR', BASE_EXCHANGE_RATES_USD);
    expect(rateUsdEur).toBe(0.92);

    // 100 USD = 92 EUR
    const converted = convertCurrency(100, 'USD', 'EUR', BASE_EXCHANGE_RATES_USD);
    expect(converted).toBe(92);
  });

  it('debe convertir correctamente entre divisas no-USD (EUR a GBP)', () => {
    // 100 EUR convertidos a GBP
    // Rate = 0.78 / 0.92 = 0.847826...
    const converted = convertCurrency(100, 'EUR', 'GBP', BASE_EXCHANGE_RATES_USD);
    expect(converted).toBeCloseTo(84.78, 2);
  });

  it('debe retornar símbolos adecuados para las monedas soportadas', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('GBP')).toBe('£');
  });
});
