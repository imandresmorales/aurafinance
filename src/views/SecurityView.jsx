import React from 'react';

export default function SecurityView() {
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card">
          <div className="glass-pill emerald" style={{ marginBottom: '1rem' }}>
            <span>AES-256-GCM ACTIVO</span>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Cifrado de Base de Datos Local
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Todas tus transacciones, montos y descripciones se cifran simétricamente en tu navegador antes de tocar IndexedDB. Nadie más tiene tu llave maestra.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="glass-pill gold" style={{ cursor: 'pointer' }}>
              Probar Verificador Criptográfico
            </button>
          </div>
        </div>

        <div className="glass-card">
          <div className="glass-pill gold" style={{ marginBottom: '1rem' }}>
            <span>AUTENTICACIÓN BLINDADA</span>
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Derivación de Clave PBKDF2
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            100,000 iteraciones SHA-256 con sal criptográfica única de 16 bytes generada mediante Web Crypto API.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="glass-pill emerald" style={{ cursor: 'pointer' }}>
              Exportar Respaldo Cifrado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
