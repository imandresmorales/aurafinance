import React, { useState, useMemo, useRef } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { AccessibleDataTable } from '../common';
import {
  createLinearScale,
  calculateNiceTicks,
  generateSmoothPath,
  generateSmoothAreaPath,
} from '../../services/svgChartEngine';
import './NetWorthAreaChart.css';

export function NetWorthAreaChart() {
  const { accounts, transactions } = useAccounts();
  const [monthsCount, setMonthsCount] = useState(6);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const width = 800;
  const height = 320;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Compute monthly Net Worth evolution
  const chartData = useMemo(() => {
    const today = new Date();
    const months = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      months.push({
        yearMonth: ym,
        label,
        assets: 0,
        liabilities: 0,
        netWorth: 0,
      });
    }

    // Base current balances
    let currentAssets = 0;
    let currentLiabilities = 0;

    (accounts || []).forEach((acc) => {
      const bal = Number(acc.balance) || 0;
      if (acc.type === 'CREDIT' || acc.type === 'LOAN' || bal < 0) {
        currentLiabilities += Math.abs(bal);
      } else {
        currentAssets += bal;
      }
    });

    // Back-calculate historical balances from transactions
    for (let i = months.length - 1; i >= 0; i--) {
      months[i].assets = Math.max(0, currentAssets);
      months[i].liabilities = Math.max(0, currentLiabilities);
      months[i].netWorth = months[i].assets - months[i].liabilities;

      // Adjust delta for earlier month based on net flow of that month
      const ym = months[i].yearMonth;
      const monthTx = (transactions || []).filter(
        (t) => t && !t.deleted && !t.isDeleted && t.date && String(t.date).startsWith(ym)
      );

      let netMonthFlow = 0;
      monthTx.forEach((t) => {
        const amt = Number(t.amount) || 0;
        const type = (t.type || '').toUpperCase();
        if (type === 'INCOME') netMonthFlow += amt;
        else if (type === 'EXPENSE') netMonthFlow -= amt;
      });

      currentAssets = Math.max(0, currentAssets - netMonthFlow);
    }

    return months;
  }, [accounts, transactions, monthsCount]);

  // Scales & Paths
  const { xScale, yScale, yTicks, netWorthPath, netWorthArea, assetsPath, liabilitiesPath } = useMemo(() => {
    if (chartData.length === 0) {
      return { yTicks: [] };
    }

    const maxVal = Math.max(
      ...chartData.map((d) => Math.max(d.assets, d.netWorth)),
      1000
    );
    const yMax = maxVal * 1.15;
    const yMin = 0;

    const xScale = createLinearScale([0, chartData.length - 1], [0, innerWidth]);
    const yScale = createLinearScale([yMin, yMax], [innerHeight, 0]);
    const yTicks = calculateNiceTicks(yMin, yMax, 4);

    const netPoints = chartData.map((d, i) => ({ x: xScale(i), y: yScale(Math.max(0, d.netWorth)) }));
    const assetPoints = chartData.map((d, i) => ({ x: xScale(i), y: yScale(d.assets) }));
    const liabilityPoints = chartData.map((d, i) => ({ x: xScale(i), y: yScale(d.liabilities) }));

    const netWorthPath = generateSmoothPath(netPoints);
    const netWorthArea = generateSmoothAreaPath(netPoints, innerHeight);
    const assetsPath = generateSmoothPath(assetPoints);
    const liabilitiesPath = generateSmoothPath(liabilityPoints);

    return {
      xScale,
      yScale,
      yTicks,
      netWorthPath,
      netWorthArea,
      assetsPath,
      liabilitiesPath,
    };
  }, [chartData, innerWidth, innerHeight]);

  const currentNetWorth = chartData.length > 0 ? chartData[chartData.length - 1].netWorth : 0;
  const startNetWorth = chartData.length > 0 ? chartData[0].netWorth : 0;
  const growthRate = startNetWorth > 0
    ? ((currentNetWorth - startNetWorth) / startNetWorth) * 100
    : 0;

  const handleMouseMove = (e) => {
    if (!containerRef.current || chartData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width - margin.left;
    const boundedX = Math.max(0, Math.min(innerWidth, relX));
    const idx = Math.round((boundedX / innerWidth) * (chartData.length - 1));

    if (chartData[idx]) {
      setHoveredIndex(idx);
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const activePoint = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="networth-chart-card" id="networth-area-section">
      <div className="networth-chart-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Evolución Patrimonial</span>
          </div>
          <h2 className="networth-chart-title">
            <span>💎 Trayectoria del Patrimonio Neto (Área Apilada)</span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            Actual: <strong style={{ color: 'var(--color-primary-light)' }}>{formatCurrency(currentNetWorth)}</strong>
            <span style={{ marginLeft: '0.4rem', color: growthRate >= 0 ? '#10b981' : '#f87171' }}>
              ({growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%)
            </span>
          </div>

          <div className="chart-period-tabs">
            <button
              type="button"
              className={`chart-period-btn ${monthsCount === 6 ? 'active' : ''}`}
              onClick={() => setMonthsCount(6)}
            >
              6M
            </button>
            <button
              type="button"
              className={`chart-period-btn ${monthsCount === 12 ? 'active' : ''}`}
              onClick={() => setMonthsCount(12)}
            >
              12M
            </button>
          </div>
        </div>
      </div>

      <div
        className="networth-svg-wrapper"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg
          className="networth-svg"
          viewBox={`0 0 ${width} ${height}`}
          aria-label="Gráfico de evolución de patrimonio neto"
          role="img"
        >
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#082e23" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Horizontal Grid */}
            {yTicks.map((tickVal) => {
              const y = yScale ? yScale(tickVal) : 0;
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
              const x = xScale(i);
              return (
                <text
                  key={d.yearMonth}
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

            {/* Filled Area */}
            {netWorthArea && <path d={netWorthArea} fill="url(#netWorthGradient)" />}

            {/* Lines */}
            {assetsPath && (
              <path
                d={assetsPath}
                fill="none"
                stroke="#34d399"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
            {liabilitiesPath && (
              <path
                d={liabilitiesPath}
                fill="none"
                stroke="#f87171"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
            {netWorthPath && (
              <path
                d={netWorthPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {/* Hover indicator */}
            {hoveredIndex !== null && (
              <line
                x1={xScale(hoveredIndex)}
                y1={0}
                x2={xScale(hoveredIndex)}
                y2={innerHeight}
                stroke="rgba(226, 194, 117, 0.6)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}
          </g>
        </svg>

        {/* Tooltip */}
        {activePoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              📅 {activePoint.label} ({activePoint.yearMonth})
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#10b981' }}>
              <span>Activos Totales:</span>
              <strong className="num-mono">{formatCurrency(activePoint.assets)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#f87171' }}>
              <span>Pasivos / Deudas:</span>
              <strong className="num-mono">{formatCurrency(activePoint.liabilities)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'var(--color-accent-gold)', marginTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.25rem' }}>
              <span>Patrimonio Neto:</span>
              <strong className="num-mono">{formatCurrency(activePoint.netWorth)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="networth-legend">
        <div className="networth-legend-item">
          <span className="networth-legend-color" style={{ backgroundColor: '#10b981', height: '3px' }} />
          <span>Patrimonio Neto (Línea Sólida)</span>
        </div>
        <div className="networth-legend-item">
          <span className="networth-legend-color" style={{ backgroundColor: '#34d399', borderBottom: '1px dashed' }} />
          <span>Activos Brutos</span>
        </div>
        <div className="networth-legend-item">
          <span className="networth-legend-color" style={{ backgroundColor: '#f87171', borderBottom: '1px dashed' }} />
          <span>Pasivos / Pasivo Total</span>
        </div>
      </div>

      {/* Accessible Screen Reader Table */}
      <AccessibleDataTable
        caption="Historial de Evolución Patrimonial"
        headers={['Mes', 'Activos', 'Pasivos', 'Patrimonio Neto']}
        rows={chartData.map((d) => [
          d.label,
          formatCurrency(d.assets),
          formatCurrency(d.liabilities),
          formatCurrency(d.netWorth),
        ])}
      />
    </div>
  );
}
export default NetWorthAreaChart;
