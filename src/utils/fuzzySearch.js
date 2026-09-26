/**
 * Motor de búsqueda difusa (Fuzzy Search) y cálculo de relevancia.
 * Evalúa coincidencias de subcadenas, acrónimos y distancias entre caracteres.
 */

/**
 * Normaliza una cadena eliminando acentos/diacríticos y convirtiendo a minúsculas.
 */
export function normalizeSearchString(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Calcula un puntaje de coincidencia difusa (0 a 100).
 * Mayor puntaje = mayor relevancia y exactitud.
 */
export function calculateFuzzyScore(text, query) {
  if (!query) return 100;
  if (!text) return 0;

  const cleanText = normalizeSearchString(text);
  const cleanQuery = normalizeSearchString(query);

  if (cleanText === cleanQuery) return 100;
  if (cleanText.startsWith(cleanQuery)) return 90 + (cleanQuery.length / cleanText.length) * 10;
  if (cleanText.includes(cleanQuery)) return 75 + (cleanQuery.length / cleanText.length) * 15;

  // Evaluación difusa carácter por carácter
  let tIdx = 0;
  let qIdx = 0;
  let matches = 0;
  let consecutive = 0;
  let maxConsecutive = 0;

  while (tIdx < cleanText.length && qIdx < cleanQuery.length) {
    if (cleanText[tIdx] === cleanQuery[qIdx]) {
      matches++;
      consecutive++;
      if (consecutive > maxConsecutive) maxConsecutive = consecutive;
      qIdx++;
    } else {
      consecutive = 0;
    }
    tIdx++;
  }

  // Si no se encontraron todos los caracteres de la consulta en orden
  if (qIdx < cleanQuery.length) return 0;

  const coverageScore = (matches / cleanText.length) * 30;
  const consecutiveScore = (maxConsecutive / cleanQuery.length) * 40;
  return Math.min(Math.round(coverageScore + consecutiveScore), 70);
}

/**
 * Filtra y ordena un arreglo de objetos según coincidencia difusa en múltiples campos.
 */
export function fuzzyFilter(items, query, keys = []) {
  if (!query || !query.trim()) return items || [];
  if (!items || items.length === 0) return [];

  const cleanQuery = normalizeSearchString(query);

  const scoredItems = items
    .map((item) => {
      let maxScore = 0;

      for (const key of keys) {
        let val = '';
        if (typeof key === 'function') {
          val = key(item);
        } else if (Array.isArray(item[key])) {
          val = item[key].join(' ');
        } else if (typeof item[key] === 'object' && item[key] !== null) {
          val = Object.values(item[key]).filter((v) => typeof v === 'string').join(' ');
        } else {
          val = item[key] ? String(item[key]) : '';
        }

        const score = calculateFuzzyScore(val, cleanQuery);
        if (score > maxScore) maxScore = score;
      }

      return { item, score: maxScore };
    })
    .filter(({ score }) => score > 0);

  // Ordenar de mayor a menor relevancia
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.map(({ item }) => item);
}

/**
 * Descompone un texto en fragmentos marcando las coincidencias exactas/parciales para resaltado.
 */
export function splitForHighlight(text, query) {
  if (!text) return [{ text: '', isMatch: false }];
  if (!query || !query.trim()) return [{ text: String(text), isMatch: false }];

  const rawText = String(text);
  const cleanQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${cleanQuery})`, 'gi');

  const parts = rawText.split(regex);
  return parts.map((part) => ({
    text: part,
    isMatch: part.toLowerCase() === query.trim().toLowerCase(),
  }));
}
