import React, { useMemo, useState, useRef } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateWaterfallBreakdown } from '../../services/waterfallEngine';
import { createLinearScale, calculateNiceTicks } from '../../services/svgChartEngine';
import './WaterfallBalanceChart.css';

export function WaterfallBalanceChart() {
  const { accounts, transactions } = useAccounts();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const initialBalance = useMemo(() => {
    return (accounts || []).reduce((sum, a) => {
      const bal = Number(a.balance) || 0;
      return sum + (a.type !== 'CREDIT' ? bal : -Math.abs(bal));
    }, 0);
  }, [accounts]);

  const waterfall = useMemo(() => {
    return calculateWaterfallBreakdown(initialBalance, transactions, currentMonth);
  }, [initialBalance, transactions, currentMonth]);

  const width = 800;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { stepBlocks, yTicks, yScale } = useMemo(() => {
    if (waterfall.steps.length === 0) return { stepBlocks: [], yTicks: [] };

    const yScale = createLinearScale([waterfall.minVal, waterfall.maxVal], [innerHeight, 0]);
    const yTicks = calculateNiceTicks(waterfall.minVal, waterfall.maxVal, 4);

    const stepWidth = innerWidth / waterfall.steps.length;
    const barWidth = stepWidth * 0.7;
    const barMargin = (stepWidth - barWidth) / 2;

    const stepBlocks = waterfall.steps.map((step, idx) => {
      const x = idx * stepWidth + barMargin;
      const yTop = yScale(Math.max(step.startValue, step.endValue));
      const yBottom = yScale(Math.min(step.startValue, step.endValue));
      const blockHeight = Math.max(4, yBottom - yTop);

      return {
        ...step,
        x,
        y: yTop,
        width: barWidth,
        height: blockHeight,
        centerX: x + barWidth / 2,
        nextStartX: idx < waterfall.steps.length - 1 ? (idx + 1) * stepWidth + barMargin : null,
        nextY: idx < waterfall.steps.length - 1 ? yScale(step.endValue) : null,
      };
    });

    return { stepBlocks, yTicks, yScale };
  }, [waterfall, innerWidth, innerHeight]);

  const handleMouseEnter = (step, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHoveredStep(step);
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="waterfall-card-container" id="waterfall-balance-section">
      <div className="waterfall-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Puente de Variación Financiera</span>
          </div>
          <h2 className="waterfall-title">
            <span>🪜 Gráfico de Cascada (Waterfall Balance)</span>
          </h2>
        </div>

        <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Variación Neta: <strong style={{ color: waterfall.netChange >= 0 ? 'var(--color-primary-light)' : '#f87171' }}>
            {waterfall.netChange >= 0 ? '+' : ''}{formatCurrency(waterfall.netChange)}
          </strong>
        </div>
      </div>

      <div
        className="waterfall-svg-wrapper"
        ref={containerRef}
        onMouseLeave={() => setHoveredStep(null)}
      >
        <svg
          className="waterfall-svg"
          viewBox={`0 0 ${width} ${height}`}
          aria-label="Gráfico de cascada de descomposición de balance"
          role="img"
        >
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

            {/* Connecting Step Lines */}
            {stepBlocks.map((b, i) => {
              if (b.nextStartX === null || b.nextY === null) return null;
              return (
                <line
                  key={`line-${i}`}
                  x1={b.x + b.width}
                  y1={b.nextY}
                  x2={b.nextStartX}
                  y2={b.nextY}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeDasharray="2 2"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Step Blocks */}
            {stepBlocks.map((b) => (
              <g key={b.id}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  rx="3"
                  fill={b.color}
                  className="waterfall-block"
                  onMouseEnter={(e) => handleMouseEnter(b, e)}
                />
                <text
                  x={b.centerX}
                  y={innerHeight + 22}
                  fill="var(--text-secondary)"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {b.label}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredStep && (
          <div
            className="chart-tooltip"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {hoveredStep.label}
            </div>
            <div className="num-mono" style={{ color: hoveredStep.color, marginTop: '0.2rem' }}>
              Monto: {formatCurrency(hoveredStep.amount)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default WaterfallBalanceChart;
