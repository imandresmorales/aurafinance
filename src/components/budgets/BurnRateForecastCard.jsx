import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateBurnRateForecast } from '../../services/burnRateForecastEngine';
import './BurnRateForecastCard.css';

export default function BurnRateForecastCard() {
  const { transactions, budgets } = useAccounts();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const forecast = useMemo(() => {
    return calculateBurnRateForecast(transactions, budgets);
  }, [transactions, budgets]);

  return (
    <div className="burnrate-card-container">
      <div className="burnrate-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔥</span>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Ritmo de Consumo (Burn Rate) y Proyección Fin de Mes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', margin: '0.15rem 0 0 0' }}>
              Velocidad diaria de gasto, proyección estimada de cierre y límite diario seguro para no sobregirar sobres.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="glass-pill"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ padding: '0.45rem 0.75rem', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}
        >
          {isCollapsed ? '▼ Expandir' : '▲ Colapsar'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Dual Progress: Month Elapsed vs Budget Consumed */}
          <div className="burnrate-progress-section">
            <div className="burnrate-bar-container">
              <div className="burnrate-bar-label">
                <span>🗓️ Tiempo transcurrido del mes: Día {forecast.currentDay} de {forecast.daysInMonth}</span>
                <strong style={{ color: 'var(--text-primary)' }}>{forecast.monthProgressPercent}%</strong>
              </div>
              <div className="burnrate-bar-bg">
                <div
                  className="burnrate-bar-fill"
                  style={{ width: `${forecast.monthProgressPercent}%`, background: 'var(--cyan-400)' }}
                />
              </div>
            </div>

            <div className="burnrate-bar-container">
              <div className="burnrate-bar-label">
                <span>💳 Presupuesto consumido: {formatCurrency(forecast.totalSpentSoFar)} de {formatCurrency(forecast.totalBudget)}</span>
                <strong style={{
                  color: forecast.budgetConsumedPercent > forecast.monthProgressPercent ? '#f87171' : 'var(--emerald-400)'
                }}>
                  {forecast.budgetConsumedPercent}%
                </strong>
              </div>
              <div className="burnrate-bar-bg">
                <div
                  className="burnrate-bar-fill"
                  style={{
                    width: `${Math.min(100, forecast.budgetConsumedPercent)}%`,
                    background: forecast.budgetConsumedPercent > forecast.monthProgressPercent ? '#f87171' : 'var(--emerald-500)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Key Burn Rate KPIs */}
          <div className="burnrate-kpis-grid">
            <div className="burnrate-kpi-card">
              <span className="burnrate-kpi-label">Ritmo de Gasto Actual</span>
              <span className="burnrate-kpi-value" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(forecast.currentDailyBurnRate)} / día
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Promedio últimos {forecast.currentDay} días
              </span>
            </div>

            <div className="burnrate-kpi-card">
              <span className="burnrate-kpi-label">Límite Diario Seguro</span>
              <span className="burnrate-kpi-value" style={{ color: 'var(--emerald-400)' }}>
                {formatCurrency(forecast.recommendedDailyAllowance)} / día
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Para los {forecast.remainingDays} días restantes
              </span>
            </div>

            <div className="burnrate-kpi-card">
              <span className="burnrate-kpi-label">Gasto Proyectado Fin de Mes</span>
              <span className="burnrate-kpi-value" style={{
                color: forecast.status === 'on_track' ? 'var(--emerald-400)' : forecast.status === 'caution' ? '#fbbf24' : '#f87171'
              }}>
                {formatCurrency(forecast.projectedMonthEndExpense)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                vs Presupuesto {formatCurrency(forecast.totalBudget)}
              </span>
            </div>

            <div className="burnrate-kpi-card">
              <span className="burnrate-kpi-label">Superávit / Déficit Estimado</span>
              <span className="burnrate-kpi-value" style={{
                color: forecast.projectedVariance >= 0 ? 'var(--emerald-400)' : '#f87171'
              }}>
                {forecast.projectedVariance >= 0
                  ? `+${formatCurrency(forecast.projectedVariance)}`
                  : `-${formatCurrency(Math.abs(forecast.projectedVariance))}`}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {forecast.projectedVariance >= 0 ? 'Ahorro esperado al cierre' : 'Déficit proyectado al cierre'}
              </span>
            </div>
          </div>

          {/* Actionable Guidance Banner */}
          <div className={`burnrate-alert-banner ${forecast.status}`}>
            <span style={{ fontSize: '1.25rem' }}>
              {forecast.status === 'on_track' ? '✅' : forecast.status === 'caution' ? '⚠️' : '🚨'}
            </span>
            <span>{forecast.message}</span>
          </div>
        </>
      )}
    </div>
  );
}
