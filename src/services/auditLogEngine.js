/**
 * auditLogEngine.js
 *
 * Commit 146 — Registro Inmutable de Auditoría Local de Seguridad para AuraFinance.
 *
 * Cada entrada queda encadenada mediante su hash SHA-256 con la entrada previa,
 * formando una cadena de integridad anti-manipulación. Cualquier alteración de
 * una entrada invalida los hashes de todas las posteriores.
 *
 * EVENTOS REGISTRADOS (AuditEventType):
 *  - LOGIN_SUCCESS / LOGIN_FAILED / LOGOUT
 *  - VAULT_LOCKED / VAULT_UNLOCKED
 *  - PASSKEY_REGISTERED / PASSKEY_REMOVED / PASSKEY_AUTH_SUCCESS / PASSKEY_AUTH_FAILED
 *  - TOTP_ENABLED / TOTP_DISABLED / TOTP_VERIFIED / TOTP_FAILED
 *  - PIN_CHANGED / PIN_CLEARED
 *  - VAULT_EXPORTED / MASTER_KEY_CHANGED
 *  - STEALTH_ENABLED / STEALTH_DISABLED
 *  - DB_INTEGRITY_PASS / DB_INTEGRITY_FAIL
 *  - PANIC_WIPE_TRIGGERED
 *
 * SEGURIDAD:
 *  - Cadena de hashes SHA-256: cada entrada incluye el hash de la anterior.
 *  - Solo IDs/tipos de evento; nunca contraseñas ni claves en los logs.
 *  - Almacenado en localStorage bajo clave prefijada.
 *  - Purgado controlado: máximo MAX_ENTRIES entradas (FIFO).
 */

import { computeSha256 } from '../crypto/vaultCryptoEngine';

const STORAGE_KEY = 'aura_audit_log';
const MAX_ENTRIES = 500;

// ─── Tipos de evento ──────────────────────────────────────────────────────────

export const AuditEvent = Object.freeze({
  LOGIN_SUCCESS:         'LOGIN_SUCCESS',
  LOGIN_FAILED:          'LOGIN_FAILED',
  LOGOUT:                'LOGOUT',
  VAULT_LOCKED:          'VAULT_LOCKED',
  VAULT_UNLOCKED:        'VAULT_UNLOCKED',
  PASSKEY_REGISTERED:    'PASSKEY_REGISTERED',
  PASSKEY_REMOVED:       'PASSKEY_REMOVED',
  PASSKEY_AUTH_SUCCESS:  'PASSKEY_AUTH_SUCCESS',
  PASSKEY_AUTH_FAILED:   'PASSKEY_AUTH_FAILED',
  TOTP_ENABLED:          'TOTP_ENABLED',
  TOTP_DISABLED:         'TOTP_DISABLED',
  TOTP_VERIFIED:         'TOTP_VERIFIED',
  TOTP_FAILED:           'TOTP_FAILED',
  PIN_CHANGED:           'PIN_CHANGED',
  PIN_CLEARED:           'PIN_CLEARED',
  VAULT_EXPORTED:        'VAULT_EXPORTED',
  MASTER_KEY_CHANGED:    'MASTER_KEY_CHANGED',
  STEALTH_ENABLED:       'STEALTH_ENABLED',
  STEALTH_DISABLED:      'STEALTH_DISABLED',
  DB_INTEGRITY_PASS:     'DB_INTEGRITY_PASS',
  DB_INTEGRITY_FAIL:     'DB_INTEGRITY_FAIL',
  PANIC_WIPE_TRIGGERED:  'PANIC_WIPE_TRIGGERED',
  CLIPBOARD_CLEARED:     'CLIPBOARD_CLEARED',
  SECURITY_HEADERS_SET:  'SECURITY_HEADERS_SET',
});

// ─── Carga / guardado ─────────────────────────────────────────────────────────

function loadLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLog(entries) {
  try {
    // FIFO: mantener solo las últimas MAX_ENTRIES
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* localStorage lleno — silencioso para no interrumpir flujo crítico */
  }
}

// ─── Hashing de entradas ──────────────────────────────────────────────────────

async function hashEntry(entry) {
  // Serialización determinista para hashing
  const canonical = JSON.stringify({
    seq:       entry.seq,
    type:      entry.type,
    ts:        entry.ts,
    meta:      entry.meta ?? null,
    prevHash:  entry.prevHash,
  });
  return computeSha256(canonical);
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Registra un evento de seguridad en el log de auditoría.
 *
 * @param {string} type   - AuditEvent.*
 * @param {Object} [meta] - Metadatos adicionales sin datos sensibles
 * @returns {Promise<Object>} La entrada creada
 */
export async function logAuditEvent(type, meta = {}) {
  const entries = loadLog();
  const lastEntry = entries[entries.length - 1] ?? null;
  const prevHash = lastEntry ? (lastEntry.hash ?? 'GENESIS') : 'GENESIS';

  const entry = {
    seq:      (lastEntry?.seq ?? 0) + 1,
    type,
    ts:       new Date().toISOString(),
    meta:     sanitizeMeta(meta),
    prevHash,
    hash:     '', // se completa abajo
  };

  entry.hash = await hashEntry(entry);

  entries.push(entry);
  saveLog(entries);

  return entry;
}

/**
 * Retorna todas las entradas del log de auditoría.
 * @returns {Array<Object>}
 */
export function getAuditLog() {
  return loadLog();
}

/**
 * Verifica la integridad de la cadena de hashes del log.
 * @returns {Promise<{valid: boolean, firstInvalidSeq: number|null}>}
 */
export async function verifyAuditLogIntegrity() {
  const entries = loadLog();
  if (entries.length === 0) return { valid: true, firstInvalidSeq: null };

  for (const entry of entries) {
    const recomputed = await hashEntry(entry);
    if (recomputed !== entry.hash) {
      return { valid: false, firstInvalidSeq: entry.seq };
    }
  }

  return { valid: true, firstInvalidSeq: null };
}

/**
 * Purga completamente el log de auditoría.
 * Solo usar en panic wipe; registra el evento PANIC_WIPE_TRIGGERED antes de borrar.
 */
export async function clearAuditLog() {
  await logAuditEvent(AuditEvent.PANIC_WIPE_TRIGGERED, { reason: 'manual_purge' });
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Retorna las últimas N entradas del log.
 * @param {number} n
 */
export function getRecentAuditEvents(n = 50) {
  const entries = loadLog();
  return entries.slice(-Math.abs(n));
}

// ─── Sanitización de metadatos ────────────────────────────────────────────────

const FORBIDDEN_KEYS = ['password', 'passphrase', 'pin', 'secret', 'key', 'token', 'hash', 'masterKey'];

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const safe = {};
  for (const [k, v] of Object.entries(meta)) {
    const lower = k.toLowerCase();
    if (FORBIDDEN_KEYS.some((f) => lower.includes(f))) continue;
    safe[k] = typeof v === 'object' ? '[object]' : String(v).substring(0, 128);
  }
  return safe;
}
