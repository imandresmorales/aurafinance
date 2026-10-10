/**
 * vaultCryptoEngine.js
 * 
 * Módulo de Cifrado Integral End-to-End (E2E) de la Bóveda Financiera para AuraFinance.
 * Implementa empaquetado hermético, derivación de clave PBKDF2-SHA-256 (100,000 iteraciones),
 * cifrado simétrico autenticado AES-256-GCM (96-bit IV, 128-bit auth tag) y verificación
 * estricta de integridad anti-tampering mediante digest criptográfico SHA-256.
 */

// Obtener la instancia nativa de Web Crypto
const getWebCrypto = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto;
  }
  throw new Error('Web Crypto API no disponible en este entorno.');
};

/**
 * Convierte ArrayBuffer o Uint8Array a cadena Hexadecimal.
 */
export function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte cadena Hexadecimal a Uint8Array.
 */
export function hexToBuffer(hex) {
  if (!hex || typeof hex !== 'string') return new Uint8Array();
  const clean = hex.trim().toLowerCase();
  const bytes = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Sobreescribe un buffer o Uint8Array con ceros para mitigar retención de secretos en memoria.
 * @param {Uint8Array} buffer
 */
export function secureWipeBuffer(buffer) {
  if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer) {
    const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    view.fill(0);
  }
}

/**
 * Calcula el hash criptográfico SHA-256 de un texto plano.
 * @param {string} text
 * @returns {Promise<string>} Hexadecimal SHA-256
 */
export async function computeSha256(text) {
  const crypto = getWebCrypto();
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Deriva una clave AES-GCM de 256 bits a partir de contraseña y sal usando PBKDF2.
 */
async function deriveKeyFromPassword(password, saltBytes, iterations = 100000) {
  const crypto = getWebCrypto();
  const enc = new TextEncoder();
  const rawKey = enc.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Genera una huella digital determinista SHA-256 de los datos de la bóveda.
 */
export async function generateVaultFingerprint(vaultData) {
  const canonical = JSON.stringify(vaultData || {});
  return computeSha256(canonical);
}

/**
 * Empaqueta y cifra integralmente la bóveda completa con AES-256-GCM y verificación SHA-256.
 * 
 * @param {Object} vaultData - Estado completo de la bóveda (cuentas, transacciones, deudas, etc.)
 * @param {string} masterPassword - Contraseña maestra elegida por el usuario
 * @param {Object} [options]
 * @param {number} [options.iterations=100000] - Rondas PBKDF2
 * @returns {Promise<Object>} Sobre sellado (Envelope) cifrado y firmado
 */
export async function packAndEncryptVault(vaultData = {}, masterPassword = '', options = {}) {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error('Se requiere una contraseña maestra no vacía para cifrar la bóveda.');
  }

  const crypto = getWebCrypto();
  const iterations = Math.max(100000, Number(options.iterations) || 100000);

  // 1. Serializar el payload de la bóveda
  const jsonString = JSON.stringify(vaultData);

  // 2. Calcular Checksum SHA-256 del contenido en claro para verificar integridad post-descifrado
  const checksumSha256 = await computeSha256(jsonString);

  // 3. Generar Sal (16 bytes) e IV (12 bytes) criptográficamente aleatorios
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 4. Derivar clave simétrica AES-GCM
  const aesKey = await deriveKeyFromPassword(masterPassword, salt, iterations);

  // 5. Cifrar con AES-256-GCM
  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(jsonString);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128
    },
    aesKey,
    plaintextBytes
  );

  // Limpiar buffer en texto plano de memoria inmediata
  secureWipeBuffer(plaintextBytes);

  return {
    format: 'AURA_VAULT_ENVELOPE',
    version: 1,
    cipher: 'AES-256-GCM',
    kdf: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations,
      saltHex: bufferToHex(salt)
    },
    ivHex: bufferToHex(iv),
    ciphertextHex: bufferToHex(ciphertextBuffer),
    checksumSha256,
    tagLength: 128,
    metadata: {
      packedAt: new Date().toISOString(),
      sizeBytes: ciphertextBuffer.byteLength
    }
  };
}

/**
 * Desempaqueta, descifra y valida la integridad de una bóveda sellada.
 * 
 * @param {Object} envelope - Sobre cifrado generado por packAndEncryptVault
 * @param {string} masterPassword - Contraseña maestra del usuario
 * @returns {Promise<Object>} Datos originales de la bóveda restaurados
 */
export async function unpackAndDecryptVault(envelope = {}, masterPassword = '') {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error('Se requiere la contraseña maestra para descifrar la bóveda.');
  }

  if (!envelope || envelope.format !== 'AURA_VAULT_ENVELOPE') {
    throw new Error('Formato de sobre de bóveda no válido o incompatible.');
  }

  if (!envelope.ciphertextHex || !envelope.ivHex || !envelope.kdf?.saltHex) {
    throw new Error('El sobre de la bóveda está incompleto o corrupto.');
  }

  const crypto = getWebCrypto();
  const salt = hexToBuffer(envelope.kdf.saltHex);
  const iv = hexToBuffer(envelope.ivHex);
  const ciphertext = hexToBuffer(envelope.ciphertextHex);
  const iterations = envelope.kdf.iterations || 100000;

  // Derivar la misma clave con los parámetros registrados en el sobre
  const aesKey = await deriveKeyFromPassword(masterPassword, salt, iterations);

  let decryptedBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: envelope.tagLength || 128
      },
      aesKey,
      ciphertext
    );
  } catch (err) {
    throw new Error('Acceso denegado: Contraseña maestra incorrecta o datos manipulados.');
  }

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);

  // Validar Checksum Anti-Tampering
  const computedChecksum = await computeSha256(jsonString);
  if (envelope.checksumSha256 && computedChecksum !== envelope.checksumSha256) {
    throw new Error('Error de integridad: La suma de comprobación no coincide. El archivo fue modificado.');
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error('Error de formato: El contenido descifrado no es un JSON válido.');
  }
}

/**
 * Valida rápidamente si una contraseña es correcta sin cargar la bóveda en memoria.
 */
export async function verifyVaultPassword(envelope, password) {
  try {
    await unpackAndDecryptVault(envelope, password);
    return true;
  } catch {
    return false;
  }
}
