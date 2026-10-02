import React, { useState, useMemo, useRef } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateSankeyFlow } from '../../services/sankeyEngine';
import './SankeyMoneyFlow.css';

export function SankeyMoneyFlow() {
  const { accounts, budgets, transactions } = useAccounts();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const width = 800;
  const height = 340;

  const flowData = useMemo(() => {
    return calculateSankeyFlow(accounts, budgets, transactions, selectedMonth, width, height);
  }, [accounts, budgets, transactions, selectedMonth, width, height]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="sankey-card-container" id="sankey-flow-section">
      <div className="sankey-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Trayecto del Dinero & Flujos</span>
          </div>
          <h2 className="sankey-title">
            <span>🌊 Diagrama Sankey: Flujo Monetario Integral</span>
          </h2>
        </div>

        <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Ingresos: <strong style={{ color: 'var(--color-primary-light)' }}>+{formatCurrency(flowData.totalIncome)}</strong> | Gastos: <strong style={{ color: '#f87171' }}>-{formatCurrency(flowData.totalExpense)}</strong>
        </div>
      </div>

      <div className="sankey-stages-labels">
        <span>1. Fuentes de Ingreso</span>
        <span>2. Cuentas & Bóvedas</span>
        <span>3. Gastos & Ahorro</span>
      </div>

      <div
        className="sankey-svg-wrapper"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredLink(null);
          setHoveredNode(null);
        }}
      >
        <svg
          className="sankey-svg"
          viewBox={`0 0 ${width} ${height}`}
          aria-label="Diagrama Sankey de distribución de ingresos a cuentas y gastos"
          role="img"
        >
          {/* Ribbon Links */}
          <g>
            {flowData.links.map((link) => (
              <path
                key={link.id}
                d={link.path}
                fill={link.color}
                className="sankey-ribbon"
                onMouseEnter={() => setHoveredLink(link)}
                onMouseLeave={() => setHoveredLink(null)}
              />
            ))}
          </g>

          {/* Nodes */}
          <g>
            {flowData.nodes.map((node) => (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={node.color}
                  className="sankey-node-rect"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                <text
                  x={node.stage === 1 ? node.x - 8 : node.stage === 3 ? node.x + node.width + 8 : node.x + node.width / 2}
                  y={node.y + node.height / 2 + 4}
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor={node.stage === 1 ? 'end' : node.stage === 3 ? 'start' : 'middle'}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name} ({formatCurrency(node.value)})
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {(hoveredLink || hoveredNode) && (
          <div
            className="chart-tooltip"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
            }}
          >
            {hoveredNode && (
              <>
                <div style={{ fontWeight: 700, color: hoveredNode.color }}>
                  {hoveredNode.name}
                </div>
                <div className="num-mono" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Total: {formatCurrency(hoveredNode.value)}
                </div>
              </>
            )}
            {hoveredLink && !hoveredNode && (
              <>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Flujo: {hoveredLink.source} ➔ {hoveredLink.target}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default SankeyMoneyFlow;
