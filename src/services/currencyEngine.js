import { normalizeMoney } from '../utils';

export const BASE_EXCHANGE_RATES_USD = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 154.2,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.89,
  MXN: 18.25,
  COP: 3950.0,
  ARS: 980.0,
  CLP: 935.0,
  BRL: 5.45,
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'AU$',
  CHF: 'CHF',
  MXN: 'Mex$',
  COP: 'COL$',
  ARS: 'ARS$',
  CLP: 'CLP$',
  BRL: 'R$',
};

const RATES_CACHE_KEY = 'aura_cached_exchange_rates';

/**
 * Obtiene los tipos de cambio actuales (desde caché local o valores base)
 */
export function getStoredExchangeRates() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validar si la caché tiene menos de 24 horas
      if (Date.now() - parsed.timestamp < 24 * 3600 * 1000) {
        return parsed.rates;
      }
    }
  } catch (e) {
    console.warn('Error leyendo caché de divisas:', e);
  }

  return BASE_EXCHANGE_RATES_USD;
}

/**
 * Guarda tipos de cambio en la caché local
 */
export function cacheExchangeRates(rates) {
  try {
    localStorage.setItem(
      RATES_CACHE_KEY,
      JSON.stringify({
        rates,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn('Error guardando caché de divisas:', e);
  }
}

/**
 * Calcula la tasa de cambio cruzada entre dos divisas cualesquiera
 */
export function getExchangeRate(fromCurrency = 'USD', toCurrency = 'USD', rates = BASE_EXCHANGE_RATES_USD) {
  const fromRate = rates[fromCurrency] || 1.0;
  const toRate = rates[toCurrency] || 1.0;

  return toRate / fromRate;
}

/**
 * Convierte un importe de una divisa a otra con precisión contable
 */
export function convertCurrency(amount, fromCurrency = 'USD', toCurrency = 'USD', customRates = null) {
  const rates = customRates || getStoredExchangeRates();
  const normAmount = normalizeMoney(amount);

  if (fromCurrency === toCurrency) {
    return normAmount;
  }

  const rate = getExchangeRate(fromCurrency, toCurrency, rates);
  return normalizeMoney(normAmount * rate);
}

/**
 * Retorna el símbolo de la moneda
 */
export function getCurrencySymbol(currencyCode) {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}
