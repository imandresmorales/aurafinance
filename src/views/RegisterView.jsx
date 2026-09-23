import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { calculatePasswordEntropy } from '../utils';

export default function RegisterView() {
  const { registerVault } = useAuth();
  const navigate = useNavigate();

  const [alias, setAlias] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const entropy = calculatePasswordEntropy(passphrase);
  const passwordsMatch = passphrase && passphrase === confirmPassphrase;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!alias.trim()) {
      setError('Por favor introduce un nombre o alias para identificar tu bóveda.');
      return;
    }

    if (!entropy.isStrong) {
      setError('La frase de paso maestra debe ser de fortaleza Robusta o Grado Bancario.');
      return;
    }

    if (!passwordsMatch) {
      setError('Las frases de paso no coinciden.');
      return;
    }

    if (!acceptedDisclaimer) {
      setError('Debes confirmar que comprendes que AuraFinance no puede recuperar tu frase si la pierdes.');
      return;
    }

    try {
      setIsLoading(true);
      await registerVault(alias, passphrase);
      navigate('/');
    } catch (err) {
      setError(`Error al inicializar bóveda: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="glass-pill emerald" style={{ marginBottom: '1rem' }}>
            <span>Arquitectura Cero-Conocimiento</span>
          </div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Crear Bóveda Financiera
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Tus datos se cifrarán localmente con AES-256-GCM. Solo tú tendrás la llave maestra.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244,63,94,0.15)',
              border: '1px solid rgba(244,63,94,0.4)',
              color: '#fecdd3',
              fontSize: 'var(--font-size-xs)'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="reg-alias" style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Nombre / Alias del Titular:
            </label>
            <input
              id="reg-alias"
              type="text"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej. Bóveda Personal de Alex"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.4)',
                border: 'var(--border-glass)',
                color: '#fff',
                fontSize: 'var(--font-size-sm)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label htmlFor="reg-passphrase" style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Frase de Paso Maestra:
            </label>
            <input
              id="reg-passphrase"
              type="password"
              required
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Crea una frase de paso sólida..."
              aria-describedby="entropy-feedback"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.4)',
                border: 'var(--border-glass)',
                color: '#fff',
                fontSize: 'var(--font-size-sm)',
                outline: 'none'
              }}
            />

            {/* Entropy Meter */}
            {passphrase && (
              <div id="entropy-feedback" style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-2xs)', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Seguridad: <strong style={{ color: entropy.color }}>{entropy.label}</strong></span>
                  <span className="num-mono" style={{ color: 'var(--text-tertiary)' }}>{entropy.entropyBits} bits</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(entropy.score / 4) * 100}%`,
                      backgroundColor: entropy.color,
                      transition: 'width var(--transition-normal), background-color var(--transition-normal)'
                    }}
                  />
                </div>
                {entropy.suggestions.length > 0 && (
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: 'var(--font-size-2xs)', color: 'var(--text-tertiary)' }}>
                    {entropy.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reg-confirm-passphrase" style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Confirmar Frase de Paso:
            </label>
            <input
              id="reg-confirm-passphrase"
              type="password"
              required
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="Repite la frase de paso..."
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.4)',
                border: passwordsMatch ? '1px solid rgba(16,185,129,0.5)' : 'var(--border-glass)',
                color: '#fff',
                fontSize: 'var(--font-size-sm)',
                outline: 'none'
              }}
            />
          </div>

          {/* Zero-Knowledge Disclaimer */}
          <div style={{ padding: '0.85rem', background: 'rgba(226,194,117,0.08)', borderRadius: 'var(--radius-md)', border: 'var(--border-gold)' }}>
            <label style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', cursor: 'pointer', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={acceptedDisclaimer}
                onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
              />
              <span>
                Entiendo que al ser Cero-Conocimiento, si olvido mi frase de paso, mis datos no podrán ser recuperados.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="glass-pill emerald"
            style={{
              padding: '0.9rem',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              justifyContent: 'center',
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {isLoading ? 'Derivando claves y creando bóveda...' : 'Inicializar Bóveda Cifrada'}
          </button>
        </form>

        <footer style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            ¿Ya tienes una bóveda creada?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
              Desbloquear Bóveda
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
