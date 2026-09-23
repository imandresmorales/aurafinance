import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { RateLimiter } from '../utils';
import { Input, Button } from '../components';

export default function LoginView() {
  const { unlockVault, isInitialized } = useAuth();
  const navigate = useNavigate();

  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutStatus, setLockoutStatus] = useState(() => RateLimiter.checkStatus());

  // Countdown timer for brute force cooldown
  useEffect(() => {
    let timer = null;
    if (lockoutStatus.isLockedOut && lockoutStatus.remainingSeconds > 0) {
      timer = setInterval(() => {
        setLockoutStatus(RateLimiter.checkStatus());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutStatus.isLockedOut, lockoutStatus.remainingSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const status = RateLimiter.checkStatus();
    if (status.isLockedOut) {
      setError(`Demasiados intentos fallidos. Espera ${status.remainingSeconds} segundos.`);
      return;
    }

    if (!passphrase.trim()) {
      setError('Por favor introduce tu frase de paso maestra.');
      return;
    }

    try {
      setIsLoading(true);
      await unlockVault(passphrase);
      RateLimiter.reset();
      navigate('/');
    } catch (err) {
      const updatedStatus = RateLimiter.recordFailure();
      setLockoutStatus(updatedStatus);
      if (updatedStatus.isLockedOut) {
        setError(`Acceso denegado. Bloqueado temporalmente por ${updatedStatus.remainingSeconds}s.`);
      } else {
        setError(`Frase incorrecta. Intentos restantes antes de bloqueo: ${3 - (updatedStatus.failedAttempts % 3)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', margin: '0 auto 1.5rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,78,59,0.6))', border: '1px solid rgba(52,211,153,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)', boxShadow: '0 0 16px rgba(16,185,129,0.2)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Desbloquear Bóveda
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Introduce tu frase de paso maestra para derivar tus llaves AES-256 en memoria volátil.
        </p>

        {lockoutStatus.isLockedOut && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(226,194,117,0.15)',
              border: 'var(--border-gold)',
              color: 'var(--color-accent-gold)',
              fontSize: 'var(--font-size-xs)'
            }}
          >
            ⏱️ Protección activa: reintenta en <strong className="num-mono">{lockoutStatus.remainingSeconds}s</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Frase de Paso Maestra"
            type="password"
            required
            disabled={lockoutStatus.isLockedOut || isLoading}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Introduce tu frase maestra..."
            error={error}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={lockoutStatus.isLockedOut}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? 'Derivando clave PBKDF2...' : 'Desbloquear Bóveda AES-256'}
          </Button>
        </form>

        <footer style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            {!isInitialized ? (
              <>
                ¿Primera vez en AuraFinance?{' '}
                <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                  Crear una nueva Bóveda Cero-Conocimiento
                </Link>
              </>
            ) : (
              <span>Bóveda inicializada localmente con cifrado E2EE</span>
            )}
          </p>
        </footer>
      </div>
    </div>
  );
}
