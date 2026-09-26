import React, { useState } from 'react';
import { useAccounts } from '../../hooks';
import { calculateDashboardMetrics } from '../../services';
import { formatCurrency } from '../../utils';
import './DashboardBalanceCards.css';

export default function DashboardBalanceCards() {
  const { accounts, balances, transactions, netWorthData } = useAccounts();
  const [selectedPeriod, setSelectedPeriod] = useState('THIS_MONTH');

  const metrics = calculateDashboardMetrics({
    accounts,
    balances,
    transactions,
    period: selectedPeriod,
  });

  const getSavingsBadge = (tier, rate) => {
    switch (tier) {
      case 'EXCELLENT':
        return { label: `Tasa Excelente: +${rate}%`, className: 'savings-badge excellent' };
      case 'HEALTHY':
        return { label: `Tasa Saludable: +${rate}%`, className: 'savings-badge healthy' };
      case 'TIGHT':
        return { label: `Tasa Ajustada: +${rate}%`, className: 'savings-badge tight' };
      default:
        return { label: `Déficit: ${rate}%`, className: 'savings-badge deficit' };
    }
  };

  const savingsBadge = getSavingsBadge(metrics.savingsTier, metrics.savingsRate);

  return (
    <div className="dashboard-cards-section">
      {/* Period Selection Tabs */}
      <div className="dashboard-period-bar">
        <div className="period-tabs">
          <button
            type="button"
            className={`period-tab ${selectedPeriod === 'THIS_MONTH' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('THIS_MONTH')}
          >
            Este Mes
          </button>
          <button
            type="button"
            className={`period-tab ${selectedPeriod === 'LAST_30_DAYS' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('LAST_30_DAYS')}
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            className={`period-tab ${selectedPeriod === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('ALL')}
          >
            Histórico Total
          </button>
        </div>

        <span className="period-summary-text">
          {metrics.periodTxCount} movimientos contables analizados
        </span>
      </div>

      {/* 4 Interactive KPI Cards Grid */}
      <div className="kpi-cards-grid">
        {/* Card 1: Patrimonio Neto */}
        <div className="glass-card kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Patrimonio Neto Total</span>
            <span className="glass-pill emerald" style={{ fontSize: '0.7rem' }}>
              {netWorthData.debtRatio === 0 ? '100% Solvente' : `${netWorthData.debtRatio}% Apalancado`}
            </span>
          </div>
          <div className="kpi-value text-gradient-emerald num-mono">
            {formatCurrency(netWorthData.netWorth)}
          </div>
          <div className="kpi-subtext">
            <span>Activos: {formatCurrency(netWorthData.totalAssets)}</span>
            <span>Pasivos: {formatCurrency(netWorthData.totalLiabilities)}</span>
          </div>
        </div>

        {/* Card 2: Ingresos del Periodo */}
        <div className="glass-card kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Ingresos ({selectedPeriod === 'THIS_MONTH' ? 'Mes' : 'Periodo'})</span>
            <span className="glass-pill emerald" style={{ fontSize: '0.7rem' }}>
              {metrics.incomeTxCount} abonos
            </span>
          </div>
          <div className="kpi-value text-emerald num-mono">
            +{formatCurrency(metrics.totalIncome)}
          </div>
          <div className="kpi-subtext">
            <span>Promedio diario: {formatCurrency(metrics.totalIncome / 30)}</span>
          </div>
        </div>

        {/* Card 3: Gastos del Periodo */}
        <div className="glass-card kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Gastos ({selectedPeriod === 'THIS_MONTH' ? 'Mes' : 'Periodo'})</span>
            <span className="glass-pill" style={{ fontSize: '0.7rem', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              {metrics.expenseTxCount} cargos
            </span>
          </div>
          <div className="kpi-value text-crimson num-mono">
            -{formatCurrency(metrics.totalExpenses)}
          </div>
          <div className="kpi-subtext">
            <span>Ritmo de quema: {formatCurrency(metrics.dailyBurn)}/día</span>
          </div>
        </div>

        {/* Card 4: Flujo Neto & Tasa de Ahorro */}
        <div className="glass-card kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Flujo Neto & Ahorro</span>
            <span className={savingsBadge.className}>
              {savingsBadge.label}
            </span>
          </div>
          <div className={`kpi-value num-mono ${metrics.netCashFlow >= 0 ? 'text-gradient-gold' : 'text-crimson'}`}>
            {metrics.netCashFlow >= 0 ? `+${formatCurrency(metrics.netCashFlow)}` : formatCurrency(metrics.netCashFlow)}
          </div>
          <div className="kpi-subtext">
            <span>Runway disponible: <strong>{metrics.runwayMonths} meses</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
