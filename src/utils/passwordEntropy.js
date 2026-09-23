/**
 * Utilidad de cálculo de entropía y fortaleza de contraseñas para bóvedas financieras
 */
export function calculatePasswordEntropy(password) {
  if (!password) {
    return {
      score: 0,
      entropyBits: 0,
      label: 'Sin contraseña',
      color: '#64748b',
      suggestions: ['Introduce una frase de paso para evaluar su seguridad.'],
      isStrong: false,
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const length = password.length;
  // Entropía en bits = L * log2(poolSize)
  const entropyBits = poolSize > 0 ? Math.round(length * Math.log2(poolSize)) : 0;

  const suggestions = [];
  if (length < 12) suggestions.push('Usa al menos 12 caracteres (recomendado 16+ para bóvedas maestras).');
  if (!/[a-z]/.test(password)) suggestions.push('Incluye letras minúsculas.');
  if (!/[A-Z]/.test(password)) suggestions.push('Incluye letras mayúsculas.');
  if (!/[0-9]/.test(password)) suggestions.push('Incluye números.');
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Incluye símbolos especiales (!@#$%^&*).');

  let score = 0;
  let label = 'Muy Débil';
  let color = '#f43f5e';

  if (entropyBits >= 80 && length >= 12 && suggestions.length === 0) {
    score = 4;
    label = 'Grado Bancario (Excelente)';
    color = '#10b981';
  } else if (entropyBits >= 60 && length >= 10) {
    score = 3;
    label = 'Robusta';
    color = '#34d399';
  } else if (entropyBits >= 40 && length >= 8) {
    score = 2;
    label = 'Aceptable';
    color = '#e2c275';
  } else if (entropyBits >= 20) {
    score = 1;
    label = 'Débil';
    color = '#f59e0b';
  }

  return {
    score,
    entropyBits,
    label,
    color,
    suggestions,
    isStrong: score >= 3,
  };
}
