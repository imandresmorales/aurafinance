import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { calculateEmergencyFundMetrics, EMERGENCY_STATUS } from '../../services';
import { formatCurrency } from '../../utils';
import './EmergencyFundTracker.css';

export default function EmergencyFundTracker() {
  const { accounts, balances, transactions } = useAccounts();
  const [targetMonths, setTargetMonths] = useState(6);

  const metrics = useMemo(() => {
    return calculateEmergencyFundMetrics(accounts, balances, transactions, targetMonths);
  }, [accounts, balances, transactions, targetMonths]);

  const {
    totalLiquid,
    monthlyBurnRate,
    monthsCovered,
    targetAmount,
    gapToTarget,
    percentCompleted,
    isTargetAchieved,
    status,
    statusLabel,
    advice,
  } = metrics;

  const isLow = status === EMERGENCY_STATUS.CRITICAL || status === EMERGENCY_STATUS.BASIC;

  return (
    <div className="emergency-fund-container">
      <div className="emergency-fund-header">
        <div className="emergency-fund-title">
          <span>🛡️ Fondo de Emergencia & Cobertura de Supervivencia</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            Meta de Cobertura:
          </span>
          <div className="emergency-months-selector" role="radiogroup" aria-label="Meta de Meses de Cobertura">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                className={`month-target-btn ${targetMonths === m ? 'active' : ''}`}
                onClick={() => setTargetMonths(m)}
              >
                {m} Meses
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="emergency-metrics-grid">
        <div className="emergency-stat-card">
          <div className="emergency-stat-label">Liquidez Disponible</div>
          <div className="emergency-stat-val num-mono text-gradient-emerald">
            {formatCurrency(totalLiquid, 'USD')}
          </div>
          <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-tertiary)' }}>
            Efectivo y cuentas a la vista
          </span>
        </div>

        <div className="emergency-stat-card">
          <div className="emergency-stat-label">Gasto Mensual Esencial</div>
          <div className="emergency-stat-val num-mono" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(monthlyBurnRate, 'USD')} / mes
          </div>
          <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-tertiary)' }}>
            Vivienda, comida y salud básica
          </span>
        </div>

        <div className="emergency-stat-card">
          <div className="emergency-stat-label">Meses de Cobertura</div>
          <div className="emergency-stat-val num-mono" style={{ color: isLow ? 'var(--color-warning)' : 'var(--color-primary-light)' }}>
            {monthsCovered} meses
          </div>
          <span className={`glass-pill ${status === EMERGENCY_STATUS.ROBUST ? 'emerald' : isLow ? 'danger' : 'gold'}`} style={{ fontSize: 'var(--font-size-2xs)' }}>
            {statusLabel}
          </span>
        </div>

        <div className="emergency-stat-card">
          <div className="emergency-stat-label">Meta ({targetMonths} Meses)</div>
          <div className="emergency-stat-val num-mono" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(targetAmount, 'USD')}
          </div>
          <span style={{ fontSize: 'var(--font-size-2xs)', color: isTargetAchieved ? 'var(--color-primary-light)' : 'var(--text-tertiary)' }}>
            {isTargetAchieved ? '✓ Meta Alcanzada' : `Faltan ${formatCurrency(gapToTarget, 'USD')}`}
          </span>
        </div>
      </div>

      {/* Progress Gauge */}
      <div className="emergency-gauge-track" role="progressbar" aria-valuenow={Math.round(percentCompleted)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`emergency-gauge-fill ${status === EMERGENCY_STATUS.CRITICAL ? 'critical' : status === EMERGENCY_STATUS.BASIC ? 'warning' : ''}`}
          style={{ width: `${percentCompleted}%` }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-2xs)', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        <span>Progreso hacia {targetMonths} meses de colchón: <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>{percentCompleted.toFixed(1)}%</strong></span>
        <span className="num-mono">{formatCurrency(totalLiquid, 'USD')} / {formatCurrency(targetAmount, 'USD')}</span>
      </div>

      {/* Advice / Diagnosis Banner */}
      <div className="emergency-advice-banner">
        <span>💡</span>
        <span>{advice}</span>
      </div>
    </div>
  );
}
