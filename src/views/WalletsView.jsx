import React, { useState } from 'react';
import { useAccounts } from '../hooks';
import { formatCurrency } from '../utils';

export default function WalletsView({ onOpenNewAccountModal }) {
  const { accounts, balances, netWorthData, deleteAccount } = useAccounts();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const filteredAccounts = selectedFilter === 'ALL'
    ? accounts
    : accounts.filter((acc) => acc.type === selectedFilter || acc.category === selectedFilter);

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
            <span>Gestor Patrimonial de Cuentas</span>
          </div>
          <h1 className="text-gradient-emerald">Billeteras & Cuentas</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Administración centralizada de cuentas bancarias, efectivo, tarjetas y fondos con cálculo determinista.
          </p>
        </div>

        <button
          type="button"
          className="glass-pill emerald"
          onClick={onOpenNewAccountModal}
          style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}
        >
          + Nueva Cuenta / Billetera
        </button>
      </header>

      {/* Net Worth Summary Pill Header */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Activos Totales</span>
          <div className="num-mono text-gradient-emerald" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.25rem 0' }}>
            {formatCurrency(netWorthData.totalAssets)}
          </div>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Pasivos & Deudas</span>
          <div className="num-mono" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-danger)', margin: '0.25rem 0' }}>
            {formatCurrency(netWorthData.totalLiabilities)}
          </div>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Patrimonio Neto</span>
          <div className="num-mono text-gradient-gold" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.25rem 0' }}>
            {formatCurrency(netWorthData.netWorth)}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`glass-pill ${selectedFilter === 'ALL' ? 'emerald' : ''}`}
          onClick={() => setSelectedFilter('ALL')}
          style={{ cursor: 'pointer' }}
        >
          Todas ({accounts.length})
        </button>
        <button
          type="button"
          className={`glass-pill ${selectedFilter === 'ASSET' ? 'emerald' : ''}`}
          onClick={() => setSelectedFilter('ASSET')}
          style={{ cursor: 'pointer' }}
        >
          Activos
        </button>
        <button
          type="button"
          className={`glass-pill ${selectedFilter === 'LIABILITY' ? 'emerald' : ''}`}
          onClick={() => setSelectedFilter('LIABILITY')}
          style={{ cursor: 'pointer' }}
        >
          Pasivos / Tarjetas
        </button>
      </div>

      {/* Account Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredAccounts.map((account) => {
          const currentBalance = balances[account.id] !== undefined ? balances[account.id] : account.initialBalance;
          const isNegative = currentBalance < 0;

          return (
            <div key={account.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className={`glass-pill ${account.color || 'emerald'}`}>
                  {account.category || account.type}
                </span>
                <span className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  {account.currency}
                </span>
              </div>

              <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                {account.name}
              </h3>

              <div
                className={`num-mono ${isNegative ? 'text-danger' : 'text-gradient-emerald'}`}
                style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0.5rem 0 1rem 0' }}
              >
                {formatCurrency(currentBalance, account.currency)}
              </div>

              {account.creditLimit && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                  Límite de Crédito: <span className="num-mono">{formatCurrency(account.creditLimit, account.currency)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-secondary)' }}>
                  Cifrado AES-GCM
                </span>
                <button
                  type="button"
                  onClick={() => deleteAccount(account.id)}
                  style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-danger)', cursor: 'pointer', background: 'transparent', border: 'none' }}
                  title="Eliminar cuenta"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
