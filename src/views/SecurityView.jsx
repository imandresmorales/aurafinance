import React, { useState } from 'react';
import {
  generateSalt,
  deriveMasterKey,
  deriveAuthHash,
  bufferToBase64,
  isWebCryptoSupported,
  encryptData,
  decryptData,
} from '../crypto';

export default function SecurityView() {
  const [testPassphrase, setTestPassphrase] = useState('AuraFinanceMasterKey2026!');
  const [iterations, setIterations] = useState(100000);
  const [isDeriving, setIsDeriving] = useState(false);
  const [derivationResult, setDerivationResult] = useState(null);

  // AES-256-GCM Interactive Demo State
  const [secretSampleJson, setSecretSampleJson] = useState('{\n  "balance": 142850.75,\n  "account": "Bóveda Suiza #8839",\n  "currency": "USD"\n}');
  const [encryptedPayload, setEncryptedPayload] = useState(null);
  const [decryptedResult, setDecryptedResult] = useState(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

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

      setActiveKey(masterKey);
      setDerivationResult({
        success: true,
        salt: saltBase64,
        authHash: authHash.substring(0, 32) + '...',
        keyAlgorithm: `${masterKey.algorithm.name} (${masterKey.algorithm.length} bits)`,
        keyExtractable: masterKey.extractable ? 'Sí' : 'No (Protegida en Memoria Segura)',
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

  const handleEncryptData = async () => {
    try {
      setIsEncrypting(true);
      let key = activeKey;
      if (!key) {
        const salt = generateSalt(16);
        key = await deriveMasterKey(testPassphrase, salt, 100000);
        setActiveKey(key);
      }

      const parsedData = JSON.parse(secretSampleJson);
      const payload = await encryptData(parsedData, key);
      setEncryptedPayload(payload);
      setDecryptedResult(null);
    } catch (err) {
      alert(`Error al cifrar: ${err.message}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecryptData = async () => {
    try {
      if (!encryptedPayload || !activeKey) {
        alert('Primero cifra los datos para poder descifrarlos.');
        return;
      }
      const decrypted = await decryptData(encryptedPayload, activeKey);
      setDecryptedResult(JSON.stringify(decrypted, null, 2));
    } catch (err) {
      alert(`Error al descifrar: ${err.message}`);
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
            AES-256-GCM + PBKDF2
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Protección de datos mediante IV de 96 bits aleatorio por cada registro y tag de autenticación de 128 bits.
          </p>
        </div>
      </div>

      {/* Interactive Cryptographic Derivation Sandbox */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary-light)' }}>
          1. Derivación de Clave Maestra con PBKDF2 (SHA-256)
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Genera una sal criptográfica segura y deriva una clave maestra simétrica de 256 bits en memoria.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Frase de Paso Maestra:
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
              Resultado de la Derivación:
            </h4>
            {derivationResult.success ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Algoritmo:</span> <strong style={{ color: '#fff' }}>{derivationResult.keyAlgorithm}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Sal Aleatoria (Base64):</span> <span style={{ color: 'var(--color-accent-gold)' }}>{derivationResult.salt}</span></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Hash de Autenticación:</span> <span style={{ color: 'var(--color-primary-light)' }}>{derivationResult.authHash}</span></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Tiempo de Ejecución:</span> <strong style={{ color: 'var(--color-primary-light)' }}>{derivationResult.elapsedMs} ms</strong></div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>Error: {derivationResult.error}</p>
            )}
          </div>
        )}
      </section>

      {/* AES-256-GCM Data Vault Live Encryption Sandbox */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--color-accent-gold)' }}>
          2. Cifrado & Descifrado de Carga Financiera con AES-256-GCM
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Prueba el cifrado simétrico autenticado antes de persistir los registros en la base de datos local.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Datos Financieros Sensibles (JSON):
          </label>
          <textarea
            rows={4}
            value={secretSampleJson}
            onChange={(e) => setSecretSampleJson(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0,0,0,0.4)',
              border: 'var(--border-glass)',
              color: '#34d399',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-xs)',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="glass-pill emerald"
            onClick={handleEncryptData}
            disabled={isEncrypting}
            style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}
          >
            🔒 Cifrar con AES-256-GCM
          </button>
          <button
            type="button"
            className="glass-pill gold"
            onClick={handleDecryptData}
            disabled={!encryptedPayload}
            style={{ padding: '0.75rem 1.5rem', cursor: encryptedPayload ? 'pointer' : 'not-allowed', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}
          >
            🔓 Descifrar Carga Útil
          </button>
        </div>

        {encryptedPayload && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(226,194,117,0.3)' }}>
            <h4 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-gold)', marginBottom: '0.5rem' }}>
              Carga Cifrada Persistible (Ciphertext + IV aleatorio):
            </h4>
            <div style={{ fontSize: 'var(--font-size-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', wordBreak: 'break-all', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>IV (96-bit):</strong> <span style={{ color: 'var(--color-primary-light)' }}>{encryptedPayload.iv}</span></div>
              <div><strong>Ciphertext:</strong> <span>{encryptedPayload.ciphertext}</span></div>
              <div><strong>Tag Autenticación:</strong> <span>{encryptedPayload.tagLength} bits GCM</span></div>
            </div>
          </div>
        )}

        {decryptedResult && (
          <div style={{ padding: '1rem', background: 'rgba(6,35,26,0.6)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.5)' }}>
            <h4 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-light)', marginBottom: '0.5rem' }}>
              Datos Descifrados con Integridad Verificada:
            </h4>
            <pre style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: '#fff' }}>
              {decryptedResult}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
