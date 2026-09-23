export * from './passwordEntropy';
export * from './rateLimiter';
export * from './sanitization';

// Formateador de divisas estándar internacional
export const formatCurrency = (amount, currency = 'USD', locale = 'es-ES') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};
