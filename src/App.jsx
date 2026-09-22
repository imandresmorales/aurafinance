import React, { useState } from 'react';
import { AppLayout } from './components';
import { formatCurrency } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const netWorth = 142850.75;
  const cashFlow = 18420.50;
  const monthlySavings = 4250.00;

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      <header style={{ marginBottom: '2.5rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '1rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)' }} />
          <span>Vista Activa: {activeTab.toUpperCase()}</span>
        </div>
        <h1 className="text-gradient-emerald">
          Bóveda de Inteligencia Financiera
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: 'var(--font-size-lg)', maxWidth: '650px' }}>
          Gestión patrimonial de alta precisión, control de gastos multidivisa y criptoseguridad Cero-Conocimiento.
        </p>
      </header>

      {/* Metrics Showcase using Typography & Tokens */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Patrimonio Neto Consolidado
            </span>
            <span className="glass-pill emerald" style={{ fontSize: 'var(--font-size-xs)' }}>+14.2%</span>
          </div>
          <div className="num-mono text-gradient-emerald" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, margin: '0.25rem 0 0.75rem 0' }}>
            {formatCurrency(netWorth, 'USD')}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Calculado en tiempo real sobre 5 cuentas activas
          </p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Liquidez Disponible
            </span>
            <span className="glass-pill gold" style={{ fontSize: 'var(--font-size-xs)' }}>6.2 Meses Runway</span>
          </div>
          <div className="num-mono text-gradient-gold" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, margin: '0.25rem 0 0.75rem 0' }}>
            {formatCurrency(cashFlow, 'USD')}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Fondo de emergencia cubierto al 100%
          </p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Capacidad de Ahorro Mensual
            </span>
            <span className="glass-pill emerald" style={{ fontSize: 'var(--font-size-xs)' }}>32% Tasa</span>
          </div>
          <div className="num-mono" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary-light)', margin: '0.25rem 0 0.75rem 0' }}>
            {formatCurrency(monthlySavings, 'USD')}
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            Objetivo 50/30/20 en curso
          </p>
        </div>
      </section>

      {/* Overview Modules */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-primary-light)' }}>
          Módulos del Ecosistema AuraFinance
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Presupuesto por Sobres</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Distribución Zero-Based con alertas dinámicas y regla 50/30/20.</p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Visualización Vectorial</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Gráficos Sankey, Heatmaps y Cash Flow Timeline SVG a 60 FPS.</p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Asesoría y Salud</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Algoritmos de detección de fugas hormiga y metas compuestas FIRE.</p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(6, 35, 26, 0.4)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Offline-First & CRDT</h4>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>IndexedDB transaccional con sincronización y exportación cifrada.</p>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
