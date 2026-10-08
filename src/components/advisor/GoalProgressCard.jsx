import React from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { evaluateGoalProgress, GOAL_STATUS } from '../../services/savingsGoalsEngine';
import './GoalProgressCard.css';

export function GoalProgressCard({
  goal,
  onAddFunds = null,
  onEdit = null,
  asOfDate = null,
}) {
  const { baseCurrency = 'USD' } = useAccounts();

  const evaluated = evaluateGoalProgress(goal, asOfDate || new Date());

  const {
    id,
    name,
    targetAmount,
    currentAmount,
    remainingAmount,
    percentage,
    isCompleted,
    daysRemaining,
    requiredMonthlySavings,
    projectedCompletionDate,
    status,
    categoryMeta,
    priorityMeta,
    monthlyContribution = 0,
  } = evaluated;

  const getStatusBadge = () => {
    switch (status) {
      case GOAL_STATUS.COMPLETED:
        return <span className="goal-badge completed">🎉 ¡Meta Cumplida!</span>;
      case GOAL_STATUS.ON_TRACK:
        return (
          <span className="goal-badge on-track">
            ✅ En Plazo (Fin: {projectedCompletionDate})
          </span>
        );
      case GOAL_STATUS.BEHIND:
        return (
          <span className="goal-badge behind">
            ⚠️ Ritmo Bajo (Req: {formatCurrency(requiredMonthlySavings, baseCurrency)}/mes)
          </span>
        );
      case GOAL_STATUS.STALLED:
      default:
        return <span className="goal-badge stalled">⏸️ Sin Aporte Activo</span>;
    }
  };

  return (
    <div
      className={`goal-progress-card glass-card ${isCompleted ? 'is-completed' : ''}`}
      data-testid={`goal-card-${id}`}
    >
      <div className="goal-card-header">
        <div className="goal-title-group">
          <span className="goal-category-icon" style={{ borderColor: categoryMeta.color }}>
            {categoryMeta.icon}
          </span>
          <div>
            <h4 className="goal-name">{name}</h4>
            <span className="goal-category-label">{categoryMeta.label}</span>
          </div>
        </div>

        <div className="goal-header-badges">
          <span className="goal-priority-pill" style={{ color: priorityMeta.color, borderColor: `${priorityMeta.color}40`, background: `${priorityMeta.color}15` }}>
            Prioridad {priorityMeta.label}
          </span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="goal-progress-section">
        <div className="goal-progress-bar-track">
          <div
            className="goal-progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Progreso de ${name}`}
          />
        </div>

        <div className="goal-progress-numbers">
          <span className="goal-current-saved">
            {formatCurrency(currentAmount, baseCurrency)}
            <span className="goal-target-sub"> de {formatCurrency(targetAmount, baseCurrency)}</span>
          </span>
          <span className="goal-percentage text-gradient-emerald">{percentage}%</span>
        </div>
      </div>

      {/* Analytics Meta Grid */}
      <div className="goal-meta-grid">
        <div className="goal-meta-item">
          <span className="meta-item-label">Aporte Mensual Actual</span>
          <span className="meta-item-val font-mono">
            {formatCurrency(monthlyContribution, baseCurrency)}/mes
          </span>
        </div>

        <div className="goal-meta-item">
          <span className="meta-item-label">Faltante por Ahorrar</span>
          <span className="meta-item-val font-mono">
            {formatCurrency(remainingAmount, baseCurrency)}
          </span>
        </div>

        <div className="goal-meta-item">
          <span className="meta-item-label">Fecha Límite Objetivo</span>
          <span className="meta-item-val">
            {goal.targetDate ? goal.targetDate : 'Sin fecha límite'}
          </span>
        </div>

        <div className="goal-meta-item">
          <span className="meta-item-label">Fecha Proyectada Exacta</span>
          <span className="meta-item-val highlight-date">
            {projectedCompletionDate ? projectedCompletionDate : 'Indefinida'}
          </span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="goal-card-actions">
        {onEdit && (
          <button
            type="button"
            className="glass-button"
            onClick={() => onEdit(goal)}
            aria-label={`Editar meta ${name}`}
          >
            ✏️ Editar
          </button>
        )}

        {onAddFunds && !isCompleted && (
          <button
            type="button"
            className="glass-button primary add-funds-btn"
            onClick={() => onAddFunds(goal)}
            aria-label={`Aportar fondos a ${name}`}
          >
            ＋ Aportar Fondos
          </button>
        )}
      </div>
    </div>
  );
}

export default GoalProgressCard;
