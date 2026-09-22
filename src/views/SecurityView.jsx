import React, { useState } from 'react';
import { generateSalt, deriveMasterKey, deriveAuthHash, bufferToBase64, isWebCryptoSupported } from '../crypto';

export default function SecurityView() {
  const [testPassphrase, setTestPassphrase] = useState('AuraFinanceSecureVault2026!');
  const [iterations, setIterations] = useState(100000);
  const [isDeriving, setIsDeriving] = useState(false);
  const [derivationResult, setDerivationResult] = useState(null);

  const handleTestDerivation = async () => {
    try {
      setIsDeriving(true);
      const startTime = performance.now();
      
      const salt = generateSalt(16);
      const saltBase64 = bufferToBase64(salt);
      const masterKey = await deriveMasterKey(testPassphrase, salt, iterations);
      const authHash = await deriveAuthHash(testPassphrase, salt, iterations);
      
      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - startTime);

      setDerivationResult({
        success: true,
        salt: saltBase64,
        authHash: authHash.substring(0, 32) + '...',
        keyAlgorithm: `${masterKey.algorithm.name} (${masterKey.algorithm.length} bits)`,
        keyExtractable: masterKey.extractable ? 'Sí' : 'No (Protegida en Hardware/Memoria Segura)',
        elapsedMs,
      });
    } catch (err) {
      setDerivationResult({
        success: false,
        error: err.message,
      });
    } finally {
      setIsDeriving(false);
    }
  };

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
          <span>Blindaje & Privacidad Bancaria</span>
        </div>
        <h1 className="text-gradient-emerald">Bóveda Criptográfica & Seguridad</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Administración de llaves maestras, derivación PBKDF2 y cifrado Cero-Conocimiento en cliente.
        </p>
      </header>

      {/* Security Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <div className="glass-pill emerald" style={{ marginBottom: '1rem' }}>
            <span>WEB CRYPTO API ACTIVA</span>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Entorno Criptográfico Seguro
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Soporte nativo: <strong>{isWebCryptoSupported() ? '✅ Totalmente Soportado' : '❌ No Disponible'}</strong>.
            Criptografía acelerada por hardware en el navegador sin enviar secretos a servidores.
          </p>
        </div>

        <div className="glass-card">
          <div className="glass-pill gold" style={{ marginBottom: '1rem' }}>
            <span>AUTENTICACIÓN BLINDADA</span>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Derivación PBKDF2 (SHA-256)
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Protección contra ataques de fuerza bruta y diccionarios con 100,000 iteraciones y sales aleatorias de 128 bits.
          </p>
        </div>
      </div>

      {/* Interactive Cryptographic Derivation Sandbox */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary-light)' }}>
          Simulador de Derivación de Clave Maestra en Vivo
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Prueba el rendimiento y la robustez del motor PBKDF2 en tiempo real directamente en tu dispositivo.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Frase de Paso de Prueba:
            </label>
            <input
              type="text"
              value={testPassphrase}
              onChange={(e) => setTestPassphrase(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.4)',
                border: 'var(--border-glass)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Iteraciones PBKDF2:
            </label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.4)',
                border: 'var(--border-glass)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
        </div>

        <button
          type="button"
          className="glass-pill emerald"
          onClick={handleTestDerivation}
          disabled={isDeriving}
          style={{ padding: '0.75rem 1.5rem', cursor: isDeriving ? 'wait' : 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}
        >
          {isDeriving ? 'Derivando clave maestra...' : '⚡ Ejecutar Derivación Criptográfica'}
        </button>

        {derivationResult && (
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-light)', marginBottom: '0.75rem' }}>
              Resultado de la Operación Criptográfica:
            </h4>
            {derivationResult.success ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Algoritmo Derivado:</span> <strong style={{ color: '#fff' }}>{derivationResult.keyAlgorithm}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Sal Generada (Base64):</span> <span style={{ color: 'var(--color-accent-gold)' }}>{derivationResult.salt}</span></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Hash de Verificación:</span> <span style={{ color: 'var(--color-primary-light)' }}>{derivationResult.authHash}</span></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Extracción Bloqueada:</span> <strong style={{ color: '#fff' }}>{derivationResult.keyExtractable}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Tiempo de Ejecución:</span> <strong style={{ color: 'var(--color-primary-light)' }}>{derivationResult.elapsedMs} ms</strong></div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>Error: {derivationResult.error}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
