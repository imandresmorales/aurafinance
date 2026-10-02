import React, { useState, useMemo, useRef } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import {
  createLinearScale,
  calculateNiceTicks,
  generateSmoothPath,
  generateSmoothAreaPath,
} from '../../services/svgChartEngine';
import './CashFlowTimelineChart.css';

export function CashFlowTimelineChart() {
  const { transactions } = useAccounts();
  const [periodDays, setPeriodDays] = useState(30);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // SVG Dimensions & Margins
  const width = 800;
  const height = 320;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Aggregate daily cashflow data over the selected period
  const chartData = useMemo(() => {
    const today = new Date();
    const daysArray = [];

    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      daysArray.push({
        date: dateStr,
        label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    const dateMap = {};
    daysArray.forEach((item, index) => {
      dateMap[item.date] = index;
    });

    (transactions || []).forEach((t) => {
      if (!t || t.deleted || t.isDeleted || !t.date) return;
      const tDate = String(t.date).slice(0, 10);
      if (dateMap[tDate] !== undefined) {
        const idx = dateMap[tDate];
        const amt = Math.abs(Number(t.amount)) || 0;
        const type = (t.type || '').toUpperCase();

        if (type === 'INCOME') {
          daysArray[idx].income += amt;
        } else if (type === 'EXPENSE') {
          daysArray[idx].expense += amt;
        }
      }
    });

    let cumulativeNet = 0;
    daysArray.forEach((item) => {
      cumulativeNet += (item.income - item.expense);
      item.net = cumulativeNet;
    });

    return daysArray;
  }, [transactions, periodDays]);

  // Compute Scales
  const { xScale, yScale, yTicks, incomePoints, expensePoints, netPoints, incomePath, expensePath, incomeArea, expenseArea } = useMemo(() => {
    if (chartData.length === 0) {
      return { yTicks: [], incomePoints: [], expensePoints: [], netPoints: [] };
    }

    const maxVal = Math.max(
      ...chartData.map((d) => Math.max(d.income, d.expense)),
      100
    );
    const yMax = maxVal * 1.15;
    const yMin = 0;

    const xScale = createLinearScale([0, chartData.length - 1], [0, innerWidth]);
    const yScale = createLinearScale([yMin, yMax], [innerHeight, 0]);
    const yTicks = calculateNiceTicks(yMin, yMax, 4);

    const incomePoints = chartData.map((d, i) => ({ x: xScale(i), y: yScale(d.income), data: d }));
    const expensePoints = chartData.map((d, i) => ({ x: xScale(i), y: yScale(d.expense), data: d }));
    const netPoints = chartData.map((d, i) => ({ x: xScale(i), y: yScale(Math.max(0, d.net)), data: d }));

    const incomePath = generateSmoothPath(incomePoints);
    const expensePath = generateSmoothPath(expensePoints);
    const incomeArea = generateSmoothAreaPath(incomePoints, innerHeight);
    const expenseArea = generateSmoothAreaPath(expensePoints, innerHeight);

    return {
      xScale,
      yScale,
      yTicks,
      incomePoints,
      expensePoints,
      netPoints,
      incomePath,
      expensePath,
      incomeArea,
      expenseArea,
    };
  }, [chartData, innerWidth, innerHeight]);

  const handleMouseMove = (e) => {
    if (!containerRef.current || chartData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width - margin.left;
    const boundedX = Math.max(0, Math.min(innerWidth, relX));
    const pointIdx = Math.round((boundedX / innerWidth) * (chartData.length - 1));

    if (chartData[pointIdx]) {
      setHoveredPoint(chartData[pointIdx]);
      setMousePos({
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top),
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="chart-card-container" id="cashflow-timeline-section">
      <div className="chart-card-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Flujo de Caja Histórico SVG</span>
          </div>
          <h2 className="chart-card-title">
            <span>📈 Evolución Temporal de Ingresos vs Gastos</span>
          </h2>
        </div>

        <div className="chart-period-tabs">
          <button
            type="button"
            className={`chart-period-btn ${periodDays === 7 ? 'active' : ''}`}
            onClick={() => setPeriodDays(7)}
          >
            7 Días
          </button>
          <button
            type="button"
            className={`chart-period-btn ${periodDays === 30 ? 'active' : ''}`}
            onClick={() => setPeriodDays(30)}
          >
            30 Días
          </button>
          <button
            type="button"
            className={`chart-period-btn ${periodDays === 90 ? 'active' : ''}`}
            onClick={() => setPeriodDays(90)}
          >
            90 Días
          </button>
        </div>
      </div>

      <div
        className="chart-svg-wrapper"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          className="chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          aria-label="Gráfico interactivo de flujo de caja"
          role="img"
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid Horizontal Lines */}
            {yTicks.map((tickVal) => {
              const y = yScale(tickVal);
              return (
                <g key={tickVal}>
                  <line
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.08)"
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

            {/* X Axis Labels */}
            {chartData.map((d, i) => {
              const step = Math.ceil(chartData.length / 6);
              if (i % step !== 0 && i !== chartData.length - 1) return null;
              const x = xScale(i);
              return (
                <text
                  key={d.date}
                  x={x}
                  y={innerHeight + 24}
                  fill="var(--text-secondary)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              );
            })}

            {/* Areas */}
            {incomeArea && <path d={incomeArea} fill="url(#incomeGradient)" />}
            {expenseArea && <path d={expenseArea} fill="url(#expenseGradient)" />}

            {/* Curves */}
            {incomePath && (
              <path
                d={incomePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
            {expensePath && (
              <path
                d={expensePath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Hover Vertical Line */}
            {hoveredPoint && (
              <line
                x1={xScale(chartData.findIndex((d) => d.date === hoveredPoint.date))}
                y1={0}
                x2={xScale(chartData.findIndex((d) => d.date === hoveredPoint.date))}
                y2={innerHeight}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}
          </g>
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              📅 {hoveredPoint.label}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#10b981' }}>
              <span>Ingresos:</span>
              <strong className="num-mono">+{formatCurrency(hoveredPoint.income)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#f87171' }}>
              <span>Gastos:</span>
              <strong className="num-mono">-{formatCurrency(hoveredPoint.expense)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--color-accent-gold)', marginTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.25rem' }}>
              <span>Flujo Neto Acum.:</span>
              <strong className="num-mono">{formatCurrency(hoveredPoint.net)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: '#10b981' }} />
          <span>Ingresos Diarios</span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: '#ef4444' }} />
          <span>Gastos Diarios</span>
        </div>
      </div>

      {/* Screen Reader Table */}
      <table className="sr-only">
        <caption>Resumen de flujo de caja para los últimos {periodDays} días</caption>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Ingresos</th>
            <th>Gastos</th>
            <th>Flujo Neto Acumulado</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{d.income}</td>
              <td>{d.expense}</td>
              <td>{d.net}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default CashFlowTimelineChart;
