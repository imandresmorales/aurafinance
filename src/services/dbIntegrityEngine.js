/**
 * dbIntegrityEngine.js
 *
 * Commit 149 — Verificador de Integridad de Base de Datos Local (Anti-Tampering).
 *
 * Implementa un hash encadenado SHA-256 sobre colecciones de datos almacenadas
 * en localStorage. Cada colección tiene un "sello" (seal) que contiene:
 *   - El hash SHA-256 del contenido serializado de la colección.
 *   - Un hash de cadena que incluye el hash del sello anterior.
 *   - Timestamp del último sellado.
 *
 * FLUJO:
 *   1. Al guardar datos: sealCollection(key, data)
 *   2. Al leer datos:    verifyCollection(key) → { valid, data, tampered }
 *   3. Para auditar todo el almacén: verifyAllSeals() → report
 *
 * SEGURIDAD:
 *   - No cifra datos; el cifrado corresponde a vaultCryptoEngine.
 *   - Detecta modificaciones manuales o externas al localStorage.
 *   - Los sellos se almacenan en una clave separada para dificultar la alteración coordinada.
 *   - Compatible con el auditLogEngine para registrar resultados.
 */

import { computeSha256 } from '../crypto/vaultCryptoEngine';

const SEALS_KEY    = 'aura_db_seals';
const DATA_PREFIX  = 'aura_db_';

// ─── Gestión de sellos ────────────────────────────────────────────────────────

function loadSeals() {
  try {
    const raw = localStorage.getItem(SEALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSeals(seals) {
  try {
    localStorage.setItem(SEALS_KEY, JSON.stringify(seals));
  } catch { /* localStorage lleno */ }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Serializa y guarda una colección con su sello de integridad SHA-256.
 *
 * @param {string} collectionKey - Identificador lógico de la colección (ej: 'transactions')
 * @param {*}      data          - Datos a almacenar (cualquier valor serializable)
 * @returns {Promise<string>}    - Hash SHA-256 del contenido sellado
 */
export async function sealCollection(collectionKey, data) {
  const serialized  = JSON.stringify(data);
  const contentHash = await computeSha256(serialized);

  const seals    = loadSeals();
  const prevSeal = seals[collectionKey];
  const prevHash = prevSeal?.contentHash ?? 'GENESIS';

  // Hash de cadena: encadena el hash actual con el anterior para detectar rollbacks
  const chainInput = `${collectionKey}:${contentHash}:${prevHash}`;
  const chainHash  = await computeSha256(chainInput);

  const seal = {
    collectionKey,
    contentHash,
    chainHash,
    prevHash,
    sealedAt: new Date().toISOString(),
    version: (prevSeal?.version ?? 0) + 1,
  };

  seals[collectionKey] = seal;
  saveSeals(seals);

  // Guardar los datos bajo clave prefijada
  try {
    localStorage.setItem(`${DATA_PREFIX}${collectionKey}`, serialized);
  } catch { /* localStorage lleno */ }

  return contentHash;
}

/**
 * Lee y verifica la integridad de una colección.
 *
 * @param {string} collectionKey
 * @returns {Promise<{
 *   valid: boolean,
 *   data: *,
 *   tampered: boolean,
 *   seal: Object|null,
 *   error: string|null
 * }>}
 */
export async function verifyCollection(collectionKey) {
  const seals = loadSeals();
  const seal  = seals[collectionKey] ?? null;

  const raw = localStorage.getItem(`${DATA_PREFIX}${collectionKey}`);

  if (raw === null) {
    return { valid: seal === null, data: null, tampered: false, seal, error: null };
  }

  if (!seal) {
    // Datos sin sello → posible inserción no autorizada
    return { valid: false, data: null, tampered: true, seal: null, error: 'Datos sin sello de integridad.' };
  }

  // Verificar hash del contenido
  const computedHash = await computeSha256(raw);
  if (computedHash !== seal.contentHash) {
    return {
      valid: false,
      data: null,
      tampered: true,
      seal,
      error: `Hash de contenido no coincide. Esperado: ${seal.contentHash.slice(0, 12)}… Obtenido: ${computedHash.slice(0, 12)}…`,
    };
  }

  // Verificar hash de cadena
  const chainInput    = `${collectionKey}:${computedHash}:${seal.prevHash}`;
  const computedChain = await computeSha256(chainInput);
  if (computedChain !== seal.chainHash) {
    return {
      valid: false,
      data: null,
      tampered: true,
      seal,
      error: 'Hash de cadena inválido. Posible rollback o manipulación del sello.',
    };
  }

  try {
    return { valid: true, data: JSON.parse(raw), tampered: false, seal, error: null };
  } catch {
    return { valid: false, data: null, tampered: true, seal, error: 'JSON inválido al deserializar.' };
  }
}

/**
 * Verifica la integridad de todas las colecciones selladas.
 *
 * @returns {Promise<{
 *   allValid: boolean,
 *   results: Array<{ collectionKey: string, valid: boolean, tampered: boolean, error: string|null }>
 * }>}
 */
export async function verifyAllSeals() {
  const seals = loadSeals();
  const keys  = Object.keys(seals);

  if (keys.length === 0) return { allValid: true, results: [] };

  const results = await Promise.all(
    keys.map(async (key) => {
      const { valid, tampered, error } = await verifyCollection(key);
      return { collectionKey: key, valid, tampered, error };
    })
  );

  return {
    allValid: results.every((r) => r.valid),
    results,
  };
}

/**
 * Elimina el sello y los datos de una colección.
 * @param {string} collectionKey
 */
export function removeSealedCollection(collectionKey) {
  const seals = loadSeals();
  delete seals[collectionKey];
  saveSeals(seals);
  localStorage.removeItem(`${DATA_PREFIX}${collectionKey}`);
}

/**
 * Retorna los metadatos del sello de una colección sin cargar los datos.
 * @param {string} collectionKey
 * @returns {Object|null}
 */
export function getSealMetadata(collectionKey) {
  return loadSeals()[collectionKey] ?? null;
}

/**
 * Lista todas las colecciones selladas conocidas.
 * @returns {string[]}
 */
export function listSealedCollections() {
  return Object.keys(loadSeals());
}
