import React from 'react';
import { formatCurrency } from '../utils';

export default function AnalyticsView() {
  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
          <span>Motor de Inteligencia & Visualización</span>
        </div>
        <h1 className="text-gradient-emerald">Analítica & Flujo de Fondos</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Visualización de tendencias de consumo, análisis de flujo de caja y distribución patrimonial.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-primary-light)', marginBottom: '1rem' }}>
            Distribución de Gastos (Mes Actual)
          </h3>
          <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Vivienda (45%) • Alimentación (20%) • Inversión (25%) • Otros (10%)
            </p>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-accent-gold)', marginBottom: '1rem' }}>
            Proyección de Flujo a 90 Días
          </h3>
          <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Superávit neto proyectado: <strong className="num-mono" style={{ color: 'var(--color-primary-light)' }}>+{formatCurrency(12750)}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
