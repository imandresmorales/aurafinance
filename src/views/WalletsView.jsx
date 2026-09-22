import React from 'react';
import { formatCurrency } from '../utils';

export default function WalletsView() {
  const wallets = [
    { id: 'w1', name: 'Cuenta Principal Nómina', type: 'Banco', balance: 12450.00, currency: 'USD', color: 'emerald' },
    { id: 'w2', name: 'Caja Fuerte Efectivo', type: 'Efectivo', balance: 1800.00, currency: 'USD', color: 'gold' },
    { id: 'w3', name: 'Bóveda de Inversión Indexada', type: 'Inversión', balance: 115600.75, currency: 'USD', color: 'emerald' },
    { id: 'w4', name: 'Tarjeta Débito Viajes', type: 'Billetera Digital', balance: 4170.50, currency: 'EUR', color: 'cyan' },
    { id: 'w5', name: 'Tarjeta Crédito Platinum', type: 'Pasivo / Crédito', balance: -2450.00, currency: 'USD', color: 'danger' },
  ];

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
            <span>Gestor de Cuentas Multidivisa</span>
          </div>
          <h1 className="text-gradient-emerald">Billeteras & Cuentas</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Administración de cuentas bancarias, efectivo, tarjetas y fondos de inversión.
          </p>
        </div>
        <button type="button" className="glass-pill emerald" style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
          + Nueva Cuenta
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {wallets.map((wallet) => (
          <div key={wallet.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="glass-pill">{wallet.type}</span>
              <span className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{wallet.currency}</span>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{wallet.name}</h3>
            <div className={`num-mono ${wallet.balance < 0 ? 'text-danger' : 'text-gradient-emerald'}`} style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.5rem 0' }}>
              {formatCurrency(wallet.balance, wallet.currency)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Cifrado E2EE</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-light)', cursor: 'pointer' }}>Ver Movimientos →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
