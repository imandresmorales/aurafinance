import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateDonutSlices } from '../../services/svgChartEngine';
import './CategoryDonutChart.css';

const DEFAULT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#e11d48'
];

export function CategoryDonutChart() {
  const { transactions, categories } = useAccounts();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Group current month expenses by category
  const categoryData = useMemo(() => {
    const expenses = (transactions || []).filter((tx) => {
      if (!tx || tx.deleted || tx.isDeleted) return false;
      if ((tx.type || '').toUpperCase() !== 'EXPENSE') return false;
      return tx.date && String(tx.date).startsWith(currentMonth);
    });

    const categoryMap = {};
    expenses.forEach((tx) => {
      const cat = (tx.category || tx.categoryName || 'Otros').trim();
      const amt = Math.abs(Number(tx.amount)) || 0;
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    });

    const items = Object.entries(categoryMap).map(([label, value], idx) => {
      const catObj = (categories || []).find(
        (c) => (c.name || '').toLowerCase() === label.toLowerCase()
      );
      return {
        label,
        value,
        color: catObj?.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        icon: catObj?.icon || '📁',
      };
    });

    // Sort by value descending
    return items.sort((a, b) => b.value - a.value);
  }, [transactions, categories, currentMonth]);

  const totalSpent = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.value, 0);
  }, [categoryData]);

  // Compute Donut SVG Slices
  const slices = useMemo(() => {
    return calculateDonutSlices(categoryData, 150, 150, 75, 125, 0.03);
  }, [categoryData]);

  const activeItem = hoveredSlice || selectedCategory || null;

  return (
    <div className="donut-chart-card" id="category-donut-section">
      <div className="donut-chart-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Distribución de Gastos Mensual</span>
          </div>
          <h2 className="donut-chart-title">
            <span>🍩 Gastos por Categoría</span>
          </h2>
        </div>

        <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Total del Mes: <strong style={{ color: 'var(--color-primary-light)' }}>{formatCurrency(totalSpent)}</strong>
        </div>
      </div>

      {slices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍃</div>
          <p>No hay gastos registrados en el mes actual ({currentMonth}).</p>
        </div>
      ) : (
        <div className="donut-layout-grid">
          {/* SVG Donut Chart */}
          <div className="donut-svg-container">
            <svg
              className="donut-svg"
              viewBox="0 0 300 300"
              aria-label="Gráfico de anillo de gastos por categoría"
              role="img"
            >
              <g>
                {slices.map((s) => {
                  const isHovered = activeItem && activeItem.label === s.label;
                  const isDimmed = activeItem && activeItem.label !== s.label;

                  return (
                    <path
                      key={s.label}
                      d={s.path}
                      fill={s.color}
                      className={`donut-slice ${isDimmed ? 'dimmed' : ''}`}
                      onMouseEnter={() => setHoveredSlice(s)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory?.label === s.label ? null : s
                        )
                      }
                      aria-label={`${s.label}: ${formatCurrency(s.value)} (${s.percentage}%)`}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Center Information */}
            <div className="donut-center-info">
              {activeItem ? (
                <>
                  <span style={{ fontSize: '1.2rem', marginBottom: '0.1rem' }}>{activeItem.icon || '📁'}</span>
                  <span className="donut-center-label">{activeItem.label}</span>
                  <span className="donut-center-val num-mono" style={{ color: activeItem.color || 'var(--color-primary-light)' }}>
                    {formatCurrency(activeItem.value)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {activeItem.percentage}%
                  </span>
                </>
              ) : (
                <>
                  <span className="donut-center-label">Gasto Total</span>
                  <span className="donut-center-val num-mono">{formatCurrency(totalSpent)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {slices.length} Categorías
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="donut-legend-list" role="list">
            {slices.map((s) => {
              const isActive = activeItem && activeItem.label === s.label;
              return (
                <div
                  key={s.label}
                  className={`donut-legend-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredSlice(s)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory?.label === s.label ? null : s
                    )
                  }
                  role="listitem"
                >
                  <div className="donut-legend-left">
                    <span
                      className="donut-legend-color-dot"
                      style={{ backgroundColor: s.color }}
                    />
                    <span>{s.icon} {s.label}</span>
                  </div>

                  <div className="donut-legend-right">
                    <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(s.value)}
                    </strong>
                    <span className="num-mono" style={{ color: 'var(--text-secondary)', minWidth: '45px', textAlign: 'right' }}>
                      {s.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default CategoryDonutChart;
