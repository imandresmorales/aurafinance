// Central export hub for Math, Currency, and Formatting Utilities
export const formatCurrency = (amount, currency = 'USD', locale = 'es-ES') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};
