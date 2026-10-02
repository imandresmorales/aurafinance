import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import {
  buildBudgetMatrix,
  compareInterannualBudgets,
  generateMatrixCSV,
  MONTH_NAMES_SHORT,
} from '../../services';
import './BudgetMatrix.css';

export function BudgetMatrix() {
  const { budgets, transactions } = useAccounts();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showYoY, setShowYoY] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set([currentYear, currentYear - 1]);
    (transactions || []).forEach((t) => {
      if (t.date) {
        const y = parseInt(t.date.slice(0, 4), 10);
        if (!isNaN(y) && y > 2000) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const matrix = useMemo(() => {
    return buildBudgetMatrix(budgets, transactions, selectedYear);
  }, [budgets, transactions, selectedYear]);

  const yoyData = useMemo(() => {
    return compareInterannualBudgets(budgets, transactions, selectedYear - 1, selectedYear);
  }, [budgets, transactions, selectedYear]);

  const handleDownloadCSV = () => {
    const csvContent = generateMatrixCSV(matrix);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aurafinance_matriz_presupuestaria_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!matrix || matrix.rows.length === 0) {
    return null;
  }

  return (
    <div className="budget-matrix-card" id="budget-matrix-section">
      <div className="budget-matrix-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Matriz Comparativa Interanual & Multi-Periodo</span>
          </div>
          <h2 className="budget-matrix-title">
            <span>🗓️ Matriz Presupuestaria Anual ({selectedYear})</span>
          </h2>
        </div>

        <div className="budget-matrix-controls">
          <select
            className="matrix-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Seleccionar año para matriz presupuestaria"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Año {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="glass-pill"
            onClick={() => setShowYoY(!showYoY)}
            style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}
          >
            {showYoY ? '📊 Ocultar YoY' : '📈 Comparativa YoY vs ' + (selectedYear - 1)}
          </button>

          <button
            type="button"
            className="glass-pill gold"
            onClick={handleDownloadCSV}
            style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Main 12-Month Matrix Table */}
      <div className="matrix-table-container">
        <table className="matrix-table" aria-label="Matriz de Presupuesto Mensual">
          <thead>
            <tr>
              <th scope="col">Sobre / Categoría</th>
              {MONTH_NAMES_SHORT.map((m, idx) => (
                <th key={idx} scope="col">
                  {m}
                </th>
              ))}
              <th scope="col">Presup. Anual</th>
              <th scope="col">Real Anual</th>
              <th scope="col">Desviación</th>
              <th scope="col">% Ejec.</th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <span style={{ marginRight: '0.4rem' }}>{row.icon}</span>
                  {row.name}
                </th>
                {row.months.map((m, idx) => (
                  <td
                    key={idx}
                    className={`num-mono ${
                      m.isOver
                        ? 'matrix-cell-over'
                        : m.actual > 0
                        ? 'matrix-cell-active'
                        : 'matrix-cell-safe'
                    }`}
                  >
                    {m.actual > 0 ? formatCurrency(m.actual) : '—'}
                  </td>
                ))}
                <td className="num-mono" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(row.totalBudgetedYear)}
                </td>
                <td
                  className="num-mono"
                  style={{
                    color:
                      row.totalActualYear > row.totalBudgetedYear
                        ? '#f87171'
                        : 'var(--color-primary-light)',
                    fontWeight: 700,
                  }}
                >
                  {formatCurrency(row.totalActualYear)}
                </td>
                <td
                  className="num-mono"
                  style={{
                    color: row.annualVariance >= 0 ? 'var(--color-primary-light)' : '#f87171',
                  }}
                >
                  {row.annualVariance >= 0 ? '+' : ''}
                  {formatCurrency(row.annualVariance)}
                </td>
                <td className="num-mono" style={{ fontWeight: 600 }}>
                  {row.annualExecutionPercent.toFixed(1)}%
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="matrix-total-row">
              <th scope="row">TOTAL EJECUTADO</th>
              {matrix.monthlyTotals.map((m, idx) => (
                <td
                  key={idx}
                  className={`num-mono ${m.isOver ? 'matrix-cell-over' : 'matrix-cell-active'}`}
                >
                  {m.actual > 0 ? formatCurrency(m.actual) : '—'}
                </td>
              ))}
              <td className="num-mono">{formatCurrency(matrix.summary.grandTotalBudgeted)}</td>
              <td className="num-mono" style={{ color: 'var(--color-primary-light)' }}>
                {formatCurrency(matrix.summary.grandTotalActual)}
              </td>
              <td
                className="num-mono"
                style={{
                  color:
                    matrix.summary.grandTotalVariance >= 0
                      ? 'var(--color-primary-light)'
                      : '#f87171',
                }}
              >
                {matrix.summary.grandTotalVariance >= 0 ? '+' : ''}
                {formatCurrency(matrix.summary.grandTotalVariance)}
              </td>
              <td className="num-mono">{matrix.summary.grandExecutionPercent.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Aggregate Matrix KPIs */}
      <div className="matrix-kpis-grid">
        <div className="matrix-kpi-box">
          <div className="matrix-kpi-label">Presupuesto Anual Asignado</div>
          <div className="matrix-kpi-val num-mono text-gradient-emerald">
            {formatCurrency(matrix.summary.grandTotalBudgeted)}
          </div>
        </div>

        <div className="matrix-kpi-box">
          <div className="matrix-kpi-label">Gasto Real Anual Acumulado</div>
          <div className="matrix-kpi-val num-mono" style={{ color: 'var(--color-primary-light)' }}>
            {formatCurrency(matrix.summary.grandTotalActual)}
          </div>
        </div>

        <div className="matrix-kpi-box">
          <div className="matrix-kpi-label">Superávit / Ahorro Neto Anual</div>
          <div
            className="matrix-kpi-val num-mono"
            style={{
              color:
                matrix.summary.grandTotalVariance >= 0 ? 'var(--color-accent-gold)' : '#f87171',
            }}
          >
            {matrix.summary.grandTotalVariance >= 0 ? '+' : ''}
            {formatCurrency(matrix.summary.grandTotalVariance)}
          </div>
        </div>

        <div className="matrix-kpi-box">
          <div className="matrix-kpi-label">Tasa de Ejecución Anual</div>
          <div className="matrix-kpi-val num-mono" style={{ color: 'var(--text-primary)' }}>
            {matrix.summary.grandExecutionPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Optional YoY View */}
      {showYoY && yoyData && (
        <div className="matrix-yoy-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent-gold)', fontWeight: 600 }}>
              📈 Variación Interanual (YoY {selectedYear - 1} ➔ {selectedYear})
            </h3>
            <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: yoyData.isIncrease ? '#f87171' : 'var(--color-primary-light)' }}>
              Diferencia Global: {yoyData.isIncrease ? '+' : ''}{formatCurrency(yoyData.spentDiff)} ({yoyData.percentChange > 0 ? '+' : ''}{yoyData.percentChange.toFixed(1)}%)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {yoyData.categoryComparisons.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                  <span>{cat.icon} {cat.name}</span>
                  <span
                    className="num-mono"
                    style={{
                      color: cat.isIncrease ? '#f87171' : 'var(--color-primary-light)',
                      fontWeight: 600,
                    }}
                  >
                    {cat.percentChange > 0 ? '+' : ''}
                    {cat.percentChange.toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{selectedYear - 1}: {formatCurrency(cat.actualYearA)}</span>
                  <span>{selectedYear}: {formatCurrency(cat.actualYearB)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
