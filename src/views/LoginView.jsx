import React, { useState } from 'react';

export default function LoginView({ onUnlock }) {
  const [passphrase, setPassphrase] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passphrase.trim()) {
      onUnlock?.(passphrase);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', margin: '0 auto 1.5rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,78,59,0.6))', border: '1px solid rgba(52,211,153,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: '0.5rem' }}>Desbloquear Bóveda</h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Introduce tu frase de paso maestra para descifrar tus datos financieros en memoria.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Introduce tu frase maestra..."
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff',
              fontSize: 'var(--font-size-base)',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className="glass-pill emerald"
            style={{
              padding: '0.85rem',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            Desbloquear con AES-256
          </button>
        </form>
      </div>
    </div>
  );
}
