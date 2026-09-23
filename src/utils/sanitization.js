/**
 * Motor de sanitización de entradas contra inyecciones XSS y normalización monetaria
 */

/**
 * Escapa caracteres peligrosos en cadenas de texto para prevenir XSS
 * @param {string} str - Cadena a sanitizar
 * @returns {string}
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/**
 * Sanitiza recursivamente todas las cadenas de texto dentro de un objeto o array
 * @param {any} input
 * @returns {any}
 */
export function sanitizeObject(input) {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') return sanitizeText(input);
  if (typeof input !== 'object') return input;

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(input)) {
    const cleanKey = sanitizeText(key);
    result[cleanKey] = sanitizeObject(value);
  }
  return result;
}

/**
 * Normaliza y convierte entradas numéricas o monetarias a un número de coma flotante seguro con 2 decimales
 * Maneja símbolos de divisas, comas decimales europeas y espacios
 * @param {string|number} rawValue
 * @param {number} fallback
 * @returns {number}
 */
export function normalizeMoney(rawValue, fallback = 0) {
  if (typeof rawValue === 'number') {
    return isNaN(rawValue) ? fallback : Math.round((rawValue + Number.EPSILON) * 100) / 100;
  }

  if (typeof rawValue !== 'string') {
    return fallback;
  }

  // Limpiar texto, quitar símbolos de moneda y caracteres no numéricos excepto coma, punto y signo menos
  let cleaned = rawValue.replace(/[^0-9.,-]/g, '').trim();

  // Si contiene coma y punto (ej. 1,250.50 o 1.250,50), normalizar según posición
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.indexOf(',') < cleaned.indexOf('.')) {
      // Formato US: 1,250.50 -> 1250.50
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Formato Europeo: 1.250,50 -> 1250.50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleaned.includes(',')) {
    // Solo coma: 1250,50 -> 1250.50
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return fallback;

  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

/**
 * Valida y normaliza una fecha ISO (YYYY-MM-DD)
 * @param {string} dateStr
 * @returns {string}
 */
export function normalizeIsoDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date().toISOString().split('T')[0];
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return parsed.toISOString().split('T')[0];
}
