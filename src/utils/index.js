export * from './passwordEntropy';
export * from './rateLimiter';
export * from './sanitization';
export * from './csvExporter';
export * from './fuzzySearch';
export * from './chartExporter';

// Formateador de divisas estándar internacional
export const formatCurrency = (amount, currency = 'USD', locale = 'es-ES') => {
  const safeCurrency = typeof currency === 'string' && currency.length === 3 ? currency : 'USD';
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: safeCurrency,
  }).format(safeAmount);
};
