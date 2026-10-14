import React, { useState } from 'react';
import { logAuditEvent, AuditEvent } from '../../services/auditLogEngine';

/**
 * PanicWipeButton Component
 * Destrucción segura y de emergencia de todos los datos locales de la bóveda
 * con doble confirmación blindada (escribir palabra clave de seguridad).
 */
export const PanicWipeButton = ({ onWipeComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const REQUIRED_PHRASE = 'BORRAR TODO';

  const handlePanicWipe = async () => {
    if (confirmPhrase.trim().toUpperCase() !== REQUIRED_PHRASE) return;

    setIsProcessing(true);
    try {
      // Registrar evento de pánico antes de purgar
      try {
        await logAuditEvent(AuditEvent.PANIC_WIPE_TRIGGERED, {
          timestamp: new Date().toISOString(),
          reason: 'User triggered panic wipe'
        });
      } catch (e) {
        // Fallback silencioso para no bloquear la eliminación crítica
      }

      // 1. Sobreescribir con ceros/basura antes de remover para dificultar recuperación
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          localStorage.setItem(key, '0'.repeat(1024));
        }
      }

      // 2. Limpieza exhaustiva de almacenamiento
      localStorage.clear();
      sessionStorage.clear();

      // 3. Notificar bloqueo/cierre de sesión
      window.dispatchEvent(new CustomEvent('aura:session-locked'));
      window.dispatchEvent(new CustomEvent('aura:vault-wiped'));

      if (onWipeComplete) {
        onWipeComplete();
      } else {
        window.location.reload();
      }
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn-danger panic-wipe-btn"
        onClick={() => setIsOpen(true)}
        title="Destrucción Segura de la Bóveda"
        style={{
          backgroundColor: '#dc2626',
          color: '#ffffff',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '8px 16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>🚨</span> Botón de Pánico
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="panic-wipe-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              color: '#f8fafc',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
            }}
          >
            <h3 id="panic-wipe-title" style={{ margin: '0 0 12px', color: '#ef4444', fontSize: '1.25rem' }}>
              ⚠️ Destrucción Total de Emergencia
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.5' }}>
              Esta acción es <strong>irreversible</strong>. Se sobreescribirán y eliminarán permanentemente todas las
              cuentas, transacciones, llaves criptográficas y bitácoras locales de este dispositivo.
            </p>
            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
              Para confirmar, escribe <strong>{REQUIRED_PHRASE}</strong>:
            </p>
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder={REQUIRED_PHRASE}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#fff',
                fontSize: '0.95rem',
                marginBottom: '20px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setConfirmPhrase('');
                }}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePanicWipe}
                disabled={confirmPhrase.trim().toUpperCase() !== REQUIRED_PHRASE || isProcessing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor:
                    confirmPhrase.trim().toUpperCase() === REQUIRED_PHRASE ? '#dc2626' : '#7f1d1d',
                  color: '#fff',
                  border: 'none',
                  cursor:
                    confirmPhrase.trim().toUpperCase() === REQUIRED_PHRASE ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                {isProcessing ? 'Destruyendo...' : 'Confirmar Destrucción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PanicWipeButton;
