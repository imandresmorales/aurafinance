import React, { useState } from 'react';
import { DATE_PRESETS, getDateRangeBounds } from '../../services/dateRangeEngine';
import './DateRangeSelector.css';

export function DateRangeSelector({
  selectedPreset = '30D',
  customStart = '',
  customEnd = '',
  onChange,
}) {
  const [isCustom, setIsCustom] = useState(selectedPreset === 'CUSTOM');
  const [start, setStart] = useState(customStart);
  const [end, setEnd] = useState(customEnd);

  const handleSelectPreset = (key) => {
    if (key === 'CUSTOM') {
      setIsCustom(true);
      const bounds = getDateRangeBounds('CUSTOM', start, end);
      if (onChange) onChange(bounds);
    } else {
      setIsCustom(false);
      const bounds = getDateRangeBounds(key);
      if (onChange) onChange(bounds);
    }
  };

  const handleCustomDateChange = (newStart, newEnd) => {
    setStart(newStart);
    setEnd(newEnd);
    if (onChange) {
      const bounds = getDateRangeBounds('CUSTOM', newStart, newEnd);
      onChange(bounds);
    }
  };

  return (
    <div className="date-range-container" role="toolbar" aria-label="Selector unificado de periodos de fecha">
      {DATE_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={`date-preset-btn ${selectedPreset === p.key ? 'active' : ''}`}
          onClick={() => handleSelectPreset(p.key)}
          aria-pressed={selectedPreset === p.key}
        >
          {p.label}
        </button>
      ))}

      {isCustom && (
        <div className="custom-range-inputs">
          <input
            type="date"
            className="custom-date-input"
            value={start}
            onChange={(e) => handleCustomDateChange(e.target.value, end)}
            aria-label="Fecha de inicio personalizada"
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>➔</span>
          <input
            type="date"
            className="custom-date-input"
            value={end}
            onChange={(e) => handleCustomDateChange(start, e.target.value)}
            aria-label="Fecha de fin personalizada"
          />
        </div>
      )}
    </div>
  );
}
export default DateRangeSelector;
