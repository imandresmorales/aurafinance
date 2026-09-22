import { assertWebCrypto } from './cryptoCheck';
import { bufferToBase64, base64ToBuffer } from './keyDerivation';

/**
 * Cifra cualquier objeto JavaScript o texto plano utilizando AES-256-GCM con un vector de inicialización (IV) único de 96 bits
 * @param {any} data - Objeto o texto a cifrar
 * @param {CryptoKey} cryptoKey - Clave AES-GCM derivada previamente
 * @returns {Promise<{ciphertext: string, iv: string, tagLength: number, v: number, timestamp: number}>}
 */
export async function encryptData(data, cryptoKey) {
  assertWebCrypto();

  if (!cryptoKey) {
    throw new Error('Se requiere una CryptoKey válida para cifrar los datos.');
  }

  // Generar IV criptográfico aleatorio de 96 bits (12 bytes) recomendado para AES-GCM
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(jsonString);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128, // 128 bits de autenticación de integridad (GCM Authentication Tag)
    },
    cryptoKey,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    tagLength: 128,
    v: 1,
    timestamp: Date.now(),
  };
}

/**
 * Descifra una carga útil cifrada con AES-256-GCM y valida la autenticidad e integridad del contenido
 * @param {{ciphertext: string, iv: string, tagLength?: number}} payload - Estructura cifrada
 * @param {CryptoKey} cryptoKey - Clave AES-GCM derivada previamente
 * @returns {Promise<any>} Objeto o texto descifrado original
 */
export async function decryptData(payload, cryptoKey) {
  assertWebCrypto();

  if (!payload || !payload.ciphertext || !payload.iv) {
    throw new Error('Estructura de carga útil cifrada inválida o incompleta.');
  }

  if (!cryptoKey) {
    throw new Error('Se requiere una CryptoKey válida para descifrar los datos.');
  }

  const ivBuffer = base64ToBuffer(payload.iv);
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        tagLength: payload.tagLength || 128,
      },
      cryptoKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);

    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  } catch {
    throw new Error('Fallo de autenticación criptográfica: Clave incorrecta o datos manipulados.');
  }
}
