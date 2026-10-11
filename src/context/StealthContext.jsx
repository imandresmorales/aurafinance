/**
 * StealthContext.jsx
 *
 * Commit 145 — Modo Privacidad / Camuflaje (*Stealth Mode*)
 *
 * Oculta todos los saldos, montos y valores financieros sensibles con una
 * máscara "••••••" mediante atajo de teclado global `H` (o `Alt+H`).
 *
 * Uso en componentes:
 *   const { stealthMode, toggleStealth, maskValue } = useStealth();
 *   <span>{maskValue(cuenta.saldo, 'MXN')}</span>
 *
 * SEGURIDAD:
 *  - No elimina datos del DOM; aplica una máscara semántica (aria-label descriptivo).
 *  - Persiste preferencia del último estado en sessionStorage (no localStorage)
 *    para que se resetee al cerrar el navegador.
 *  - El atajo de teclado se ignora si el foco está en un campo de texto.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

const StealthContext = createContext(null);

const STEALTH_KEY = 'aura_stealth_mode';
const MASK = '••••••';

// ─── Formateador de valores enmascarados ──────────────────────────────────────

/**
 * Formatea un número como moneda o retorna la máscara si stealth está activo.
 *
 * @param {number}  value        - Valor numérico
 * @param {string}  [currency]   - Código ISO 4217 (ej: 'MXN', 'USD')
 * @param {string}  [locale]     - Locale BCP-47 (default: 'es-MX')
 * @param {boolean} stealthMode  - Si true, retorna MASK
 * @returns {string}
 */
export function formatMasked(value, currency = 'MXN', locale = 'es-MX', stealthMode = false) {
  if (stealthMode) return MASK;
  try {
    if (typeof value !== 'number' || isNaN(value)) return MASK;
    return new Intl.NumberFormat(locale, {
      style: currency ? 'currency' : 'decimal',
      currency: currency || undefined,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return String(value);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StealthProvider({ children }) {
  const [stealthMode, setStealthMode] = useState(() => {
    try {
      return sessionStorage.getItem(STEALTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleStealth = useCallback(() => {
    setStealthMode((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(STEALTH_KEY, String(next));
      } catch { /* sessionStorage no disponible */ }
      return next;
    });
  }, []);

  const enableStealth = useCallback(() => {
    setStealthMode(true);
    try { sessionStorage.setItem(STEALTH_KEY, 'true'); } catch { /* noop */ }
  }, []);

  const disableStealth = useCallback(() => {
    setStealthMode(false);
    try { sessionStorage.setItem(STEALTH_KEY, 'false'); } catch { /* noop */ }
  }, []);

  // ── Atajo de teclado global: H  (ignorado si foco en input/textarea) ────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si foco en campo de texto
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (document.activeElement?.isContentEditable) return;

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        toggleStealth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleStealth]);

  /**
   * Máscara de valor de conveniencia (ya enlazada al estado de stealth).
   * @param {number} value
   * @param {string} [currency]
   * @param {string} [locale]
   */
  const maskValue = useCallback(
    (value, currency = 'MXN', locale = 'es-MX') =>
      formatMasked(value, currency, locale, stealthMode),
    [stealthMode]
  );

  return (
    <StealthContext.Provider
      value={{
        stealthMode,
        toggleStealth,
        enableStealth,
        disableStealth,
        maskValue,
        MASK,
      }}
    >
      {/* Indicador visual accesible del modo stealth */}
      {stealthMode && (
        <div
          id="stealth-banner"
          role="status"
          aria-live="polite"
          aria-label="Modo Privacidad activo — los saldos están ocultos. Presiona H para desactivar."
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            padding: '6px 16px',
            background: 'rgba(4, 26, 20, 0.92)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.78rem',
            color: '#10b981',
            fontFamily: 'var(--font-ui, system-ui)',
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '1rem' }}>🛡️</span>
          <span>
            <strong>MODO PRIVACIDAD ACTIVO</strong> — Los saldos están ocultos.
            Presiona{' '}
            <kbd
              style={{
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              H
            </kbd>{' '}
            para desactivar.
          </span>
          <button
            onClick={disableStealth}
            aria-label="Desactivar modo privacidad"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '4px',
              color: '#10b981',
              cursor: 'pointer',
              padding: '2px 10px',
              fontSize: '0.75rem',
            }}
          >
            Mostrar
          </button>
        </div>
      )}
      {children}
    </StealthContext.Provider>
  );
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────

export function useStealth() {
  const ctx = useContext(StealthContext);
  if (!ctx) {
    throw new Error('useStealth debe usarse dentro de <StealthProvider>');
  }
  return ctx;
}
