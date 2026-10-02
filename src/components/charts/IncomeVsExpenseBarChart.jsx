import React, { useState, useMemo, useRef } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateGroupedBars, calculateNiceTicks } from '../../services/svgChartEngine';
import './IncomeVsExpenseBarChart.css';

export function IncomeVsExpenseBarChart() {
  const { transactions } = useAccounts();
  const [monthsCount, setMonthsCount] = useState(6);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const width = 800;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Aggregate monthly data
  const monthlyData = useMemo(() => {
    const today = new Date();
    const result = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yearMonth = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      result.push({
        yearMonth,
        group: label,
        income: 0,
        expense: 0,
      });
    }

    const map = {};
    result.forEach((r, idx) => {
      map[r.yearMonth] = idx;
    });

    (transactions || []).forEach((t) => {
      if (!t || t.deleted || t.isDeleted || !t.date) return;
      const ym = String(t.date).slice(0, 7);
      if (map[ym] !== undefined) {
        const idx = map[ym];
        const amt = Math.abs(Number(t.amount)) || 0;
        const type = (t.type || '').toUpperCase();

        if (type === 'INCOME') {
          result[idx].income += amt;
        } else if (type === 'EXPENSE') {
          result[idx].expense += amt;
        }
      }
    });

    return result.map((r) => ({
      group: r.group,
      yearMonth: r.yearMonth,
      income: r.income,
      expense: r.expense,
      savings: r.income - r.expense,
      values: [
        { key: 'income', label: 'Ingresos', value: r.income, color: '#10b981' },
        { key: 'expense', label: 'Gastos', value: r.expense, color: '#ef4444' },
      ],
    }));
  }, [transactions, monthsCount]);

  // Compute Layout via svgChartEngine
  const { groups, maxY, yTicks, yScale } = useMemo(() => {
    const layout = calculateGroupedBars(monthlyData, innerWidth, innerHeight, 0.25, 0.1);
    const yTicks = calculateNiceTicks(0, layout.maxY, 4);
    return {
      groups: layout.groups,
      maxY: layout.maxY,
      yTicks,
      yScale: layout.yScale,
    };
  }, [monthlyData, innerWidth, innerHeight]);

  // Consolidated KPIs
  const totalIncome = useMemo(
    () => monthlyData.reduce((s, m) => s + m.income, 0),
    [monthlyData]
  );
  const totalExpense = useMemo(
    () => monthlyData.reduce((s, m) => s + m.expense, 0),
    [monthlyData]
  );
  const totalSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const handleMouseEnterBar = (bar, group, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHoveredBar({
      ...bar,
      group: group.group,
    });
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="bar-chart-card" id="income-vs-expense-section">
      <div className="bar-chart-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Comparativa Mensual Agrupada</span>
          </div>
          <h2 className="bar-chart-title">
            <span>📊 Ingresos vs Gastos Mes a Mes</span>
          </h2>
        </div>

        <div className="chart-period-tabs">
          <button
            type="button"
            className={`chart-period-btn ${monthsCount === 6 ? 'active' : ''}`}
            onClick={() => setMonthsCount(6)}
          >
            6 Meses
          </button>
          <button
            type="button"
            className={`chart-period-btn ${monthsCount === 12 ? 'active' : ''}`}
            onClick={() => setMonthsCount(12)}
          >
            12 Meses
          </button>
        </div>
      </div>

      <div
        className="bar-svg-wrapper"
        ref={containerRef}
        onMouseLeave={() => setHoveredBar(null)}
      >
        <svg
          className="bar-svg"
          viewBox={`0 0 ${width} ${height}`}
          aria-label="Gráfico de barras agrupadas de ingresos vs gastos"
          role="img"
        >
          <defs>
            <linearGradient id="barIncomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="barExpenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid Horizontal Lines */}
            {yTicks.map((tickVal) => {
              const y = yScale ? yScale(tickVal) : 0;
              return (
                <g key={tickVal}>
                  <line
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={-10}
                    y={y + 4}
                    fill="var(--text-secondary)"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    textAnchor="end"
                  >
                    {formatCurrency(tickVal, false)}
                  </text>
                </g>
              );
            })}

            {/* Bars and Group Labels */}
            {groups.map((g, gIdx) => (
              <g key={gIdx}>
                {g.bars.map((b, bIdx) => (
                  <rect
                    key={bIdx}
                    x={b.x}
                    y={b.y}
                    width={b.width}
                    height={b.height}
                    rx="3"
                    fill={b.key === 'income' ? 'url(#barIncomeGrad)' : 'url(#barExpenseGrad)'}
                    className="chart-bar-rect"
                    onMouseEnter={(e) => handleMouseEnterBar(b, g, e)}
                    aria-label={`${g.group} - ${b.label}: ${formatCurrency(b.value)}`}
                  />
                ))}

                {/* X Axis Group Label */}
                <text
                  x={g.x}
                  y={innerHeight + 22}
                  fill="var(--text-secondary)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {g.group}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredBar && (
          <div
            className="chart-tooltip"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              📅 {hoveredBar.group}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: hoveredBar.color }}>
              <span>{hoveredBar.label}:</span>
              <strong className="num-mono">{formatCurrency(hoveredBar.value)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Aggregate KPIs */}
      <div className="bar-kpi-summary">
        <div className="bar-kpi-item">
          <div className="bar-kpi-label">Ingresos Totales ({monthsCount}M)</div>
          <div className="bar-kpi-val num-mono" style={{ color: 'var(--color-primary-light)' }}>
            {formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="bar-kpi-item">
          <div className="bar-kpi-label">Gastos Totales ({monthsCount}M)</div>
          <div className="bar-kpi-val num-mono" style={{ color: '#f87171' }}>
            {formatCurrency(totalExpense)}
          </div>
        </div>

        <div className="bar-kpi-item">
          <div className="bar-kpi-label">Ahorro Neto Acumulado</div>
          <div
            className="bar-kpi-val num-mono"
            style={{
              color: totalSavings >= 0 ? 'var(--color-accent-gold)' : '#f87171',
            }}
          >
            {totalSavings >= 0 ? '+' : ''}
            {formatCurrency(totalSavings)}
          </div>
        </div>

        <div className="bar-kpi-item">
          <div className="bar-kpi-label">Tasa de Ahorro Promedio</div>
          <div className="bar-kpi-val num-mono" style={{ color: 'var(--text-primary)' }}>
            {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
export default IncomeVsExpenseBarChart;
