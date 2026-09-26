import React, { useState, useEffect } from 'react';
import { useAccounts } from '../hooks';
import { formatCurrency } from '../utils';
import { OnboardingWizard, DashboardBalanceCards } from '../components';

export default function DashboardView() {
  const { accounts, transactions } = useAccounts();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Comprobar si es el primer inicio para sugerir el tour de inducción
  useEffect(() => {
    try {
      const completed = localStorage.getItem('aura_onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    } catch {
      // Ignorar si storage no accesible
    }
  }, []);

  const reconciledCount = transactions.filter((t) => t.reconciled).length;

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
            <span>Visión General Patrimonial</span>
          </div>
          <h1 className="text-gradient-emerald">Panel de Control Financiero</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: 'var(--font-size-base)' }}>
            Resumen en tiempo real de liquidez, presupuestos por sobres y rendimiento de tus activos.
          </p>
        </div>

        <button
          type="button"
          className="glass-pill gold"
          onClick={() => setShowOnboarding(true)}
          style={{ cursor: 'pointer', padding: '0.65rem 1.25rem', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}
        >
          ✨ Tour de Inducción
        </button>
      </header>

      {/* Reactive Multi-Period KPI Balance Cards */}
      <DashboardBalanceCards />

      {/* Quick Access Grid */}
      <section className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-primary-light)' }}>
          Auditoría Contable & Estado del Sistema
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Cuentas & Conciliación</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              {accounts.length} billeteras activas · {reconciledCount} de {transactions.length} asientos conciliados.
            </p>
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Cifrado Zero-Knowledge</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Bóveda protegida con AES-256-GCM y PBKDF2 (100k iteraciones SHA-256).
            </p>
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Partida Doble Balanceada</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              Libro Mayor íntegro con consistencia matemática en cada movimiento contable.
            </p>
          </div>
        </div>
      </section>

      {/* Financial Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
