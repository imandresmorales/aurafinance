/**
 * useAutoLock.js
 *
 * Hook de Bloqueo Automático por Inactividad Configurable para AuraFinance.
 *
 * Commit 144 — Funcionalidades:
 *  - Escucha eventos de actividad del usuario (ratón, teclado, táctil, scroll).
 *  - Al cumplirse el período de inactividad dispara un callback `onLock`.
 *  - El timeout es configurable en milisegundos (default: 5 min).
 *  - El PIN/contraseña de desbloqueo se valida contra el hash almacenado en AuthContext.
 *  - Expone `resetTimer()` para reiniciar el temporizador manualmente.
 *  - Expone `setAutoLockMs(ms)` para reconfigurar el tiempo dinámicamente.
 *  - Persiste la preferencia de timeout en localStorage.
 *
 * SEGURIDAD:
 *  - No se almacena el PIN en texto plano; se valida contra un hash derivado.
 *  - El desbloqueo usa SHA-256 para verificar el PIN ingresado vs hash guardado.
 *  - El bloqueo purga la masterKey del contexto (delegado a onLock → lockVault).
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { computeSha256 } from '../crypto/vaultCryptoEngine';

const STORAGE_KEY_TIMEOUT = 'aura_autolock_ms';
const STORAGE_KEY_PIN_HASH = 'aura_pin_hash';
const DEFAULT_LOCK_MS = 5 * 60 * 1000; // 5 minutos
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

/**
 * Hook de bloqueo automático por inactividad.
 *
 * @param {Function} onLock   - Callback invocado al dispararse el bloqueo (ej: lockVault)
 * @param {boolean}  active   - Si es false, el temporizador no corre (ej: usuario no autenticado)
 * @returns {{
 *   autoLockMs: number,
 *   setAutoLockMs: Function,
 *   resetTimer: Function,
 *   hasPinConfigured: boolean,
 *   setupPin: (pin: string) => Promise<void>,
 *   verifyPin: (pin: string) => Promise<boolean>,
 *   clearPin: () => void,
 * }}
 */
export function useAutoLock(onLock, active = true) {
  const [autoLockMs, _setAutoLockMs] = useState(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY_TIMEOUT), 10);
    return isNaN(stored) || stored < 30000 ? DEFAULT_LOCK_MS : stored;
  });

  const [hasPinConfigured, setHasPinConfigured] = useState(
    () => Boolean(localStorage.getItem(STORAGE_KEY_PIN_HASH))
  );

  const timerRef = useRef(null);
  const onLockRef = useRef(onLock);
  const autoLockMsRef = useRef(autoLockMs);

  // Mantener refs actualizadas sin re-crear el effect
  useEffect(() => { onLockRef.current = onLock; }, [onLock]);
  useEffect(() => { autoLockMsRef.current = autoLockMs; }, [autoLockMs]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();
    if (!active) return;
    timerRef.current = setTimeout(() => {
      onLockRef.current?.();
    }, autoLockMsRef.current);
  }, [active, clearTimer]);

  // Adjuntar / retirar listeners de actividad
  useEffect(() => {
    if (!active) {
      clearTimer();
      return;
    }

    const handleActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );
    resetTimer(); // Iniciar el primer ciclo

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
      clearTimer();
    };
  }, [active, resetTimer, clearTimer]);

  // ── Configuración del timeout ──────────────────────────────────────────────

  const setAutoLockMs = useCallback((ms) => {
    const safe = Math.max(30000, Number(ms) || DEFAULT_LOCK_MS); // mínimo 30 s
    localStorage.setItem(STORAGE_KEY_TIMEOUT, String(safe));
    _setAutoLockMs(safe);
    resetTimer(); // Reiniciar con el nuevo intervalo
  }, [resetTimer]);

  // ── Gestión de PIN ────────────────────────────────────────────────────────

  /**
   * Configura (o sobreescribe) el PIN de desbloqueo rápido.
   * Almacena un hash SHA-256 del PIN — nunca el PIN en texto plano.
   * @param {string} pin
   */
  const setupPin = useCallback(async (pin) => {
    if (!pin || pin.trim().length < 4) {
      throw new Error('El PIN debe tener al menos 4 caracteres.');
    }
    const hash = await computeSha256(pin.trim());
    localStorage.setItem(STORAGE_KEY_PIN_HASH, hash);
    setHasPinConfigured(true);
  }, []);

  /**
   * Verifica un PIN contra el hash almacenado.
   * @param {string} pin
   * @returns {Promise<boolean>}
   */
  const verifyPin = useCallback(async (pin) => {
    const storedHash = localStorage.getItem(STORAGE_KEY_PIN_HASH);
    if (!storedHash || !pin) return false;
    const inputHash = await computeSha256(pin.trim());
    return inputHash === storedHash;
  }, []);

  /**
   * Elimina el PIN configurado (require re-autenticación completa después).
   */
  const clearPin = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_PIN_HASH);
    setHasPinConfigured(false);
  }, []);

  return {
    autoLockMs,
    setAutoLockMs,
    resetTimer,
    hasPinConfigured,
    setupPin,
    verifyPin,
    clearPin,
  };
}
