import React from 'react';
import { formatCurrency } from '../utils';

export default function BudgetsView() {
  const envelopes = [
    { id: 'b1', name: 'Vivienda & Servicios', allocated: 1800, spent: 1750, icon: '🏠' },
    { id: 'b2', name: 'Alimentación & Supermercado', allocated: 700, spent: 520, icon: '🥑' },
    { id: 'b3', name: 'Transporte & Movilidad', allocated: 350, spent: 180, icon: '🚗' },
    { id: 'b4', name: 'Ocio, Restaurantes & Cultura', allocated: 450, spent: 480, icon: '🎭' },
    { id: 'b5', name: 'Formación & Libros', allocated: 200, spent: 65, icon: '📚' },
  ];

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
          <span>Metodología Zero-Based Envelopes</span>
        </div>
        <h1 className="text-gradient-emerald">Presupuesto por Sobres</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Asignación mensual por categorías con límites inteligentes y alertas dinámicas.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {envelopes.map((env) => {
          const percent = Math.min(100, Math.round((env.spent / env.allocated) * 100));
          const isOver = env.spent > env.allocated;

          return (
            <div key={env.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{env.icon}</span>
                  <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>{env.name}</h3>
                </div>
                <span className={`glass-pill ${isOver ? 'danger' : percent > 85 ? 'gold' : 'emerald'}`} style={{ fontSize: 'var(--font-size-2xs)' }}>
                  {percent}% consumido
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '1rem 0' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: isOver 
                      ? 'linear-gradient(90deg, #f43f5e, #e11d48)' 
                      : percent > 85 
                        ? 'linear-gradient(90deg, #e2c275, #f59e0b)' 
                        : 'linear-gradient(90deg, #10b981, #34d399)',
                    borderRadius: 'var(--radius-full)',
                    boxShadow: isOver ? '0 0 8px rgba(244,63,94,0.5)' : '0 0 8px rgba(16,185,129,0.4)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                <span>Gastado: <strong className="num-mono" style={{ color: isOver ? 'var(--color-expense)' : 'var(--text-primary)' }}>{formatCurrency(env.spent)}</strong></span>
                <span>Límite: <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(env.allocated)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
