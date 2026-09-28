import React from 'react';
import { formatCurrency } from '../../utils';
import './EnvelopeProgressBar.css';

export default function EnvelopeProgressBar({
  spent = 0,
  allocated = 0,
  currency = 'USD',
  showMarkers = true,
}) {
  const normSpent = Number(spent) || 0;
  const normAllocated = Number(allocated) || 0;

  const percentage = normAllocated > 0 ? (normSpent / normAllocated) * 100 : 0;
  const clampedWidth = Math.min(100, Math.max(0, percentage));
  const isOverBudget = normSpent > normAllocated;

  let stateClass = 'state-normal';
  let ariaText = `${percentage.toFixed(0)}% consumido`;

  if (normAllocated === 0) {
    stateClass = 'state-empty';
    ariaText = 'Sin asignación presupuestaria';
  } else if (isOverBudget) {
    stateClass = 'state-overbudget';
    const over = normSpent - normAllocated;
    ariaText = `Presupuesto excedido por ${formatCurrency(over, currency)} (${percentage.toFixed(0)}%)`;
  } else if (percentage >= 75) {
    stateClass = 'state-warning';
    ariaText = `Alerta: ${percentage.toFixed(0)}% del presupuesto consumido`;
  }

  return (
    <div className="envelope-progress-container">
      <div
        className="envelope-progress-track"
        role="progressbar"
        aria-valuenow={Math.round(clampedWidth)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={ariaText}
      >
        <div
          className={`envelope-progress-fill ${stateClass}`}
          style={{ width: `${clampedWidth}%` }}
        />
        {showMarkers && (
          <>
            <div className="marker-75" title="Umbral de precaución: 75%" />
            <div className="marker-100" title="Límite máximo: 100%" />
          </>
        )}
      </div>

      <div className="progress-meta-row">
        <span>0%</span>
        <span style={{ color: percentage >= 75 ? 'var(--color-warning)' : 'inherit' }}>75%</span>
        <span style={{ color: isOverBudget ? 'var(--color-danger)' : 'inherit' }}>
          {isOverBudget ? `🔥 ${percentage.toFixed(0)}%` : '100%'}
        </span>
      </div>
    </div>
  );
}
