/**
 * useClipboardGuard.js
 *
 * Commit 150 — Limpieza Automática de Datos Sensibles del Portapapeles.
 *
 * Al copiar información sensible (claves, frases semilla, hashes, saldos),
 * programa un temporizador de 30 segundos para sobreescribir el portapapeles
 * con un texto vacío, reduciendo la ventana de exposición.
 *
 * API:
 *   const { copySecure, clearClipboard, isCopied, secondsLeft } = useClipboardGuard();
 *   await copySecure(text, label);   // Copia y programa limpieza en 30 s
 *   await clearClipboard();          // Limpia manualmente de inmediato
 *
 * SEGURIDAD:
 *   - Usa navigator.clipboard.writeText (API moderna, requiere permiso).
 *   - La limpieza sobreescribe con string vacío '' (algunos S.O. no permiten
 *     escribir vacío; en ese caso se usa un espacio en blanco ' ').
 *   - Registra el evento CLIPBOARD_CLEARED en el auditLogEngine.
 *   - El temporizador se cancela si el componente se desmonta antes de los 30 s.
 *   - No accede al contenido del portapapeles (sin permisos de lectura).
 *
 * NOTA: La API Clipboard requiere contexto seguro (HTTPS o localhost).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logAuditEvent, AuditEvent } from '../services/auditLogEngine';

const CLEAR_DELAY_MS  = 30_000; // 30 segundos
const TICK_INTERVAL   = 1_000;  // Actualizar cuenta regresiva cada segundo

/**
 * @returns {{
 *   copySecure:    (text: string, label?: string) => Promise<void>,
 *   clearClipboard: () => Promise<void>,
 *   isCopied:      boolean,
 *   copiedLabel:   string,
 *   secondsLeft:   number,
 *   isSupported:   boolean,
 * }}
 */
export function useClipboardGuard() {
  const [isCopied,    setIsCopied]    = useState(false);
  const [copiedLabel, setCopiedLabel] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  const clearTimerRef = useRef(null);
  const tickTimerRef  = useRef(null);
  const labelRef      = useRef('');

  const isSupported = Boolean(navigator?.clipboard?.writeText);

  // ── Limpieza interna ────────────────────────────────────────────────────────

  const _clearTimers = useCallback(() => {
    if (clearTimerRef.current) { clearTimeout(clearTimerRef.current);  clearTimerRef.current = null; }
    if (tickTimerRef.current)  { clearInterval(tickTimerRef.current);  tickTimerRef.current  = null; }
  }, []);

  const _resetState = useCallback(() => {
    setIsCopied(false);
    setCopiedLabel('');
    setSecondsLeft(0);
    labelRef.current = '';
  }, []);

  // ── API pública: clearClipboard ─────────────────────────────────────────────

  const clearClipboard = useCallback(async () => {
    _clearTimers();
    try {
      // Intentar vaciar con string vacío; fallback a espacio si el SO lo rechaza
      await navigator.clipboard.writeText('').catch(() => navigator.clipboard.writeText(' '));
    } catch {
      /* Permiso denegado o contexto no seguro — silencioso */
    }
    logAuditEvent(AuditEvent.CLIPBOARD_CLEARED, { label: labelRef.current }).catch(() => {});
    _resetState();
  }, [_clearTimers, _resetState]);

  // ── API pública: copySecure ─────────────────────────────────────────────────

  /**
   * Copia texto al portapapeles y programa su limpieza en 30 segundos.
   *
   * @param {string} text  - Texto a copiar
   * @param {string} label - Etiqueta descriptiva para UI/auditoría (no incluye el texto)
   */
  const copySecure = useCallback(async (text, label = 'dato sensible') => {
    if (!isSupported) {
      throw new Error('La API de portapapeles no está disponible en este entorno.');
    }
    if (typeof text !== 'string') {
      throw new Error('El texto a copiar debe ser una cadena de caracteres.');
    }

    // Cancelar cualquier ciclo previo
    _clearTimers();

    await navigator.clipboard.writeText(text);

    labelRef.current = label;
    setIsCopied(true);
    setCopiedLabel(label);
    setSecondsLeft(Math.round(CLEAR_DELAY_MS / 1000));

    // Cuenta regresiva visual
    tickTimerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tickTimerRef.current);
          tickTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, TICK_INTERVAL);

    // Limpieza automática al cumplirse el plazo
    clearTimerRef.current = setTimeout(async () => {
      await clearClipboard();
    }, CLEAR_DELAY_MS);
  }, [isSupported, _clearTimers, clearClipboard]);

  // ── Limpieza al desmontar ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      _clearTimers();
      // Intentar vaciar portapapeles si el componente se desmonta mientras hay datos
      if (isCopied) {
        navigator.clipboard?.writeText('').catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    copySecure,
    clearClipboard,
    isCopied,
    copiedLabel,
    secondsLeft,
    isSupported,
  };
}
