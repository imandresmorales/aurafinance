import React from 'react';
import { formatCurrency } from '../utils';

export default function GoalsView() {
  const goals = [
    { id: 'g1', name: 'Fondo de Emergencia (6 Meses)', target: 20000, current: 18420, deadline: '2026-12-31' },
    { id: 'g2', name: 'Inversión Retiro Temprano (FIRE)', target: 500000, current: 115600, deadline: '2035-01-01' },
    { id: 'g3', name: 'Viaje a Japón en Primavera', target: 6000, current: 4100, deadline: '2027-04-15' },
  ];

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
          <span>Metas & Interés Compuesto</span>
        </div>
        <h1 className="text-gradient-emerald">Metas Financieras & Libertad FIRE</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Planificación de objetivos de ahorro, proyecciones compuestas y estimación de fechas de cumplimiento.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {goals.map((g) => {
          const progress = Math.min(100, Math.round((g.current / g.target) * 100));
          return (
            <div key={g.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>{g.name}</h3>
                <span className="glass-pill emerald" style={{ fontSize: 'var(--font-size-2xs)' }}>{progress}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '1rem 0' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #10b981, #e2c275)', borderRadius: 'var(--radius-full)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                <span>Actual: <strong className="num-mono" style={{ color: 'var(--color-primary-light)' }}>{formatCurrency(g.current)}</strong></span>
                <span>Objetivo: <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(g.target)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
