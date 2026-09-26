import React, { useState } from 'react';
import { FINANCIAL_CATEGORIES, POPULAR_TAGS } from '../../services';
import './TransactionFilters.css';

export const DATE_PRESETS = {
  ALL: 'ALL',
  TODAY: 'TODAY',
  DAYS_7: 'DAYS_7',
  THIS_MONTH: 'THIS_MONTH',
  DAYS_90: 'DAYS_90',
  CUSTOM: 'CUSTOM',
};

export default function TransactionFilters({
  filters,
  onChange,
  onReset,
  accounts = [],
  activeFilterCount = 0,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDatePreset = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === DATE_PRESETS.ALL) {
      onChange({ ...filters, datePreset: preset, startDate: '', endDate: '' });
    } else if (preset === DATE_PRESETS.TODAY) {
      onChange({ ...filters, datePreset: preset, startDate: todayStr, endDate: todayStr });
    } else if (preset === DATE_PRESETS.DAYS_7) {
      const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      onChange({ ...filters, datePreset: preset, startDate: d7, endDate: todayStr });
    } else if (preset === DATE_PRESETS.THIS_MONTH) {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      onChange({ ...filters, datePreset: preset, startDate: firstDay, endDate: todayStr });
    } else if (preset === DATE_PRESETS.DAYS_90) {
      const d90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      onChange({ ...filters, datePreset: preset, startDate: d90, endDate: todayStr });
    } else {
      onChange({ ...filters, datePreset: DATE_PRESETS.CUSTOM });
    }
  };

  return (
    <div className="tx-filters-wrapper glass-panel">
      {/* Top Search & Filter Toggle Bar */}
      <div className="tx-filters-topbar">
        <div className="tx-search-input-wrap">
          <span className="tx-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por concepto, notas, cuenta o etiqueta..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="tx-search-input"
          />
          {filters.searchQuery && (
            <button
              type="button"
              className="tx-search-clear"
              onClick={() => onChange({ ...filters, searchQuery: '' })}
            >
              ×
            </button>
          )}
        </div>

        <div className="tx-filters-actions">
          <button
            type="button"
            className={`tx-filter-toggle-btn ${isExpanded || activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>⚙️ Filtros Avanzados</span>
            {activeFilterCount > 0 && (
              <span className="tx-filter-count-badge">{activeFilterCount}</span>
            )}
            <span className="tx-filter-arrow">{isExpanded ? '▲' : '▼'}</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              className="tx-reset-filters-btn"
              onClick={onReset}
              title="Restablecer todos los filtros"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Expanded Advanced Filters Panel */}
      {isExpanded && (
        <div className="tx-advanced-panel">
          {/* Date Presets Row */}
          <div className="tx-filter-group">
            <label className="tx-filter-label">Rango Temporal:</label>
            <div className="tx-date-presets-row">
              <button
                type="button"
                className={`tx-preset-chip ${filters.datePreset === DATE_PRESETS.ALL ? 'active' : ''}`}
                onClick={() => handleDatePreset(DATE_PRESETS.ALL)}
              >
                Todo
              </button>
              <button
                type="button"
                className={`tx-preset-chip ${filters.datePreset === DATE_PRESETS.TODAY ? 'active' : ''}`}
                onClick={() => handleDatePreset(DATE_PRESETS.TODAY)}
              >
                Hoy
              </button>
              <button
                type="button"
                className={`tx-preset-chip ${filters.datePreset === DATE_PRESETS.DAYS_7 ? 'active' : ''}`}
                onClick={() => handleDatePreset(DATE_PRESETS.DAYS_7)}
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                className={`tx-preset-chip ${filters.datePreset === DATE_PRESETS.THIS_MONTH ? 'active' : ''}`}
                onClick={() => handleDatePreset(DATE_PRESETS.THIS_MONTH)}
              >
                Este Mes
              </button>
              <button
                type="button"
                className={`tx-preset-chip ${filters.datePreset === DATE_PRESETS.DAYS_90 ? 'active' : ''}`}
                onClick={() => handleDatePreset(DATE_PRESETS.DAYS_90)}
              >
                90 días
              </button>
            </div>

            {/* Custom Dates */}
            <div className="tx-custom-dates-row">
              <div className="tx-date-field">
                <span className="tx-date-label">Desde:</span>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      startDate: e.target.value,
                      datePreset: DATE_PRESETS.CUSTOM,
                    })
                  }
                  className="tx-filter-select"
                />
              </div>
              <div className="tx-date-field">
                <span className="tx-date-label">Hasta:</span>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      endDate: e.target.value,
                      datePreset: DATE_PRESETS.CUSTOM,
                    })
                  }
                  className="tx-filter-select"
                />
              </div>
            </div>
          </div>

          {/* Grid of Multi-Criteria Selectors */}
          <div className="tx-filter-grid">
            {/* Account Filter */}
            <div className="tx-filter-field">
              <label className="tx-filter-label" htmlFor="filter-acc">Cuenta:</label>
              <select
                id="filter-acc"
                value={filters.accountId || ''}
                onChange={(e) => onChange({ ...filters, accountId: e.target.value })}
                className="tx-filter-select"
              >
                <option value="">Todas las Cuentas</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="tx-filter-field">
              <label className="tx-filter-label" htmlFor="filter-cat">Categoría:</label>
              <select
                id="filter-cat"
                value={filters.category || ''}
                onChange={(e) => onChange({ ...filters, category: e.target.value })}
                className="tx-filter-select"
              >
                <option value="">Todas las Categorías</option>
                {FINANCIAL_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="tx-filter-field">
              <label className="tx-filter-label" htmlFor="filter-tag">Etiqueta (#Tag):</label>
              <select
                id="filter-tag"
                value={filters.tag || ''}
                onChange={(e) => onChange({ ...filters, tag: e.target.value })}
                className="tx-filter-select"
              >
                <option value="">Cualquier Etiqueta</option>
                {POPULAR_TAGS.map((tg) => (
                  <option key={tg} value={tg}>
                    {tg}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Min / Max */}
            <div className="tx-filter-field">
              <label className="tx-filter-label">Rango de Monto ($):</label>
              <div className="tx-amount-range-row">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.minAmount || ''}
                  onChange={(e) => onChange({ ...filters, minAmount: e.target.value })}
                  className="tx-filter-select num-mono"
                  min="0"
                  step="any"
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.maxAmount || ''}
                  onChange={(e) => onChange({ ...filters, maxAmount: e.target.value })}
                  className="tx-filter-select num-mono"
                  min="0"
                  step="any"
                />
              </div>
            </div>
          </div>

          {/* Toggle Switches (Receipt & Location) */}
          <div className="tx-filter-toggles-row">
            <label className="tx-checkbox-toggle">
              <input
                type="checkbox"
                checked={!!filters.onlyWithReceipt}
                onChange={(e) => onChange({ ...filters, onlyWithReceipt: e.target.checked })}
              />
              <span>🧾 Solo con comprobante adjunto</span>
            </label>

            <label className="tx-checkbox-toggle">
              <input
                type="checkbox"
                checked={!!filters.onlyWithLocation}
                onChange={(e) => onChange({ ...filters, onlyWithLocation: e.target.checked })}
              />
              <span>📍 Solo con geolocalización</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
