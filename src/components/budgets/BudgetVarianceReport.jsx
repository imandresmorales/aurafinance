import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateBudgetVariances, generateVarianceCSV } from '../../services/budgetVarianceEngine';
import './BudgetVarianceReport.css';

export default function BudgetVarianceReport() {
  const { budgets, transactions } = useAccounts();
  const toast = useToast();
  
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [filterStatus, setFilterStatus] = useState('all'); // all | favorable | warning | unfavorable
  const [isCollapsed, setIsCollapsed] = useState(false);

  const varianceData = useMemo(() => {
    return calculateBudgetVariances(budgets, transactions, selectedMonth);
  }, [budgets, transactions, selectedMonth]);

  const filteredItems = useMemo(() => {
    if (filterStatus === 'all') return varianceData.items;
    return varianceData.items.filter(item => item.status === filterStatus);
  }, [varianceData, filterStatus]);

  const handleExportCSV = () => {
    try {
      const csvContent = generateVarianceCSV(varianceData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_desviaciones_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast?.success('Reporte de desviaciones exportado en CSV.');
    } catch (err) {
      toast?.error('Error al exportar reporte de desviaciones.');
    }
  };

  return (
    <div className="budget-variance-container">
      <div className="budget-variance-header">
        <div className="budget-variance-title-group">
          <span style={{ fontSize: '1.5rem' }}>📊</span>
          <div>
            <h2>Reporte de Desviaciones Presupuestarias</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', margin: '0.15rem 0 0 0' }}>
              Comparativa de Presupuesto Asignado vs. Gasto Real y adherencia del período.
            </p>
          </div>
        </div>

        <div className="budget-variance-actions">
          <input
            type="month"
            className="glass-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value || currentMonthKey)}
            style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
          />
          <button
            type="button"
            className="glass-pill"
            onClick={handleExportCSV}
            style={{ padding: '0.45rem 0.9rem', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}
          >
            📥 Exportar CSV
          </button>
          <button
            type="button"
            className="glass-pill"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ padding: '0.45rem 0.75rem', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}
          >
            {isCollapsed ? '▼ Expandir' : '▲ Colapsar'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Summary KPIs */}
          <div className="variance-kpis-grid">
            <div className="variance-kpi-card">
              <span className="variance-kpi-label">Índice de Adherencia</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="variance-kpi-value" style={{
                  color: varianceData.adherenceScore >= 80 ? 'var(--emerald-400)' : varianceData.adherenceScore >= 60 ? '#fbbf24' : '#f87171'
                }}>
                  {varianceData.adherenceScore}%
                </span>
                <span className="variance-kpi-sub">
                  {varianceData.adherenceScore >= 80 ? 'Óptima' : varianceData.adherenceScore >= 60 ? 'Moderada' : 'Crítica'}
                </span>
              </div>
            </div>

            <div className="variance-kpi-card">
              <span className="variance-kpi-label">Presupuesto Asignado</span>
              <span className="variance-kpi-value">{formatCurrency(varianceData.totalBudgeted)}</span>
              <span className="variance-kpi-sub">{varianceData.items.length} sobres activos</span>
            </div>

            <div className="variance-kpi-card">
              <span className="variance-kpi-label">Gasto Real Ejecutado</span>
              <span className="variance-kpi-value" style={{ color: varianceData.totalActual > varianceData.totalBudgeted ? '#f87171' : 'var(--text-primary)' }}>
                {formatCurrency(varianceData.totalActual)}
              </span>
              <span className="variance-kpi-sub">
                {varianceData.totalBudgeted > 0 ? `${Math.round((varianceData.totalActual / varianceData.totalBudgeted) * 100)}% del total` : 'Sin límite'}
              </span>
            </div>

            <div className="variance-kpi-card">
              <span className="variance-kpi-label">Desviación Neta</span>
              <span className="variance-kpi-value" style={{ color: varianceData.netVariance >= 0 ? 'var(--emerald-400)' : '#f87171' }}>
                {varianceData.netVariance >= 0 ? `+${formatCurrency(varianceData.netVariance)}` : `-${formatCurrency(Math.abs(varianceData.netVariance))}`}
              </span>
              <span className="variance-kpi-sub">
                {varianceData.netVariance >= 0 ? 'Superávit / Ahorro' : 'Déficit Presupuestario'}
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`glass-pill ${filterStatus === 'all' ? 'emerald' : ''}`}
              onClick={() => setFilterStatus('all')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
            >
              Todos ({varianceData.items.length})
            </button>
            <button
              type="button"
              className={`glass-pill ${filterStatus === 'favorable' ? 'emerald' : ''}`}
              onClick={() => setFilterStatus('favorable')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
            >
              ✓ Favorables ({varianceData.favorableCount})
            </button>
            <button
              type="button"
              className={`glass-pill ${filterStatus === 'warning' ? 'gold' : ''}`}
              onClick={() => setFilterStatus('warning')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
            >
              ⚠️ En Riesgo ({varianceData.warningCount})
            </button>
            <button
              type="button"
              className={`glass-pill ${filterStatus === 'unfavorable' ? 'rose' : ''}`}
              onClick={() => setFilterStatus('unfavorable')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
            >
              ✕ Excedidos ({varianceData.unfavorableCount})
            </button>
          </div>

          {/* Variance Breakdown Table */}
          <div className="variance-table-wrapper">
            <table className="variance-table">
              <thead>
                <tr>
                  <th>Sobre / Categoría</th>
                  <th>Presupuesto</th>
                  <th>Gasto Real</th>
                  <th>Progreso</th>
                  <th>Desviación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No hay sobres en esta categoría de filtro para el mes seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{item.icon}</span>
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(item.budgeted)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(item.actual)}</td>
                      <td style={{ minWidth: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span>{item.percentSpent}%</span>
                        </div>
                        <div className="variance-progress-bar-bg">
                          <div
                            className="variance-progress-bar-fill"
                            style={{
                              width: `${Math.min(100, item.percentSpent)}%`,
                              background: item.status === 'unfavorable' ? '#ef4444' : item.status === 'warning' ? '#f59e0b' : 'var(--emerald-500)'
                            }}
                          />
                        </div>
                      </td>
                      <td style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: item.variance >= 0 ? 'var(--emerald-400)' : '#f87171'
                      }}>
                        {item.variance >= 0 ? `+${formatCurrency(item.variance)}` : `-${formatCurrency(Math.abs(item.variance))}`}
                      </td>
                      <td>
                        <span className={`variance-status-badge ${item.status}`}>
                          {item.status === 'favorable' && '✓ Favorable'}
                          {item.status === 'warning' && '⚠️ Alerta'}
                          {item.status === 'unfavorable' && '✕ Excedido'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
