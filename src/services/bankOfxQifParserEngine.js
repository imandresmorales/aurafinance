/**
 * OFX & QIF Universal Local Parser
 * Parsea extractos bancarios estándar Open Financial Exchange (OFX)
 * y Quicken Interchange Format (QIF) directamente en el navegador.
 */

/**
 * Parsea un archivo de texto en formato OFX (SGML o XML)
 * @param {string} ofxText
 */
export const parseOFX = (ofxText) => {
  if (!ofxText || typeof ofxText !== 'string') return [];

  const transactions = [];

  // Extraer bloques <STMTTRN>...</STMTTRN>
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = trnRegex.exec(ofxText)) !== null) {
    const block = match[1];

    const getTagValue = (tag) => {
      const tagRegex = new RegExp(`<${tag}>([^<\r\n]+)`, 'i');
      const found = block.match(tagRegex);
      return found ? found[1].trim() : '';
    };

    const trnType = getTagValue('TRNTYPE');
    const dtPosted = getTagValue('DTPOSTED');
    const trnAmt = parseFloat(getTagValue('TRNAMT')) || 0;
    const fitId = getTagValue('FITID') || `ofx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const name = getTagValue('NAME') || getTagValue('MEMO') || 'Transacción OFX';
    const memo = getTagValue('MEMO');

    // Parsear fecha OFX (formato YYYYMMDD o YYYYMMDDHHMMSS)
    let formattedDate = new Date().toISOString().slice(0, 10);
    if (dtPosted && dtPosted.length >= 8) {
      formattedDate = `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`;
    }

    transactions.push({
      id: fitId,
      date: formattedDate,
      description: name,
      memo,
      amount: Math.abs(trnAmt),
      type: trnAmt < 0 ? 'EXPENSE' : 'INCOME',
      rawType: trnType,
    });
  }

  return transactions;
};

/**
 * Parsea un archivo de texto en formato QIF (Quicken)
 * Registros comienzan con !Type y finalizan con ^
 * @param {string} qifText
 */
export const parseQIF = (qifText) => {
  if (!qifText || typeof qifText !== 'string') return [];

  const transactions = [];
  const lines = qifText.split(/\r?\n/);
  let currentTx = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('!Type:')) {
      continue;
    }

    if (line === '^') {
      if (currentTx && currentTx.amount !== undefined) {
        transactions.push(currentTx);
      }
      currentTx = null;
      continue;
    }

    if (!currentTx) {
      currentTx = {
        id: `qif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        date: new Date().toISOString().slice(0, 10),
        description: 'Transacción QIF',
        amount: 0,
        type: 'EXPENSE',
      };
    }

    const code = line[0];
    const value = line.substring(1).trim();

    switch (code) {
      case 'D': // Date (MM/DD/YYYY o DD/MM/YYYY)
        currentTx.date = value;
        break;
      case 'T': // Amount
      case 'U': // Amount
        const amountNum = parseFloat(value.replace(/,/g, '')) || 0;
        currentTx.amount = Math.abs(amountNum);
        currentTx.type = amountNum < 0 ? 'EXPENSE' : 'INCOME';
        break;
      case 'P': // Payee / Description
        currentTx.description = value;
        break;
      case 'M': // Memo
        currentTx.memo = value;
        break;
      case 'C': // Cleared status
        currentTx.cleared = value;
        break;
      default:
        break;
    }
  }

  if (currentTx && currentTx.amount !== undefined) {
    transactions.push(currentTx);
  }

  return transactions;
};

export default { parseOFX, parseQIF };
