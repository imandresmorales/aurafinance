/**
 * Verifica si el entorno actual soporta Web Crypto API de forma segura
 */
export function isWebCryptoSupported() {
  return typeof window !== 'undefined' && 
         typeof window.crypto !== 'undefined' && 
         typeof window.crypto.subtle !== 'undefined';
}

export function assertWebCrypto() {
  if (!isWebCryptoSupported()) {
    throw new Error(
      'Web Crypto API no disponible. Asegúrate de ejecutar la aplicación en un contexto seguro (HTTPS o localhost).'
    );
  }
}
