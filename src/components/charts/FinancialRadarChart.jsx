import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import {
  calculateFinancialRadarScores,
  generateRadarGeometry,
  RADAR_PILLARS,
} from '../../services/financialRadarEngine';
import './FinancialRadarChart.css';

export function FinancialRadarChart() {
  const { accounts, budgets, transactions } = useAccounts();
  const [hoveredPillar, setHoveredPillar] = useState(null);

  const { scores, globalIndex, pillars } = useMemo(() => {
    return calculateFinancialRadarScores(accounts, budgets, transactions);
  }, [accounts, budgets, transactions]);

  const geometry = useMemo(() => {
    return generateRadarGeometry(scores, 160, 160, 105);
  }, [scores]);

  return (
    <div className="radar-chart-card" id="financial-radar-section">
      <div className="radar-chart-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Pentagrama de Equilibrio Financiero</span>
          </div>
          <h2 className="radar-chart-title">
            <span>🕸️ Radar de Salud y Solvencia Patrimonial</span>
          </h2>
        </div>

        <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Índice Global: <strong style={{ color: 'var(--color-accent-gold)', fontSize: '1.1rem' }}>{globalIndex}/100</strong>
        </div>
      </div>

      <div className="radar-layout-grid">
        {/* Radar SVG Chart */}
        <div className="radar-svg-container">
          <svg
            className="radar-svg"
            viewBox="0 0 320 320"
            aria-label="Gráfico de radar pentagonal de salud financiera"
            role="img"
          >
            {/* Concentric Grid Levels */}
            <g>
              {geometry.gridLevels.map((pts, i) => (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray={i === 4 ? 'none' : '2 2'}
                />
              ))}
            </g>

            {/* Spokes */}
            <g>
              {geometry.spokes.map((spoke, i) => (
                <line
                  key={i}
                  x1={spoke.x1}
                  y1={spoke.y1}
                  x2={spoke.x2}
                  y2={spoke.y2}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
              ))}
            </g>

            {/* User Polygon */}
            <path d={geometry.userPolygonPath} className="radar-polygon" />

            {/* Vertex Dots */}
            {geometry.userVertices.map((v) => (
              <circle
                key={v.key}
                cx={v.x}
                cy={v.y}
                r="4.5"
                className="radar-vertex-dot"
                onMouseEnter={() => setHoveredPillar(v.key)}
                onMouseLeave={() => setHoveredPillar(null)}
                aria-label={`${v.key}: ${v.score}/100`}
              />
            ))}

            {/* Labels */}
            {geometry.labelPositions.map((lp) => {
              const pillar = RADAR_PILLARS.find((p) => p.key === lp.key);
              const isHovered = hoveredPillar === lp.key;
              return (
                <text
                  key={lp.key}
                  x={lp.x}
                  y={lp.y}
                  fill={isHovered ? 'var(--color-accent-gold)' : 'var(--text-secondary)'}
                  fontSize="10"
                  fontWeight={isHovered ? '700' : '600'}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {pillar?.label} ({scores[lp.key]}%)
                </text>
              );
            })}
          </svg>
        </div>

        {/* 5-Pillar Breakdown Bars */}
        <div className="radar-pillars-list">
          {pillars.map((p) => {
            const isHovered = hoveredPillar === p.key;
            return (
              <div
                key={p.key}
                className="radar-pillar-item"
                style={{
                  borderColor: isHovered ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.04)',
                }}
                onMouseEnter={() => setHoveredPillar(p.key)}
                onMouseLeave={() => setHoveredPillar(null)}
              >
                <div className="radar-pillar-header">
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                      — {p.description}
                    </span>
                  </div>
                  <strong className="num-mono" style={{ color: p.score >= 70 ? 'var(--color-primary-light)' : p.score >= 40 ? '#fbbf24' : '#f87171' }}>
                    {p.score}/100
                  </strong>
                </div>

                <div className="radar-pillar-bar-bg">
                  <div
                    className="radar-pillar-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(5, p.score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default FinancialRadarChart;
