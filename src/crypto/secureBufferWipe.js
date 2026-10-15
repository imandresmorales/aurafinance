/**
 * Secure Memory Buffer Management
 * Proporciona utilidades para la sobreescritura criptográfica de buffers sensibles
 * (claves derivadas, semillas mnemónicas, PINs planos, tokens) antes de que el
 * recolector de basura de JavaScript reclame el espacio, mitigando fugas en volcados de memoria.
 */

/**
 * Sobreescribe un TypedArray (Uint8Array, Int32Array, etc.) con ceros o bytes pseudoaleatorios.
 * @param {ArrayBufferView} buffer
 * @param {boolean} [randomize=false] - Si es true llena con bytes aleatorios antes de poner ceros.
 */
export const wipeTypedArray = (buffer, randomize = false) => {
  if (!buffer || !buffer.buffer) return;

  try {
    const view = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    if (randomize && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(view);
    }
    view.fill(0);
  } catch (err) {
    // Si el buffer es read-only o no permite modificación directa
  }
};

/**
 * Envoltorio seguro para strings sensibles (como PINs o contraseñas).
 * Facilita el uso en un contexto seguro y la posterior destrucción.
 * @param {string} sensitiveString
 * @param {(bytes: Uint8Array) => Promise<T> | T} callback
 * @returns {Promise<T>}
 */
export const withSecureBuffer = async (sensitiveString, callback) => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(sensitiveString);

  try {
    return await callback(buffer);
  } finally {
    wipeTypedArray(buffer, true);
  }
};

/**
 * Limpia un array u objeto de referencias en memoria para favorecer su recolección inmediata.
 * @param {Record<string, any>} obj
 */
export const shredObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = '';
    } else if (obj[key] instanceof Uint8Array || obj[key] instanceof ArrayBuffer) {
      wipeTypedArray(obj[key]);
    }
    delete obj[key];
  }
};
