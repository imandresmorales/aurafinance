import React from 'react';
import { formatCurrency } from '../utils';

export default function DebtsView() {
  const debts = [
    { id: 'd1', name: 'Tarjeta Crédito Platinum', balance: 2450, interestRate: '18.5%', minPayment: 120, strategy: 'Avalancha' },
    { id: 'd2', name: 'Préstamo Auto Ecológico', balance: 13050, interestRate: '6.2%', minPayment: 310, strategy: 'Bola de Nieve' },
  ];

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
          <span>Optimizador de Pasivos</span>
        </div>
        <h1 className="text-gradient-emerald">Gestor & Amortización de Deudas</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Simulación de estrategias Bola de Nieve vs Avalancha y reducción de intereses.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {debts.map((d) => (
          <div key={d.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>{d.name}</h3>
              <span className="glass-pill" style={{ color: 'var(--color-danger)', borderColor: 'rgba(244,63,94,0.3)', fontSize: 'var(--font-size-2xs)' }}>
                {d.interestRate} TAE
              </span>
            </div>
            <div className="num-mono" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-danger)', margin: '0.5rem 0' }}>
              {formatCurrency(d.balance)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              <span>Pago Mínimo: <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(d.minPayment)}/mes</strong></span>
              <span>Prioridad: <strong>{d.strategy}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
