import React, { useState } from 'react';
import { useDashboardLayout } from '../../hooks';
import {
  CashFlowTimelineChart,
  CategoryDonutChart,
  IncomeVsExpenseBarChart,
  SankeyMoneyFlow,
  SpendingHeatmap,
  NetWorthAreaChart,
  FinancialRadarChart,
  WaterfallBalanceChart,
} from '../charts';
import { MicroTrendCards } from './MicroTrendCards';
import { IncomeExpenseCorrelationCard } from './IncomeExpenseCorrelationCard';
import './ModularAnalyticsDashboard.css';

export function ModularAnalyticsDashboard() {
  const [showConfig, setShowConfig] = useState(false);
  const { widgets, toggleWidgetVisibility, moveWidget, resetLayout } = useDashboardLayout();

  const renderWidgetContent = (widgetId) => {
    switch (widgetId) {
      case 'micro-trends':
        return <MicroTrendCards />;
      case 'windfall-correlation':
        return <IncomeExpenseCorrelationCard />;
      case 'financial-radar':
        return <FinancialRadarChart />;
      case 'net-worth-area':
        return <NetWorthAreaChart />;
      case 'cash-flow-timeline':
        return <CashFlowTimelineChart />;
      case 'income-vs-expense':
        return <IncomeVsExpenseBarChart />;
      case 'sankey-flow':
        return <SankeyMoneyFlow />;
      case 'spending-heatmap':
        return <SpendingHeatmap />;
      case 'waterfall-balance':
        return <WaterfallBalanceChart />;
      case 'category-donut':
        return <CategoryDonutChart />;
      default:
        return null;
    }
  };

  return (
    <div className="modular-analytics-dashboard">
      <div className="modular-dashboard-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Panel Analítico Modular y Configurable</span>
          </div>
          <h1 className="text-gradient-emerald">Analítica & Flujo de Fondos</h1>
        </div>

        <button
          type="button"
          className="glass-pill gold"
          onClick={() => setShowConfig(!showConfig)}
          style={{ padding: '0.45rem 0.95rem', fontSize: 'var(--font-size-xs)', cursor: 'pointer', fontWeight: 600 }}
          aria-expanded={showConfig}
        >
          ⚙️ {showConfig ? 'Cerrar Personalización' : 'Personalizar Widgets'}
        </button>
      </div>

      {/* Widget Customization Drawer / Panel */}
      {showConfig && (
        <div className="modular-config-panel" role="region" aria-label="Configuración de widgets analíticos">
          <div className="modular-config-title">
            <span>🎛️ Disposición de Widgets y Métricas</span>
            <button
              type="button"
              className="glass-pill"
              onClick={resetLayout}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', cursor: 'pointer' }}
            >
              🔄 Restaurar Predeterminado
            </button>
          </div>

          <div className="modular-widget-list">
            {widgets.map((w, idx) => (
              <div key={w.id} className="modular-widget-row">
                <div className="modular-widget-left">
                  <input
                    type="checkbox"
                    id={`toggle-${w.id}`}
                    checked={w.visible}
                    onChange={() => toggleWidgetVisibility(w.id)}
                    style={{ accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <label htmlFor={`toggle-${w.id}`} style={{ cursor: 'pointer', fontWeight: w.visible ? 600 : 400, color: w.visible ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {w.title}
                  </label>
                </div>

                <div className="modular-widget-controls">
                  <button
                    type="button"
                    className="modular-order-btn"
                    onClick={() => moveWidget(idx, -1)}
                    disabled={idx === 0}
                    aria-label={`Mover ${w.title} hacia arriba`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="modular-order-btn"
                    onClick={() => moveWidget(idx, 1)}
                    disabled={idx === widgets.length - 1}
                    aria-label={`Mover ${w.title} hacia abajo`}
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Active Widgets in User Defined Order */}
      <div className="modular-widgets-flow">
        {widgets.filter((w) => w.visible).map((w) => (
          <div key={w.id} className="modular-widget-block" id={`widget-${w.id}`}>
            {renderWidgetContent(w.id)}
          </div>
        ))}
      </div>
    </div>
  );
}
export default ModularAnalyticsDashboard;
