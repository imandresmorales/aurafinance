import React, { useState, useMemo, useRef } from 'react';
import { useAccounts } from '../../hooks';
import {
  CashFlowTimelineChart,
  IncomeVsExpenseBarChart,
  CategoryDonutChart,
  WaterfallBalanceChart,
  SankeyMoneyFlow,
  SpendingHeatmap,
  NetWorthAreaChart,
  FinancialRadarChart,
} from './index';
import { exportSvgToPng, exportSvgToFile } from '../../utils/chartExporter';
import './FinancialChartsSuite.css';

export default function FinancialChartsSuite() {
  const { transactions, wallets, baseCurrency = 'USD' } = useAccounts();
  const [suiteMode, setSuiteMode] = useState('executive'); // 'executive' | 'flows' | 'wealth' | 'deep_dive'
  const [dateRangeFilter, setDateRangeFilter] = useState('90D'); // '30D' | '90D' | '180D' | '1Y' | 'ALL'
  const [syncedHoverDate, setSyncedHoverDate] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('cashflow'); // for deep_dive mode
  const suiteContainerRef = useRef(null);

  // Filter transactions according to selected date range
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    if (dateRangeFilter === 'ALL') return transactions;

    const now = new Date();
    let daysToSubtract = 90;
    if (dateRangeFilter === '30D') daysToSubtract = 30;
    if (dateRangeFilter === '180D') daysToSubtract = 180;
    if (dateRangeFilter === '1Y') daysToSubtract = 365;

    const cutoffDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return transactions.filter((t) => {
      const txDate = t.date ? t.date.split('T')[0] : '';
      return txDate >= cutoffStr;
    });
  }, [transactions, dateRangeFilter]);

  // Aggregate summary metrics for current filtered set
  const suiteMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap = {};

    filteredTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else if (t.type === 'expense') {
        expense += amt;
        const cat = t.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + amt;
      }
    });

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;

    let topCategory = 'N/A';
    let topCatAmount = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatAmount) {
        topCategory = cat;
        topCatAmount = val;
      }
    });

    return {
      income,
      expense,
      net,
      savingsRate,
      topCategory,
      topCatAmount,
      txCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Handle export action for first SVG found in current view
  const handleExportSvg = () => {
    if (!suiteContainerRef.current) return;
    const svgEl = suiteContainerRef.current.querySelector('svg');
    if (svgEl) {
      exportSvgToFile(svgEl, `aurafinance_${suiteMode}_chart.svg`);
    }
  };

  const handleExportPng = () => {
    if (!suiteContainerRef.current) return;
    const svgEl = suiteContainerRef.current.querySelector('svg');
    if (svgEl) {
      exportSvgToPng(svgEl, `aurafinance_${suiteMode}_chart.png`, 2);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: baseCurrency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="financial-charts-suite" ref={suiteContainerRef} role="region" aria-label="Suite Financiera de Gráficos Analíticos">
      {/* Header Controls */}
      <div className="suite-header">
        <div className="suite-title-area">
          <div className="suite-badge">Suite de Inteligencia Gráfica</div>
          <h2 className="suite-title">Centro Visual Financiero</h2>
          <p className="suite-subtitle">
            Análisis sincronizado de liquidez, patrimonio, flujos y cascada de capital.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="suite-toolbar">
          {/* Date Filter Buttons */}
          <div className="suite-range-group" role="group" aria-label="Filtro de periodo temporal">
            {['30D', '90D', '180D', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                type="button"
                className={`suite-btn-range ${dateRangeFilter === range ? 'active' : ''}`}
                onClick={() => setDateRangeFilter(range)}
              >
                {range === 'ALL' ? 'Histórico' : range}
              </button>
            ))}
          </div>

          {/* Export Group */}
          <div className="suite-export-group">
            <button
              type="button"
              className="suite-export-btn"
              onClick={handleExportSvg}
              title="Exportar gráfico activo como SVG vectorial"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>SVG</span>
            </button>
            <button
              type="button"
              className="suite-export-btn"
              onClick={handleExportPng}
              title="Exportar gráfico activo como imagen PNG Ultra-HD"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>PNG 2x</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Metrics Summary KPI Row */}
      <div className="suite-kpi-bar">
        <div className="suite-kpi-item">
          <span className="suite-kpi-label">Ingresos Totales</span>
          <span className="suite-kpi-value positive">{formatMoney(suiteMetrics.income)}</span>
        </div>
        <div className="suite-kpi-item">
          <span className="suite-kpi-label">Gastos Totales</span>
          <span className="suite-kpi-value negative">{formatMoney(suiteMetrics.expense)}</span>
        </div>
        <div className="suite-kpi-item">
          <span className="suite-kpi-label">Flujo Neto</span>
          <span className={`suite-kpi-value ${suiteMetrics.net >= 0 ? 'positive' : 'negative'}`}>
            {formatMoney(suiteMetrics.net)}
          </span>
        </div>
        <div className="suite-kpi-item">
          <span className="suite-kpi-label">Tasa de Ahorro</span>
          <span className="suite-kpi-value highlight">{suiteMetrics.savingsRate.toFixed(1)}%</span>
        </div>
        <div className="suite-kpi-item">
          <span className="suite-kpi-label">Mayor Gasto</span>
          <span className="suite-kpi-value neutral">{suiteMetrics.topCategory} ({formatMoney(suiteMetrics.topCatAmount)})</span>
        </div>
        {syncedHoverDate && (
          <div className="suite-kpi-item sync-indicator">
            <span className="suite-kpi-label">Fecha Inspeccionada</span>
            <span className="suite-kpi-value sync-date">{syncedHoverDate}</span>
          </div>
        )}
      </div>

      {/* Navigation Modes Switcher */}
      <div className="suite-nav-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={suiteMode === 'executive'}
          className={`suite-tab-btn ${suiteMode === 'executive' ? 'active' : ''}`}
          onClick={() => setSuiteMode('executive')}
        >
          <span className="tab-icon">📊</span>
          <span>Visión Ejecutiva</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={suiteMode === 'flows'}
          className={`suite-tab-btn ${suiteMode === 'flows' ? 'active' : ''}`}
          onClick={() => setSuiteMode('flows')}
        >
          <span className="tab-icon">🌊</span>
          <span>Flujos y Cascada</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={suiteMode === 'wealth'}
          className={`suite-tab-btn ${suiteMode === 'wealth' ? 'active' : ''}`}
          onClick={() => setSuiteMode('wealth')}
        >
          <span className="tab-icon">💎</span>
          <span>Patrimonio & Radar</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={suiteMode === 'deep_dive'}
          className={`suite-tab-btn ${suiteMode === 'deep_dive' ? 'active' : ''}`}
          onClick={() => setSuiteMode('deep_dive')}
        >
          <span className="tab-icon">🔍</span>
          <span>Inspección Detallada</span>
        </button>
      </div>

      {/* Suite Content Layouts */}
      <div className="suite-content-container">
        {/* MODE 1: EXECUTIVE 4-GRID */}
        {suiteMode === 'executive' && (
          <div className="suite-grid-2x2">
            <div className="suite-chart-card">
              <CashFlowTimelineChart transactions={filteredTransactions} />
            </div>
            <div className="suite-chart-card">
              <IncomeVsExpenseBarChart transactions={filteredTransactions} />
            </div>
            <div className="suite-chart-card">
              <WaterfallBalanceChart transactions={filteredTransactions} />
            </div>
            <div className="suite-chart-card">
              <CategoryDonutChart transactions={filteredTransactions} />
            </div>
          </div>
        )}

        {/* MODE 2: FLOWS & HEATMAP */}
        {suiteMode === 'flows' && (
          <div className="suite-flow-layout">
            <div className="suite-chart-card full-width">
              <SankeyMoneyFlow transactions={filteredTransactions} />
            </div>
            <div className="suite-flow-columns">
              <div className="suite-chart-card">
                <WaterfallBalanceChart transactions={filteredTransactions} />
              </div>
              <div className="suite-chart-card">
                <SpendingHeatmap transactions={filteredTransactions} />
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: WEALTH & RADAR */}
        {suiteMode === 'wealth' && (
          <div className="suite-grid-2x1">
            <div className="suite-chart-card">
              <NetWorthAreaChart transactions={filteredTransactions} wallets={wallets} />
            </div>
            <div className="suite-chart-card">
              <FinancialRadarChart transactions={filteredTransactions} />
            </div>
          </div>
        )}

        {/* MODE 4: DEEP DIVE */}
        {suiteMode === 'deep_dive' && (
          <div className="suite-deep-dive-layout">
            <div className="suite-subtab-bar">
              {[
                { id: 'cashflow', label: 'Línea Temporal de Saldo' },
                { id: 'waterfall', label: 'Cascada de Balance' },
                { id: 'sankey', label: 'Diagrama Sankey' },
                { id: 'networth', label: 'Evolución Patrimonial' },
                { id: 'bar', label: 'Ingresos vs Gastos' },
                { id: 'heatmap', label: 'Mapa de Calor' },
                { id: 'radar', label: 'Radar Financiero' },
                { id: 'donut', label: 'Distribución por Categorías' },
              ].map((subtab) => (
                <button
                  key={subtab.id}
                  type="button"
                  className={`suite-subtab-btn ${activeChartTab === subtab.id ? 'active' : ''}`}
                  onClick={() => setActiveChartTab(subtab.id)}
                >
                  {subtab.label}
                </button>
              ))}
            </div>

            <div className="suite-focused-chart-card">
              {activeChartTab === 'cashflow' && (
                <CashFlowTimelineChart transactions={filteredTransactions} />
              )}
              {activeChartTab === 'waterfall' && (
                <WaterfallBalanceChart transactions={filteredTransactions} />
              )}
              {activeChartTab === 'sankey' && (
                <SankeyMoneyFlow transactions={filteredTransactions} />
              )}
              {activeChartTab === 'networth' && (
                <NetWorthAreaChart transactions={filteredTransactions} wallets={wallets} />
              )}
              {activeChartTab === 'bar' && (
                <IncomeVsExpenseBarChart transactions={filteredTransactions} />
              )}
              {activeChartTab === 'heatmap' && (
                <SpendingHeatmap transactions={filteredTransactions} />
              )}
              {activeChartTab === 'radar' && (
                <FinancialRadarChart transactions={filteredTransactions} />
              )}
              {activeChartTab === 'donut' && (
                <CategoryDonutChart transactions={filteredTransactions} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
