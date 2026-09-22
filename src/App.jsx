import React from 'react';

export default function App() {
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <main style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
              AuraFinance Enterprise v1.0
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              Bóveda de Inteligencia Financiera
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
              Diseño de alta precisión con tecnología Emerald Glass y cifrado Cero-Conocimiento.
            </p>
          </div>
          <div className="glass-pill gold">
            Seguridad AES-256 Activa
          </div>
        </header>

        {/* Demo Panels for Design Tokens */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-card">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Patrimonio Neto Total</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary-light)', margin: '0.5rem 0' }}>
              $142,850.00
            </div>
            <div className="glass-pill emerald">
              +14.2% este mes
            </div>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Flujo de Caja Disponible</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.5rem 0' }}>
              $18,420.50
            </div>
            <div className="glass-pill gold">
              6.2 meses de Runway
            </div>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Billeteras Cifradas</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent-gold)', margin: '0.5rem 0' }}>
              5 Activas
            </div>
            <div className="glass-pill">
              Cero-Conocimiento OK
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
