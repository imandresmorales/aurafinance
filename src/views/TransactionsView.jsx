import React, { useState } from 'react';
import { formatCurrency } from '../utils';

export default function TransactionsView() {
  const [filterType, setFilterType] = useState('ALL');

  const transactions = [
    { id: 'tx-1', date: '2026-09-21', concept: 'Honorarios Proyecto Consultoría', category: 'Ingresos', account: 'Cuenta Nómina', amount: 3800.00, type: 'INCOME' },
    { id: 'tx-2', date: '2026-09-20', concept: 'Supermercado Orgánico Bio', category: 'Alimentación', account: 'Tarjeta Débito', amount: -142.80, type: 'EXPENSE' },
    { id: 'tx-3', date: '2026-09-19', concept: 'Suscripción Servidor Dedicado', category: 'Software & Cloud', account: 'Cuenta Nómina', amount: -65.00, type: 'EXPENSE' },
    { id: 'tx-4', date: '2026-09-18', concept: 'Transferencia a Fondo de Inversión', category: 'Ahorro / Inversión', account: 'Bóveda Indexada', amount: 1500.00, type: 'TRANSFER' },
    { id: 'tx-5', date: '2026-09-16', concept: 'Restaurante Nórdico Copenhague', category: 'Ocio & Cenas', account: 'Tarjeta Débito Viajes', amount: -89.40, type: 'EXPENSE' },
  ];

  const filtered = filterType === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.type === filterType);

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
            <span>Libro Mayor & Movimientos</span>
          </div>
          <h1 className="text-gradient-emerald">Registro de Transacciones</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Historial de entradas, salidas y transferencias con auditoría criptográfica.
          </p>
        </div>
        <button type="button" className="glass-pill emerald" style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
          + Nueva Transacción [N]
        </button>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem var(--space-4)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Filtrar por:</span>
        <button 
          type="button" 
          className={`glass-pill ${filterType === 'ALL' ? 'emerald' : ''}`}
          onClick={() => setFilterType('ALL')}
          style={{ cursor: 'pointer' }}
        >
          Todas
        </button>
        <button 
          type="button" 
          className={`glass-pill ${filterType === 'INCOME' ? 'emerald' : ''}`}
          onClick={() => setFilterType('INCOME')}
          style={{ cursor: 'pointer' }}
        >
          Ingresos
        </button>
        <button 
          type="button" 
          className={`glass-pill ${filterType === 'EXPENSE' ? 'emerald' : ''}`}
          onClick={() => setFilterType('EXPENSE')}
          style={{ cursor: 'pointer' }}
        >
          Gastos
        </button>
        <button 
          type="button" 
          className={`glass-pill ${filterType === 'TRANSFER' ? 'emerald' : ''}`}
          onClick={() => setFilterType('TRANSFER')}
          style={{ cursor: 'pointer' }}
        >
          Transferencias
        </button>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>FECHA</th>
              <th style={{ padding: '0.75rem 1rem' }}>CONCEPTO</th>
              <th style={{ padding: '0.75rem 1rem' }}>CATEGORÍA</th>
              <th style={{ padding: '0.75rem 1rem' }}>CUENTA</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>MONTO</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 'var(--font-size-sm)' }}>
                <td className="num-mono" style={{ padding: '1rem', color: 'var(--text-tertiary)' }}>{tx.date}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.concept}</td>
                <td style={{ padding: '1rem' }}>
                  <span className="glass-pill" style={{ fontSize: 'var(--font-size-2xs)' }}>{tx.category}</span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{tx.account}</td>
                <td className="num-mono" style={{ 
                  padding: '1rem', 
                  textAlign: 'right', 
                  fontWeight: 700,
                  color: tx.amount > 0 ? 'var(--color-income)' : 'var(--color-expense)'
                }}>
                  {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
