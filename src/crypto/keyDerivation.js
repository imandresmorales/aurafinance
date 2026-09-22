import { assertWebCrypto } from './cryptoCheck';

/**
 * Convierte un ArrayBuffer o Uint8Array a una cadena Base64
 */
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convierte una cadena Base64 a un Uint8Array
 */
export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Genera una sal criptográfica segura utilizando Web Crypto API
 * @param {number} byteLength - Longitud de la sal en bytes (por defecto 16 bytes = 128 bits)
 * @returns {Uint8Array}
 */
export function generateSalt(byteLength = 16) {
  assertWebCrypto();
  const salt = new Uint8Array(byteLength);
  window.crypto.getRandomValues(salt);
  return salt;
}

/**
 * Deriva una clave maestra simétrica AES-GCM de 256 bits a partir de una contraseña y sal mediante PBKDF2
 * @param {string} passphrase - Contraseña o frase de paso maestra del usuario
 * @param {Uint8Array|string} salt - Sal criptográfica (Uint8Array o cadena Base64)
 * @param {number} iterations - Número de iteraciones PBKDF2 (mínimo recomendado 100,000)
 * @returns {Promise<CryptoKey>} Clave criptográfica utilizable con AES-GCM
 */
export async function deriveMasterKey(passphrase, salt, iterations = 100000) {
  assertWebCrypto();
  
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  const saltBuffer = typeof salt === 'string' ? base64ToBuffer(salt) : salt;

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // Clave no exportable para máxima seguridad en memoria
    ['encrypt', 'decrypt']
  );
}

/**
 * Genera un hash de verificación de autenticación a partir de la contraseña
 * Permite verificar si la contraseña es correcta sin almacenar la contraseña ni la llave maestra
 */
export async function deriveAuthHash(passphrase, salt, iterations = 100000) {
  assertWebCrypto();
  
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBuffer = typeof salt === 'string' ? base64ToBuffer(salt) : salt;

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 32 bytes
  );

  return bufferToBase64(derivedBits);
}

/**
 * Calcula el hash SHA-256 de un texto o buffer para verificación de integridad (Anti-Tampering)
 */
export async function hashSHA256(data) {
  assertWebCrypto();
  const encoder = new TextEncoder();
  const buffer = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  return bufferToBase64(hashBuffer);
}
