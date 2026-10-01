import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { analyzeMicroExpenses, DEFAULT_MICRO_THRESHOLD } from '../../services/microExpensesEngine';
import './MicroExpensesCard.css';

export default function MicroExpensesCard() {
  const { transactions } = useAccounts();
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [threshold, setThreshold] = useState(DEFAULT_MICRO_THRESHOLD);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const analysis = useMemo(() => {
    return analyzeMicroExpenses(transactions, Number(threshold) || DEFAULT_MICRO_THRESHOLD, selectedMonth);
  }, [transactions, threshold, selectedMonth]);

  return (
    <div className="micro-card-container">
      <div className="micro-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🐜</span>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Calculadora del Efecto Hormiga (Microgastos)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', margin: '0.15rem 0 0 0' }}>
              Descubre cuánto dinero fugas en pequeños consumos diarios y su potencial de riqueza a interés compuesto.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Umbral:</span>
            <input
              type="number"
              min="1"
              max="100"
              className="glass-input"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              style={{ width: '65px', padding: '0.35rem 0.5rem', fontSize: 'var(--font-size-xs)', textAlign: 'center' }}
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>$</span>
          </div>

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
          {/* Main KPI Summary */}
          <div className="micro-kpis-grid">
            <div className="micro-kpi-card">
              <span className="micro-kpi-label">Fuga Mensual en Microgastos</span>
              <span className="micro-kpi-value" style={{ color: '#f87171' }}>
                {formatCurrency(analysis.totalMicroSpent)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {analysis.microTxCount} transacciones &le; {formatCurrency(analysis.threshold)}
              </span>
            </div>

            <div className="micro-kpi-card">
              <span className="micro-kpi-label">% Sobre Egresos Totales</span>
              <span className="micro-kpi-value" style={{
                color: analysis.severity === 'high' ? '#f87171' : analysis.severity === 'moderate' ? '#fbbf24' : 'var(--emerald-400)'
              }}>
                {analysis.percentOfTotalExpenses}%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {analysis.microTxPercent}% del total de movimientos
              </span>
            </div>

            <div className="micro-kpi-card">
              <span className="micro-kpi-label">Impacto Anualizado</span>
              <span className="micro-kpi-value" style={{ color: '#fbbf24' }}>
                {formatCurrency(analysis.annualizedMicroCost)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Costo acumulado a 12 meses
              </span>
            </div>

            <div className="micro-kpi-card">
              <span className="micro-kpi-label">Costo de Oportunidad (10 Años)</span>
              <span className="micro-kpi-value" style={{ color: 'var(--emerald-400)' }}>
                {formatCurrency(analysis.futureValue10Years)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Invertido en Indexados (8% anual)
              </span>
            </div>
          </div>

          {/* Actionable Insights Banner */}
          <div className={`micro-alert-box ${analysis.severity}`}>
            <span style={{ fontSize: '1.25rem' }}>
              {analysis.severity === 'high' ? '🚨' : analysis.severity === 'moderate' ? '⚠️' : '💡'}
            </span>
            <span>{analysis.insight}</span>
          </div>

          {/* Compound Wealth Simulator (5, 10, 20 Years) */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              📈 ¿Cuánto tendrías si invirtieras este dinero ({formatCurrency(analysis.totalMicroSpent)}/mes al 8% CAGR)?
            </h4>
            <div className="compound-timeline-grid">
              <div className="compound-box">
                <span className="compound-horizon">En 5 Años</span>
                <span className="compound-amount">{formatCurrency(analysis.futureValue5Years)}</span>
                <span className="compound-desc">Suficiente para un fondo de contingencia sólido o entrada para inversión.</span>
              </div>

              <div className="compound-box">
                <span className="compound-horizon">En 10 Años</span>
                <span className="compound-amount">{formatCurrency(analysis.futureValue10Years)}</span>
                <span className="compound-desc">Capital para adquisición de activos productivos o libertad financiera acelerada.</span>
              </div>

              <div className="compound-box">
                <span className="compound-horizon">En 20 Años</span>
                <span className="compound-amount">{formatCurrency(analysis.futureValue20Years)}</span>
                <span className="compound-desc">Poder exponencial del interés compuesto multiplicando tus micro-ahorros.</span>
              </div>
            </div>
          </div>

          {/* Micro-expenses Category and Merchant Breakdown */}
          <div className="micro-breakdown-grid">
            <div className="micro-column">
              <h4>
                <span>📂 Categorías con más Microgastos</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({analysis.categoryBreakdown.length} categorías)</span>
              </h4>
              {analysis.categoryBreakdown.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>No hay microgastos registrados en este mes.</p>
              ) : (
                analysis.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="micro-row">
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.category}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '0.5rem' }}>({cat.percent}%)</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#f87171' }}>
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="micro-column">
              <h4>
                <span>🏪 Comercios / Conceptos Frecuentes</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top 5</span>
              </h4>
              {analysis.topMerchants.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>Sin registros.</p>
              ) : (
                analysis.topMerchants.map((m, idx) => (
                  <div key={idx} className="micro-row">
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.merchant}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fbbf24' }}>
                      {formatCurrency(m.amount)}
                    </span>
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
