import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateEnvelopeExecution, ENVELOPE_STATUS } from '../../services';
import './EnvelopeBudgetExplorer.css';

export function EnvelopeBudgetExplorer({ onEditBudget, onQuickRealloc }) {
  const { budgets, transactions } = useAccounts();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('PERCENT_DESC');

  const { envelopes, summary } = useMemo(() => {
    return calculateEnvelopeExecution(budgets, transactions);
  }, [budgets, transactions]);

  const filteredEnvelopes = useMemo(() => {
    return envelopes
      .filter((env) => {
        // Status filter
        if (filterStatus === 'OK' && env.status !== ENVELOPE_STATUS.OK) return false;
        if (filterStatus === 'WARNING' && env.status !== ENVELOPE_STATUS.WARNING) return false;
        if (filterStatus === 'OVERBUDGET' && env.status !== ENVELOPE_STATUS.OVERBUDGET) return false;
        if (filterStatus === 'EMPTY' && env.status !== ENVELOPE_STATUS.EMPTY) return false;

        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const name = (env.name || '').toLowerCase();
          const category = (env.category || '').toLowerCase();
          return name.includes(term) || category.includes(term);
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PERCENT_DESC') return b.percentSpent - a.percentSpent;
        if (sortBy === 'PERCENT_ASC') return a.percentSpent - b.percentSpent;
        if (sortBy === 'ALLOCATED_DESC') return b.allocated - a.allocated;
        if (sortBy === 'REMAINING_ASC') return a.remaining - b.remaining;
        if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [envelopes, filterStatus, searchTerm, sortBy]);

  const getStatusBadge = (env) => {
    switch (env.status) {
      case ENVELOPE_STATUS.OVERBUDGET:
        return <span className="explorer-badge overbudget">Excedido ({env.percentSpent.toFixed(0)}%)</span>;
      case ENVELOPE_STATUS.WARNING:
        return <span className="explorer-badge warning">Alerta ({env.percentSpent.toFixed(0)}%)</span>;
      case ENVELOPE_STATUS.EMPTY:
        return <span className="explorer-badge empty">Sin Fondos</span>;
      case ENVELOPE_STATUS.OK:
      default:
        return <span className="explorer-badge ok">Saludable ({env.percentSpent.toFixed(0)}%)</span>;
    }
  };

  const getBarColor = (env) => {
    if (env.isOverBudget) return '#ef4444';
    if (env.percentSpent >= 75) return '#f59e0b';
    return env.color || '#10b981';
  };

  if (!envelopes || envelopes.length === 0) {
    return null;
  }

  return (
    <div className="envelope-explorer-container" id="envelope-explorer-section">
      <div className="envelope-explorer-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Explorador Visual de Fondos & Distribución</span>
          </div>
          <h2 className="envelope-explorer-title">
            <span>🧭 Explorador de Sobres de Presupuesto</span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            Sobres: <strong style={{ color: 'var(--text-primary)' }}>{envelopes.length}</strong> | Asignado Total: <strong style={{ color: 'var(--color-primary-light)' }}>{formatCurrency(summary.totalAllocated)}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="explorer-filters-bar">
        <button
          type="button"
          className={`explorer-filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ALL')}
        >
          Todos ({envelopes.length})
        </button>
        <button
          type="button"
          className={`explorer-filter-btn ${filterStatus === 'OK' ? 'active' : ''}`}
          onClick={() => setFilterStatus('OK')}
        >
          🟢 Saludables ({envelopes.filter((e) => e.status === ENVELOPE_STATUS.OK).length})
        </button>
        <button
          type="button"
          className={`explorer-filter-btn ${filterStatus === 'WARNING' ? 'active' : ''}`}
          onClick={() => setFilterStatus('WARNING')}
        >
          🟡 Precaución &gt;75% ({envelopes.filter((e) => e.status === ENVELOPE_STATUS.WARNING).length})
        </button>
        <button
          type="button"
          className={`explorer-filter-btn ${filterStatus === 'OVERBUDGET' ? 'active' : ''}`}
          onClick={() => setFilterStatus('OVERBUDGET')}
        >
          🔴 Excedidos ({summary.overbudgetCount})
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="explorer-search-input"
            placeholder="🔍 Buscar sobre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar sobre"
          />

          <select
            className="matrix-year-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar sobres"
            style={{ fontSize: 'var(--font-size-xs)', padding: '0.35rem 0.5rem' }}
          >
            <option value="PERCENT_DESC">Mayor % Consumo</option>
            <option value="PERCENT_ASC">Menor % Consumo</option>
            <option value="ALLOCATED_DESC">Mayor Asignación ($)</option>
            <option value="REMAINING_ASC">Menor Saldo Disponible</option>
            <option value="NAME_ASC">Nombre (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Interactive Envelopes */}
      <div className="explorer-grid">
        {filteredEnvelopes.map((env) => (
          <div key={env.id} className="explorer-envelope-item">
            <div className="explorer-item-header">
              <div className="explorer-item-title">
                <span style={{ fontSize: '1.2rem' }}>{env.icon || '📁'}</span>
                <span>{env.name}</span>
              </div>
              {getStatusBadge(env)}
            </div>

            {/* Visual Capacity Bar */}
            <div className="explorer-item-bar-bg">
              <div
                className="explorer-item-bar-fill"
                style={{
                  width: `${Math.min(env.percentSpent, 100)}%`,
                  backgroundColor: getBarColor(env),
                }}
              />
            </div>

            <div className="explorer-item-meta">
              <span>Gastado: <strong className="num-mono" style={{ color: env.isOverBudget ? '#f87171' : 'var(--text-primary)' }}>{formatCurrency(env.spent)}</strong></span>
              <span>Límite: <strong className="num-mono">{formatCurrency(env.allocated)}</strong></span>
            </div>

            <div className="explorer-item-meta" style={{ marginTop: '0.35rem' }}>
              <span>Disponible:</span>
              <span
                className="num-mono"
                style={{
                  fontWeight: 700,
                  color: env.remaining >= 0 ? 'var(--color-primary-light)' : '#f87171',
                }}
              >
                {env.remaining >= 0 ? '+' : ''}{formatCurrency(env.remaining)}
              </span>
            </div>

            {onEditBudget && (
              <div className="explorer-item-actions">
                <button
                  type="button"
                  className="glass-pill"
                  onClick={() => onEditBudget(env)}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  ✏️ Ajustar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
export default EnvelopeBudgetExplorer;
