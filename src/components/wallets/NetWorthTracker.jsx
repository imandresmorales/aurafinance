import React, { useState } from 'react';
import { useAccounts } from '../../hooks';
import { calculateNetWorthAnalytics } from '../../services';
import { formatCurrency } from '../../utils';
import './NetWorthTracker.css';

export default function NetWorthTracker() {
  const { accounts, balances } = useAccounts();
  const [showDetails, setShowDetails] = useState(false);

  const analytics = calculateNetWorthAnalytics(accounts, balances);

  const getSolvencyBadge = (status) => {
    switch (status) {
      case 'EXCELLENT':
        return { label: 'Solvencia Excelente (0% Deuda)', className: 'solvency-badge excellent' };
      case 'SOLID':
        return { label: `Apalancamiento Bajo (${analytics.debtRatio}%)`, className: 'solvency-badge solid' };
      case 'MODERATE':
        return { label: `Apalancamiento Moderado (${analytics.debtRatio}%)`, className: 'solvency-badge moderate' };
      default:
        return { label: `Alto Endeudamiento (${analytics.debtRatio}%)`, className: 'solvency-badge vulnerable' };
    }
  };

  const badge = getSolvencyBadge(analytics.solvencyStatus);

  return (
    <div className="networth-tracker-card glass-panel">
      {/* Top Header */}
      <div className="networth-header-row">
        <div>
          <span className="networth-eyebrow">Patrimonio Neto Consolidado</span>
          <h2 className="networth-amount text-gradient-emerald num-mono">
            {formatCurrency(analytics.netWorth)}
          </h2>
        </div>

        <div className="networth-badge-wrap">
          <span className={badge.className}>{badge.label}</span>
        </div>
      </div>

      {/* Assets vs Liabilities Metric Blocks */}
      <div className="networth-metrics-grid">
        <div className="networth-metric-box asset">
          <div className="metric-box-header">
            <span className="metric-box-icon">📈</span>
            <span className="metric-box-title">Activos Totales</span>
          </div>
          <span className="metric-box-val num-mono">{formatCurrency(analytics.totalAssets)}</span>
          <div className="metric-box-sub">
            <span>Liquidez: {formatCurrency(analytics.liquidAssets)}</span>
            <span>Inversiones: {formatCurrency(analytics.investmentAssets)}</span>
          </div>
        </div>

        <div className="networth-metric-box liability">
          <div className="metric-box-header">
            <span className="metric-box-icon">📉</span>
            <span className="metric-box-title">Pasivos / Deudas</span>
          </div>
          <span className="metric-box-val num-mono">
            {analytics.totalLiabilities > 0 ? `-${formatCurrency(analytics.totalLiabilities)}` : '$0.00'}
          </span>
          <div className="metric-box-sub">
            <span>Corto Plazo: {formatCurrency(analytics.shortTermDebt)}</span>
            <span>Largo Plazo: {formatCurrency(analytics.longTermDebt)}</span>
          </div>
        </div>
      </div>

      {/* Distribution Allocation Bars */}
      <div className="networth-allocation-wrap">
        <div className="allocation-header">
          <span>Distribución Patrimonial</span>
          <span className="allocation-summary">
            Liquidez: {analytics.liquidityRatio}% · Inversión: {analytics.investmentRatio}% · Deuda: {analytics.debtRatio}%
          </span>
        </div>

        <div className="allocation-bar-track">
          <div
            className="allocation-bar-fill liquid"
            style={{ width: `${Math.min(analytics.liquidityRatio, 100)}%` }}
            title={`Liquidez: ${analytics.liquidityRatio}%`}
          />
          <div
            className="allocation-bar-fill investment"
            style={{ width: `${Math.min(analytics.investmentRatio, 100)}%` }}
            title={`Inversión: ${analytics.investmentRatio}%`}
          />
        </div>
      </div>

      {/* Toggle Details Button */}
      <div className="networth-footer-action">
        <button
          type="button"
          className="networth-toggle-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          <span>{showDetails ? '▲ Ocultar Desglose por Cuentas' : '▼ Ver Desglose por Cuentas'}</span>
        </button>
      </div>

      {/* Expanded Account Balances Breakdown */}
      {showDetails && (
        <div className="networth-breakdown-list">
          {analytics.accountsBreakdown.map((item) => (
            <div key={item.id} className="networth-breakdown-item">
              <div className="breakdown-name-col">
                <span className="breakdown-name">{item.name}</span>
                <span className="breakdown-class-pill">{item.classification === 'ASSET' ? 'Activo' : 'Pasivo'}</span>
              </div>
              <span
                className={`breakdown-amount num-mono ${
                  item.classification === 'ASSET' ? 'text-emerald' : 'text-crimson'
                }`}
              >
                {item.balance >= 0 ? `+${formatCurrency(item.balance, item.currency)}` : formatCurrency(item.balance, item.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
