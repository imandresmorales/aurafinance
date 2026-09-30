import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateFixedVsDiscretionary } from '../../services/fixedVsDiscretionaryEngine';
import './FixedVsDiscretionaryCard.css';

export default function FixedVsDiscretionaryCard() {
  const { transactions } = useAccounts();
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const metrics = useMemo(() => {
    return calculateFixedVsDiscretionary(transactions, selectedMonth);
  }, [transactions, selectedMonth]);

  return (
    <div className="fvd-card-container">
      <div className="fvd-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚖️</span>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Gastos Fijos vs. Discrecionales (FCR)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', margin: '0.15rem 0 0 0' }}>
              Control de obligaciones ineludibles vs gastos flexibles para maximizar tu capacidad de ahorro.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ padding: '0.45rem 0.75rem', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}
          >
            {isCollapsed ? '▼ Expandir' : '▲ Colapsar'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Dual Split Visual Bar */}
          <div className="fvd-split-bar-wrapper">
            <div className="fvd-split-bar">
              <div
                className="fvd-bar-fixed"
                style={{ width: `${metrics.fixedExpensePercent}%` }}
                title={`Gastos Fijos: ${metrics.fixedExpensePercent}%`}
              />
              <div
                className="fvd-bar-discretionary"
                style={{ width: `${metrics.discretionaryExpensePercent}%` }}
                title={`Gastos Discrecionales: ${metrics.discretionaryExpensePercent}%`}
              />
            </div>

            <div className="fvd-split-legend">
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                ● Gastos Fijos: {formatCurrency(metrics.fixedTotal)} ({metrics.fixedExpensePercent}%)
              </span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                ● Gastos Discrecionales: {formatCurrency(metrics.discretionaryTotal)} ({metrics.discretionaryExpensePercent}%)
              </span>
            </div>
          </div>

          {/* Key Metric KPIs */}
          <div className="fvd-metrics-grid">
            <div className="fvd-metric-box">
              <span className="fvd-metric-label">Fixed Cost Ratio (FCR)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="fvd-metric-value" style={{
                  color: metrics.healthStatus === 'optimal' ? 'var(--emerald-400)' : metrics.healthStatus === 'moderate' ? '#fbbf24' : '#f87171'
                }}>
                  {metrics.fixedCostRatio}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Meta: &le; 50%
                </span>
              </div>
            </div>

            <div className="fvd-metric-box">
              <span className="fvd-metric-label">Discretionary Ratio</span>
              <span className="fvd-metric-value" style={{ color: '#fbbf24' }}>
                {metrics.discretionaryRatio}%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Meta: &le; 30%
              </span>
            </div>

            <div className="fvd-metric-box">
              <span className="fvd-metric-label">Ingresos del Mes</span>
              <span className="fvd-metric-value" style={{ color: 'var(--emerald-400)' }}>
                {formatCurrency(metrics.totalIncome)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Base de cálculo
              </span>
            </div>

            <div className="fvd-metric-box">
              <span className="fvd-metric-label">Margen de Flexibilidad</span>
              <span className="fvd-metric-value" style={{ color: metrics.totalIncome - metrics.fixedTotal >= 0 ? 'var(--emerald-400)' : '#f87171' }}>
                {formatCurrency(Math.max(0, metrics.totalIncome - metrics.fixedTotal))}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Libre tras gastos fijos
              </span>
            </div>
          </div>

          {/* Recommendation Alert Box */}
          <div className={`fvd-recommendation-box ${metrics.healthStatus}`}>
            <span style={{ fontSize: '1.25rem' }}>
              {metrics.healthStatus === 'optimal' ? '💡' : metrics.healthStatus === 'moderate' ? '⚠️' : '🚨'}
            </span>
            <span>{metrics.recommendation}</span>
          </div>

          {/* Itemized Lists */}
          <div className="fvd-lists-grid">
            <div className="fvd-list-column">
              <h4>
                <span style={{ color: '#38bdf8' }}>🔒 Principales Gastos Fijos</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({metrics.fixedItemsCount} movimientos)</span>
              </h4>
              {metrics.topFixed.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>Sin gastos fijos registrados este mes.</p>
              ) : (
                metrics.topFixed.map((item) => (
                  <div key={item.id} className="fvd-item-row">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.description || item.concept}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.category} &bull; {item.date}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8' }}>
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="fvd-list-column">
              <h4>
                <span style={{ color: '#fbbf24' }}>🎉 Gastos Discrecionales</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({metrics.discretionaryItemsCount} movimientos)</span>
              </h4>
              {metrics.topDiscretionary.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>Sin gastos discrecionales registrados este mes.</p>
              ) : (
                metrics.topDiscretionary.map((item) => (
                  <div key={item.id} className="fvd-item-row">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.description || item.concept}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.category} &bull; {item.date}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fbbf24' }}>
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
