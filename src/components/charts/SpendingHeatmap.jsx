import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { buildSpendingHeatmap, TIME_SLOTS } from '../../services/spendingHeatmapEngine';
import './SpendingHeatmap.css';

export function SpendingHeatmap() {
  const { transactions } = useAccounts();
  const [hoveredCell, setHoveredCell] = useState(null);

  const heatmap = useMemo(() => {
    return buildSpendingHeatmap(transactions);
  }, [transactions]);

  // Interpolates green-to-gold heat color based on intensity (0..1)
  const getCellBackground = (cell) => {
    if (cell.totalAmount === 0) {
      return 'rgba(255, 255, 255, 0.02)';
    }
    const alpha = 0.2 + cell.intensity * 0.75;
    if (cell.intensity > 0.8) {
      return `rgba(226, 194, 117, ${alpha})`; // Gold highlight for peaks
    }
    return `rgba(16, 185, 129, ${alpha})`; // Emerald gradient
  };

  return (
    <div className="heatmap-card-container" id="spending-heatmap-section">
      <div className="heatmap-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Hábitos & Horarios de Consumo</span>
          </div>
          <h2 className="heatmap-title">
            <span>🔥 Mapa de Calor de Gastos (Día vs Franja Horaria)</span>
          </h2>
        </div>

        <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Gastos Mapeados: <strong style={{ color: 'var(--color-primary-light)' }}>{heatmap.totalExpensesCount}</strong>
        </div>
      </div>

      <div className="heatmap-grid-table">
        <table className="heatmap-table" aria-label="Mapa de calor de consumo por día y horario">
          <thead>
            <tr>
              <th className="day-header" scope="col">Día</th>
              {TIME_SLOTS.map((slot) => (
                <th key={slot.id} scope="col">
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.matrix.map((row, dayIdx) => (
              <tr key={dayIdx}>
                <th className="day-header" scope="row">
                  {row[0].dayName}
                </th>
                {row.map((cell, slotIdx) => (
                  <td
                    key={slotIdx}
                    className="heatmap-cell num-mono"
                    style={{
                      backgroundColor: getCellBackground(cell),
                      color: cell.totalAmount > 0 ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    }}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    aria-label={`${cell.dayName} ${cell.slotName}: ${formatCurrency(cell.totalAmount)} (${cell.count} compras)`}
                  >
                    {cell.totalAmount > 0 ? formatCurrency(cell.totalAmount, false) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend Scale */}
      <div className="heatmap-legend-scale">
        <span>Menor Gasto</span>
        <div className="heatmap-scale-bar" />
        <span>Pico de Gasto</span>
      </div>

      {/* Behavioral Insight Box */}
      <div className="heatmap-insight-banner">
        <span style={{ fontSize: '1.2rem' }}>💡</span>
        <div>
          <strong>Diagnóstico de Hábitos:</strong> {heatmap.insight}
        </div>
      </div>
    </div>
  );
}
export default SpendingHeatmap;
