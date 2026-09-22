import React from 'react';
import { formatCurrency } from '../utils';

export default function DashboardView() {
  const netWorth = 142850.75;
  const cashFlow = 18420.50;
  const monthlySavings = 4250.00;

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
          <span>Visión General Patrimonial</span>
        </div>
        <h1 className="text-gradient-emerald">Panel de Control Financiero</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: 'var(--font-size-base)' }}>
          Resumen en tiempo real de liquidez, presupuestos por sobres y rendimiento de tus activos.
        </p>
      </header>

      {/* Main Metric Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Patrimonio Neto Total
            </span>
            <span className="glass-pill emerald" style={{ fontSize: 'var(--font-size-xs)' }}>+14.2%</span>
          </div>
          <div className="num-mono text-gradient-emerald" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, margin: '0.25rem 0 0.75rem 0' }}>
            {formatCurrency(netWorth, 'USD')}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Activos $158,350 • Pasivos $15,500
          </p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Liquidez Inmediata
            </span>
            <span className="glass-pill gold" style={{ fontSize: 'var(--font-size-xs)' }}>6.2 Meses Runway</span>
          </div>
          <div className="num-mono text-gradient-gold" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, margin: '0.25rem 0 0.75rem 0' }}>
            {formatCurrency(cashFlow, 'USD')}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Disponible en cuentas corrientes y efectivo
          </p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Capacidad de Ahorro
            </span>
            <span className="glass-pill emerald" style={{ fontSize: 'var(--font-size-xs)' }}>32% Tasa</span>
          </div>
          <div className="num-mono" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary-light)', margin: '0.25rem 0 0.75rem 0' }}>
            {formatCurrency(monthlySavings, 'USD')}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Aportado este mes a metas FIRE
          </p>
        </div>
      </section>

      {/* Quick Access Grid */}
      <section className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-primary-light)' }}>
          Operaciones Recientes & Estado del Sistema
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Cuentas Conciliadas</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>5 de 5 billeteras verificadas con hash criptográfico.</p>
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Regla 50/30/20</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Necesidades: 48% • Deseos: 20% • Ahorro: 32%.</p>
          </div>
          <div style={{ padding: '1.25rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Próximo Pago</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Servidor Cloud ($45.00) en 4 días.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
