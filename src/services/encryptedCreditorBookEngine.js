/**
 * encryptedCreditorBookEngine.js
 * 
 * Motor seguro con cifrado Zero-Knowledge del lado del cliente (AES-GCM 256 + PBKDF2)
 * para la libreta de acreedores, referencias de pago bancarias, números de contrato y datos de contacto.
 * Ningún dato bancario en texto claro sale del dispositivo del usuario.
 */

// Obtener la instancia de Web Crypto de manera agnóstica (Browser / Node / Vitest)
const getCrypto = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API no está disponible en este entorno.');
};

/**
 * Convierte un ArrayBuffer a cadena Hexadecimal.
 */
export function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte una cadena Hexadecimal a Uint8Array.
 */
export function hexToBuffer(hexString) {
  if (!hexString || typeof hexString !== 'string') return new Uint8Array();
  const bytes = new Uint8Array(Math.floor(hexString.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Deriva una clave criptográfica AES-GCM de 256 bits a partir de una contraseña y salt usando PBKDF2.
 */
async function deriveKey(passphrase, saltBytes) {
  const crypto = getCrypto();
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Enmascara un número de cuenta o referencia dejando visibles solo los últimos dígitos.
 * @param {string} reference
 * @returns {string} Referencia enmascarada (ej: "•••• 4521")
 */
export function maskSensitiveReference(reference = '') {
  const str = String(reference || '').trim();
  if (str.length <= 4) return str ? '••••' : '';
  const last4 = str.slice(-4);
  return `•••• •••• ${last4}`;
}

/**
 * Valida un registro de acreedor antes de ser almacenado o cifrado.
 */
export function validateCreditorRecord(record = {}) {
  const errors = [];
  if (!record.name || !String(record.name).trim()) {
    errors.push('El nombre del acreedor/entidad es obligatorio.');
  }
  if (record.dueDay !== undefined && record.dueDay !== null && record.dueDay !== '') {
    const day = Number(record.dueDay);
    if (isNaN(day) || day < 1 || day > 31) {
      errors.push('El día de corte/vencimiento debe estar entre 1 y 31.');
    }
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cifra un registro individual de acreedor con AES-256-GCM.
 * 
 * @param {Object} record - Objeto con datos del acreedor (nombre, cuenta, referencia, notas, etc.)
 * @param {string} passphrase - Contraseña maestra del usuario
 * @returns {Promise<Object>} Registro cifrado con metadatos seguros
 */
export async function encryptCreditorRecord(record = {}, passphrase = '') {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Se requiere una contraseña maestra para cifrar el registro de acreedor.');
  }

  const validation = validateCreditorRecord(record);
  if (!validation.isValid) {
    throw new Error(`Registro inválido: ${validation.errors.join(' ')}`);
  }

  const crypto = getCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const plaintextPayload = JSON.stringify({
    ...record,
    updatedAt: new Date().toISOString()
  });

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plaintextPayload)
  );

  const refStr = String(record.accountNumber || record.paymentReference || '');
  const last4 = refStr.length >= 4 ? refStr.slice(-4) : '';

  return {
    id: record.id || `creditor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    isEncrypted: true,
    saltHex: bufferToHex(salt),
    ivHex: bufferToHex(iv),
    ciphertextHex: bufferToHex(ciphertextBuffer),
    maskedName: record.name || 'Acreedor Cifrado',
    last4Reference: last4,
    dueDay: record.dueDay ? Number(record.dueDay) : null,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Descifra un registro individual de acreedor usando AES-256-GCM.
 * 
 * @param {Object} encryptedRecord - Registro con ciphertextHex, saltHex, ivHex
 * @param {string} passphrase - Contraseña maestra del usuario
 * @returns {Promise<Object>} Registro original descifrado
 */
export async function decryptCreditorRecord(encryptedRecord = {}, passphrase = '') {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Se requiere la contraseña maestra para descifrar el registro.');
  }

  if (!encryptedRecord.isEncrypted || !encryptedRecord.ciphertextHex) {
    // Si ya viene en texto claro (por compatibilidad o migración)
    return { ...encryptedRecord };
  }

  const crypto = getCrypto();
  const salt = hexToBuffer(encryptedRecord.saltHex);
  const iv = hexToBuffer(encryptedRecord.ivHex);
  const ciphertext = hexToBuffer(encryptedRecord.ciphertextHex);

  const aesKey = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      isEncrypted: false
    };
  } catch (err) {
    throw new Error('Error al descifrar el acreedor. Contraseña maestra incorrecta o datos corruptos.');
  }
}

/**
 * Cifra un lote completo de acreedores.
 */
export async function encryptCreditorBook(records = [], passphrase = '') {
  if (!Array.isArray(records)) return [];
  const encryptedList = [];
  for (const rec of records) {
    const enc = await encryptCreditorRecord(rec, passphrase);
    encryptedList.push(enc);
  }
  return encryptedList;
}

/**
 * Descifra un lote completo de acreedores. Devuelve registros descifrados y reporte de errores si los hay.
 */
export async function decryptCreditorBook(records = [], passphrase = '') {
  if (!Array.isArray(records)) return { decrypted: [], failedCount: 0 };
  const decrypted = [];
  let failedCount = 0;

  for (const rec of records) {
    try {
      const dec = await decryptCreditorRecord(rec, passphrase);
      decrypted.push(dec);
    } catch (err) {
      failedCount++;
    }
  }

  return {
    decrypted,
    failedCount
  };
}

/**
 * Identifica acreedores con vencimiento de pago próximo en los siguientes N días.
 * 
 * @param {Array<Object>} creditors - Lista de acreedores (descifrados o con dueDay)
 * @param {number} [currentDay=new Date().getDate()] - Día del mes actual (1-31)
 * @param {number} [lookaheadDays=7] - Días de anticipación
 * @returns {Array<Object>} Acreedores que vencen pronto con días restantes
 */
export function filterCreditorsDueSoon(creditors = [], currentDay = new Date().getDate(), lookaheadDays = 7) {
  if (!Array.isArray(creditors)) return [];

  const cDay = Math.max(1, Math.min(31, Number(currentDay) || 1));
  const lookahead = Math.max(1, Number(lookaheadDays) || 7);

  const upcoming = [];

  creditors.forEach(creditor => {
    if (!creditor || creditor.dueDay === undefined || creditor.dueDay === null) return;
    const dueDay = Number(creditor.dueDay);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) return;

    let daysUntilDue = dueDay - cDay;
    if (daysUntilDue < 0) {
      // Ajuste para rollover del siguiente mes (asumiendo 30 días base)
      daysUntilDue += 30;
    }

    if (daysUntilDue <= lookahead) {
      upcoming.push({
        ...creditor,
        daysUntilDue,
        isUrgent: daysUntilDue <= 3
      });
    }
  });

  return upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
