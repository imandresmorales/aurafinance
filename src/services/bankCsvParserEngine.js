/**
 * Bank Statement CSV Parser & Auto-Detector
 * Parsea e infiere automáticamente delimitadores, cabeceras y mapeos de columnas
 * (fecha, monto/importe, concepto/descripción, balance) desde archivos CSV bancarios.
 */

/**
 * Detecta el delimitador común en un archivo CSV (, ; \t |)
 * @param {string} text
 * @returns {string}
 */
export const detectCsvDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let bestDelimiter = ',';

  for (const delim of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
};

/**
 * Infiere el rol de las columnas analizando sus nombres y muestras
 * @param {string[]} headers
 * @returns {Record<string, number>}
 */
export const inferColumnMapping = (headers) => {
  const mapping = {
    date: -1,
    description: -1,
    amount: -1,
    type: -1,
    balance: -1,
  };

  headers.forEach((h, idx) => {
    const header = h.toLowerCase().trim();

    if (mapping.date === -1 && (header.includes('fecha') || header.includes('date') || header.includes('fec'))) {
      mapping.date = idx;
    } else if (
      mapping.amount === -1 &&
      (header.includes('monto') || header.includes('importe') || header.includes('amount') || header.includes('valor'))
    ) {
      mapping.amount = idx;
    } else if (
      mapping.description === -1 &&
      (header.includes('concepto') || header.includes('descripcion') || header.includes('detalle') || header.includes('memo'))
    ) {
      mapping.description = idx;
    } else if (
      mapping.balance === -1 &&
      (header.includes('saldo') || header.includes('balance'))
    ) {
      mapping.balance = idx;
    } else if (
      mapping.type === -1 &&
      (header.includes('tipo') || header.includes('type'))
    ) {
      mapping.type = idx;
    }
  });

  return mapping;
};

/**
 * Parsea el CSV completo usando un mapeo de columnas configurado o inferido
 * @param {string} csvText
 * @param {Record<string, number>} [customMapping]
 */
export const parseBankCsv = (csvText, customMapping) => {
  if (!csvText || typeof csvText !== 'string') return { rows: [], headers: [], delimiter: ',' };

  const delimiter = detectCsvDelimiter(csvText);
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return { rows: [], headers: [], delimiter };

  const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
  const mapping = customMapping || inferColumnMapping(headers);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawTokens = lines[i].split(delimiter).map((t) => t.replace(/^["']|["']$/g, '').trim());
    if (rawTokens.length < 2) continue;

    const rawAmount = mapping.amount !== -1 ? rawTokens[mapping.amount] : '0';
    // Normalizar importes con coma decimal europea o punto
    const cleanAmount = parseFloat(rawAmount.replace(/\s/g, '').replace(',', '.'));

    const parsedRow = {
      id: `csv_tx_${Date.now()}_${i}`,
      date: mapping.date !== -1 ? rawTokens[mapping.date] : new Date().toISOString().slice(0, 10),
      description: mapping.description !== -1 ? rawTokens[mapping.description] : 'Transacción Bancaria',
      amount: isNaN(cleanAmount) ? 0 : Math.abs(cleanAmount),
      type: cleanAmount < 0 ? 'EXPENSE' : 'INCOME',
      balance: mapping.balance !== -1 ? parseFloat(rawTokens[mapping.balance]) || 0 : undefined,
      raw: rawTokens,
    };

    rows.push(parsedRow);
  }

  return {
    headers,
    delimiter,
    mapping,
    rows,
    totalParsed: rows.length,
  };
};

export default parseBankCsv;
