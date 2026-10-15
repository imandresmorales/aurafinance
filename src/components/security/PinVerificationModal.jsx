import React, { useState } from 'react';
import { verifyPinHash } from '../../crypto/vaultCryptoEngine';

/**
 * PinVerificationModal Component
 * Modal de seguridad que exige el reingreso del PIN de la bóveda
 * antes de permitir operaciones críticas (ej. exportar llaves, restaurar o borrar datos).
 */
export const PinVerificationModal = ({
  isOpen,
  title = 'Confirmación de Seguridad',
  description = 'Por favor, ingresa tu PIN de la bóveda para autorizar esta operación.',
  onConfirm,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Debes ingresar un PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const storedHash = localStorage.getItem('aura_autolock_pin_hash');
      if (storedHash) {
        const isValid = await verifyPinHash(pin, storedHash);
        if (!isValid) {
          setError('PIN incorrecto. Intenta nuevamente.');
          setIsVerifying(false);
          return;
        }
      }

      onConfirm(pin);
      setPin('');
    } catch (err) {
      setError('Error validando el PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99998,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '100%',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: '#10b981' }}>
          🔒 {title}
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.4' }}>
          {description}
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="password"
            maxLength={12}
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            placeholder="••••"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: error ? '1px solid #ef4444' : '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#fff',
              fontSize: '1.25rem',
              letterSpacing: '4px',
              textAlign: 'center',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '12px',
            }}
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0 0 12px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setPin('');
                setError('');
                onCancel();
              }}
              disabled={isVerifying}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid #475569',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying || !pin}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                backgroundColor: '#10b981',
                color: '#064e3b',
                fontWeight: '600',
                border: 'none',
                cursor: isVerifying || !pin ? 'not-allowed' : 'pointer',
              }}
            >
              {isVerifying ? 'Verificando...' : 'Autorizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinVerificationModal;
