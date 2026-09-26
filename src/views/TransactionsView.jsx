import React, { useState } from 'react';
import { useAccounts } from '../hooks';
import { formatCurrency } from '../utils';
import { TransactionModal } from '../components';

export default function TransactionsView() {
  const { transactions, accounts, deleteTransaction } = useAccounts();
  const [filterType, setFilterType] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getAccountName = (accountId) => {
    const found = accounts.find((a) => a.id === accountId);
    return found ? found.name : 'Bóveda';
  };

  const filtered = filterType === 'ALL'
    ? transactions
    : transactions.filter((t) => t.type === filterType);

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
            <span>Libro Mayor & Movimientos</span>
          </div>
          <h1 className="text-gradient-emerald">Registro de Transacciones</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Historial de entradas, salidas y transferencias con balance contable y auditoría criptográfica.
          </p>
        </div>

        <button
          type="button"
          className="glass-pill emerald"
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}
        >
          + Nueva Transacción [N]
        </button>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Filtrar por:</span>
        <button
          type="button"
          className={`glass-pill ${filterType === 'ALL' ? 'emerald' : ''}`}
          onClick={() => setFilterType('ALL')}
          style={{ cursor: 'pointer' }}
        >
          Todas ({transactions.length})
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
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <p>No hay transacciones registradas con el filtro seleccionado.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>FECHA</th>
                <th style={{ padding: '0.75rem 1rem' }}>CONCEPTO</th>
                <th style={{ padding: '0.75rem 1rem' }}>CATEGORÍA</th>
                <th style={{ padding: '0.75rem 1rem' }}>CUENTA</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>MONTO</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';
                const accountLabel = isTransfer
                  ? `${getAccountName(tx.sourceAccountId)} ➔ ${getAccountName(tx.destinationAccountId)}`
                  : isIncome
                    ? getAccountName(tx.destinationAccountId)
                    : getAccountName(tx.sourceAccountId);

                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 'var(--font-size-sm)' }}>
                    <td className="num-mono" style={{ padding: '1rem', color: 'var(--text-tertiary)' }}>{tx.date}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div>{tx.concept}</div>
                      {tx.tags && tx.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {tx.tags.map((tg) => (
                            <span key={tg} style={{ fontSize: '0.6875rem', color: 'var(--color-primary-light)' }}>{tg}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="glass-pill" style={{ fontSize: 'var(--font-size-2xs)' }}>{tx.category}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>{accountLabel}</td>
                    <td
                      className="num-mono"
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isIncome ? 'var(--color-income)' : isTransfer ? 'var(--color-transfer)' : 'var(--color-expense)',
                      }}
                    >
                      {isIncome ? `+${formatCurrency(tx.amount)}` : isTransfer ? `⇄ ${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => deleteTransaction(tx.id)}
                        style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title="Eliminar asiento contable"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
