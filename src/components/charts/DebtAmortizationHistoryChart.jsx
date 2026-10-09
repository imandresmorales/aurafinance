import React, { useState, useId } from 'react';
import './DebtAmortizationHistoryChart.css';

/**
 * DebtAmortizationHistoryChart Component
 * High-performance vector SVG chart displaying the progressive reduction of debt principal balance
 * and accumulation of amortized capital over time with interactive tooltips and accessible screen-reader tables.
 */
export default function DebtAmortizationHistoryChart({
  schedule = [],
  originalBalance = 10000,
  title = 'Trayectoria de Amortización de Deuda',
  currency = 'USD',
  height = 240,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chartId = useId();

  // Fallback demo schedule if empty
  const activeSchedule = Array.isArray(schedule) && schedule.length > 0
    ? schedule
    : [
        { period: 0, date: '2026-01-01', endingBalance: 10000, cumulativePrincipal: 0, cumulativeInterest: 0 },
        { period: 6, date: '2026-06-01', endingBalance: 7800, cumulativePrincipal: 2200, cumulativeInterest: 380 },
        { period: 12, date: '2026-12-01', endingBalance: 5400, cumulativePrincipal: 4600, cumulativeInterest: 690 },
        { period: 18, date: '2027-06-01', endingBalance: 2800, cumulativePrincipal: 7200, cumulativeInterest: 890 },
        { period: 24, date: '2027-12-01', endingBalance: 0, cumulativePrincipal: 10000, cumulativeInterest: 990 },
      ];

  const maxVal = Math.max(originalBalance, ...activeSchedule.map((s) => s.endingBalance || 0), 100);
  const totalPeriods = Math.max(1, activeSchedule.length - 1);

  const svgWidth = 600;
  const svgHeight = height;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Calculate coordinates for balance line
  const points = activeSchedule.map((item, idx) => {
    const x = paddingX + (idx / totalPeriods) * graphWidth;
    const y = paddingY + (1 - (item.endingBalance || 0) / maxVal) * graphHeight;
    return { x, y, data: item };
  });

  const pathD = points.length > 0
    ? `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  const latestPoint = activeSchedule[activeSchedule.length - 1];
  const currentBalance = latestPoint ? latestPoint.endingBalance : 0;
  const totalAmortized = originalBalance - currentBalance;
  const pctPaid = originalBalance > 0 ? Math.round((totalAmortized / originalBalance) * 100) : 100;

  return (
    <div
      className="debt-amortization-chart-card"
      data-testid="debt-amortization-history-chart"
    >
      <div className="debt-chart-header">
        <div>
          <h3 className="debt-chart-title">{title}</h3>
          <p className="debt-chart-sub">Evolución de amortización de capital e intereses devengados</p>
        </div>

        <div className="debt-chart-kpis">
          <div className="debt-kpi-item">
            <span className="debt-kpi-lbl">Saldo Original</span>
            <span className="debt-kpi-val font-mono">${Number(originalBalance).toLocaleString('en-US')}</span>
          </div>
          <div className="debt-kpi-item">
            <span className="debt-kpi-lbl">Amortizado ({pctPaid}%)</span>
            <span className="debt-kpi-val font-mono text-emerald">${Number(totalAmortized).toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>

      <div className="debt-chart-svg-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="debt-amortization-svg"
          role="img"
          aria-labelledby={`${chartId}-title`}
        >
          <title id={`${chartId}-title`}>{title}</title>
          <defs>
            <linearGradient id={`${chartId}-area-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`${chartId}-line-grad`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} className="debt-grid-line" />
          <line x1={paddingX} y1={paddingY + graphHeight / 2} x2={svgWidth - paddingX} y2={paddingY + graphHeight / 2} className="debt-grid-line" />
          <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} className="debt-grid-line" />

          {/* Area under curve */}
          {areaD && <path d={areaD} fill={`url(#${chartId}-area-grad)`} />}

          {/* Amortization Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${chartId}-line-grad)`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Points */}
          {points.map((p, idx) => (
            <g
              key={idx}
              className="debt-chart-point-group"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="debt-data-dot"
                style={{
                  fill: idx === points.length - 1 ? '#10b981' : idx === 0 ? '#ef4444' : '#f59e0b',
                }}
              />
              <circle cx={p.x} cy={p.y} r="14" className="debt-data-hitbox" />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="debt-chart-tooltip"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
            }}
          >
            <div className="tooltip-period">Período {hoveredPoint.data.period} ({hoveredPoint.data.date})</div>
            <div className="tooltip-row">
              <span>Saldo Deuda:</span>
              <strong className="font-mono">${Number(hoveredPoint.data.endingBalance).toFixed(2)}</strong>
            </div>
            {hoveredPoint.data.cumulativePrincipal !== undefined && (
              <div className="tooltip-row">
                <span>Capital Pagado:</span>
                <strong className="font-mono text-emerald">
                  ${Number(hoveredPoint.data.cumulativePrincipal).toFixed(2)}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Screen Reader Table */}
      <div className="sr-only">
        <table>
          <caption>Cronograma de Amortización de Deuda</caption>
          <thead>
            <tr>
              <th scope="col">Período</th>
              <th scope="col">Fecha</th>
              <th scope="col">Saldo Restante</th>
            </tr>
          </thead>
          <tbody>
            {activeSchedule.map((row, idx) => (
              <tr key={idx}>
                <td>{row.period}</td>
                <td>{row.date}</td>
                <td>${row.endingBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
