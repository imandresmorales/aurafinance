/**
 * useSecureSession.js
 *
 * Commit 147 — Detección y Terminación de Sesiones Inactivas con Borrado Seguro de Memoria.
 *
 * Extiende el modelo de seguridad del AuthContext para:
 *  1. Detectar sesiones inactivas y terminarlas automáticamente.
 *  2. Borrar de forma segura los buffers de claves en memoria (zero-fill).
 *  3. Registrar el evento en el log de auditoría al bloquear.
 *  4. Exponer visibilidad del estado de sesión y último momento de actividad.
 *
 * SEGURIDAD:
 *  - secureWipeRef(): sobreescribe Uint8Array/ArrayBuffer con ceros antes de liberar.
 *  - El masterKey (CryptoKey) no es un buffer inspectable; su limpieza es
 *    simbólica (setState(null)) ya que el GC de V8 maneja CryptoKey internamente.
 *  - Se registra en auditLogEngine cada bloqueo y desbloqueo.
 *  - Emite evento custom 'aura:session-locked' al bloquearse (para UI reactiva).
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { logAuditEvent, AuditEvent } from '../services/auditLogEngine';
import { secureWipeBuffer } from '../crypto/vaultCryptoEngine';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
const DEFAULT_SESSION_MS = 5 * 60 * 1000; // 5 minutos
const SESSION_TIMEOUT_KEY = 'aura_session_timeout_ms';

/**
 * Hook de sesión segura con borrado activo de buffers sensibles.
 *
 * @param {Function}       lockVault         - Callback del AuthContext para bloquear
 * @param {boolean}        isAuthenticated   - Si el usuario está autenticado
 * @param {Uint8Array[]}   [sensitiveBuffers] - Buffers adicionales a limpiar al bloquear
 * @returns {{
 *   sessionMs: number,
 *   setSessionMs: Function,
 *   lastActivityAt: Date|null,
 *   resetSession: Function,
 *   terminateSession: Function,
 * }}
 */
export function useSecureSession(lockVault, isAuthenticated, sensitiveBuffers = []) {
  const [sessionMs, _setSessionMs] = useState(() => {
    const stored = parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY), 10);
    return isNaN(stored) || stored < 30_000 ? DEFAULT_SESSION_MS : stored;
  });

  const [lastActivityAt, setLastActivityAt] = useState(null);
  const timerRef        = useRef(null);
  const lockVaultRef    = useRef(lockVault);
  const sessionMsRef    = useRef(sessionMs);
  const buffersRef      = useRef(sensitiveBuffers);

  useEffect(() => { lockVaultRef.current    = lockVault;        }, [lockVault]);
  useEffect(() => { sessionMsRef.current    = sessionMs;        }, [sessionMs]);
  useEffect(() => { buffersRef.current      = sensitiveBuffers; }, [sensitiveBuffers]);

  // ── Borrado seguro y terminación ───────────────────────────────────────────

  const terminateSession = useCallback(async (reason = 'inactivity') => {
    // 1. Limpiar buffers sensibles opcionales
    for (const buf of buffersRef.current) {
      try { secureWipeBuffer(buf); } catch { /* buffer ya liberado */ }
    }

    // 2. Llamar al lockVault del contexto (pone masterKey = null)
    lockVaultRef.current?.();

    // 3. Emitir evento DOM para que la UI reaccione sin acoplamiento
    try {
      window.dispatchEvent(new CustomEvent('aura:session-locked', { detail: { reason } }));
    } catch { /* noop */ }

    // 4. Registrar en auditoría (asíncrono, no bloquea el flujo de cierre)
    logAuditEvent(AuditEvent.VAULT_LOCKED, { reason }).catch(() => {});
  }, []);

  // ── Reinicio del temporizador ─────────────────────────────────────────────

  const resetSession = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLastActivityAt(new Date());
    timerRef.current = setTimeout(() => {
      terminateSession('inactivity');
    }, sessionMsRef.current);
  }, [terminateSession]);

  // ── Listeners de actividad ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const handleActivity = () => resetSession();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetSession();

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, resetSession]);

  // ── Visibilidad de página (bloqueo al cambiar de pestaña prolongadamente) ──

  useEffect(() => {
    if (!isAuthenticated) return;

    let hiddenAt = null;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAt !== null) {
        const elapsed = Date.now() - hiddenAt;
        if (elapsed >= sessionMsRef.current) {
          terminateSession('tab_hidden_timeout');
        } else {
          resetSession();
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated, terminateSession, resetSession]);

  // ── Configuración del timeout ──────────────────────────────────────────────

  const setSessionMs = useCallback((ms) => {
    const safe = Math.max(30_000, Number(ms) || DEFAULT_SESSION_MS);
    localStorage.setItem(SESSION_TIMEOUT_KEY, String(safe));
    _setSessionMs(safe);
  }, []);

  return { sessionMs, setSessionMs, lastActivityAt, resetSession, terminateSession };
}
