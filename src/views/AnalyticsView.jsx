import React from 'react';
import {
  CashFlowTimelineChart,
  CategoryDonutChart,
  IncomeVsExpenseBarChart,
  SankeyMoneyFlow,
  SpendingHeatmap,
  NetWorthAreaChart,
} from '../components';
import { formatCurrency } from '../utils';

export default function AnalyticsView() {
  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
          <span>Motor de Inteligencia & Visualización</span>
        </div>
        <h1 className="text-gradient-emerald">Analítica & Flujo de Fondos</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Visualización de tendencias de consumo, análisis de flujo de caja y distribución patrimonial.
        </p>
      </header>

      {/* Stacked Net Worth Area Chart */}
      <NetWorthAreaChart />

      {/* Cash Flow Timeline Chart */}
      <CashFlowTimelineChart />

      {/* Grouped Income vs Expense Bar Chart */}
      <IncomeVsExpenseBarChart />

      {/* Sankey Money Flow Diagram */}
      <SankeyMoneyFlow />

      {/* Behavioral Spending Heatmap */}
      <SpendingHeatmap />

      {/* Category Donut Distribution */}
      <CategoryDonutChart />

      <div style={{ marginTop: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-accent-gold)', marginBottom: '1rem' }}>
            Proyección de Flujo a 90 Días
          </h3>
          <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Superávit neto proyectado: <strong className="num-mono" style={{ color: 'var(--color-primary-light)' }}>+{formatCurrency(12750)}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
