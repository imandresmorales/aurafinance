import React, { useState, useEffect, useId, useRef } from 'react';
import {
  GOAL_CATEGORIES,
  GOAL_PRIORITIES,
  evaluateGoalProgress,
} from '../../services/savingsGoalsEngine';
import './GoalConfigModal.css';

/**
 * GoalConfigModal Component
 * Modal dialog for configuring or editing savings goals with priority selectors,
 * real-time circular SVG progress visualizer, and instant completion forecast.
 */
export default function GoalConfigModal({
  isOpen = false,
  goalToEdit = null,
  onSave = () => {},
  onClose = () => {},
}) {
  const modalRef = useRef(null);
  const titleId = useId();

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: 5000,
    currentAmount: 1000,
    monthlyContribution: 250,
    targetDate: '2027-12-31',
    category: 'EMERGENCY',
    priority: 'HIGH',
    annualReturnRate: 0.05,
    notes: '',
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (goalToEdit) {
      setFormData({
        name: goalToEdit.name || '',
        targetAmount: goalToEdit.targetAmount || 1000,
        currentAmount: goalToEdit.currentAmount || 0,
        monthlyContribution: goalToEdit.monthlyContribution || 100,
        targetDate: goalToEdit.targetDate || '',
        category: goalToEdit.category || 'EMERGENCY',
        priority: goalToEdit.priority || 'HIGH',
        annualReturnRate: goalToEdit.annualReturnRate || 0.05,
        notes: goalToEdit.notes || '',
      });
    } else {
      setFormData({
        name: '',
        targetAmount: 5000,
        currentAmount: 1000,
        monthlyContribution: 250,
        targetDate: '2027-12-31',
        category: 'EMERGENCY',
        priority: 'HIGH',
        annualReturnRate: 0.05,
        notes: '',
      });
    }
    setValidationError('');
  }, [goalToEdit, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time goal progress evaluation
  const simulatedGoal = {
    ...formData,
    id: goalToEdit ? goalToEdit.id : 'preview-goal',
  };
  const evaluation = evaluateGoalProgress(simulatedGoal);

  const percentage = Math.min(100, Math.max(0, evaluation.percentage || 0));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('Por favor ingresa un nombre para la meta.');
      return;
    }
    if (Number(formData.targetAmount) <= 0) {
      setValidationError('El monto objetivo debe ser mayor a 0.');
      return;
    }

    onSave({
      ...(goalToEdit || {}),
      name: formData.name.trim(),
      targetAmount: Number(formData.targetAmount),
      currentAmount: Math.max(0, Number(formData.currentAmount) || 0),
      monthlyContribution: Math.max(0, Number(formData.monthlyContribution) || 0),
      targetDate: formData.targetDate || null,
      category: formData.category,
      priority: formData.priority,
      annualReturnRate: Number(formData.annualReturnRate) || 0,
      notes: formData.notes.trim(),
    });
  };

  return (
    <div
      className="goal-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={modalRef}
      data-testid="goal-config-modal"
    >
      <div className="goal-modal-backdrop" onClick={onClose} />

      <div className="goal-modal-container">
        <div className="goal-modal-header">
          <div className="goal-modal-title-group">
            <span className="goal-modal-icon">🎯</span>
            <div>
              <h2 id={titleId} className="goal-modal-title">
                {goalToEdit ? 'Editar Meta de Ahorro' : 'Crear Nueva Meta de Ahorro'}
              </h2>
              <p className="goal-modal-subtitle">
                Define tu objetivo patrimonial con proyecciones y asignación de prioridad
              </p>
            </div>
          </div>
          <button
            type="button"
            className="goal-modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-modal-form">
          <div className="goal-modal-body-grid">
            {/* Left Column: Form Fields */}
            <div className="goal-form-left-col">
              {validationError && (
                <div className="goal-form-error" role="alert">
                  ⚠️ {validationError}
                </div>
              )}

              <div className="goal-form-group">
                <label htmlFor="goal-name-input" className="goal-form-label">
                  Nombre de la Meta *
                </label>
                <input
                  id="goal-name-input"
                  type="text"
                  className="goal-form-input"
                  placeholder="Ej: Fondo de Emergencia 6 Meses, Auto Nuevo..."
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="goal-form-row-2">
                <div className="goal-form-group">
                  <label htmlFor="goal-target-amount" className="goal-form-label">
                    Monto Objetivo ($) *
                  </label>
                  <input
                    id="goal-target-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    className="goal-form-input"
                    value={formData.targetAmount}
                    onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                    required
                  />
                </div>

                <div className="goal-form-group">
                  <label htmlFor="goal-current-amount" className="goal-form-label">
                    Monto Actual Ahorrado ($)
                  </label>
                  <input
                    id="goal-current-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="goal-form-input"
                    value={formData.currentAmount}
                    onChange={(e) => handleInputChange('currentAmount', e.target.value)}
                  />
                </div>
              </div>

              <div className="goal-form-row-2">
                <div className="goal-form-group">
                  <label htmlFor="goal-monthly-contribution" className="goal-form-label">
                    Aporte Mensual Previsto ($)
                  </label>
                  <input
                    id="goal-monthly-contribution"
                    type="number"
                    min="0"
                    step="0.01"
                    className="goal-form-input"
                    value={formData.monthlyContribution}
                    onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
                  />
                </div>

                <div className="goal-form-group">
                  <label htmlFor="goal-target-date" className="goal-form-label">
                    Fecha Límite Objetivo
                  </label>
                  <input
                    id="goal-target-date"
                    type="date"
                    className="goal-form-input"
                    value={formData.targetDate}
                    onChange={(e) => handleInputChange('targetDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Priority Selector */}
              <div className="goal-form-group">
                <label className="goal-form-label">Nivel de Prioridad</label>
                <div className="goal-priority-options">
                  {Object.values(GOAL_PRIORITIES).map((p) => {
                    const isSelected = formData.priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`goal-priority-btn ${isSelected ? 'selected' : ''}`}
                        style={{
                          borderColor: isSelected ? p.color : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#ffffff' : '#94a3b8',
                          background: isSelected ? `${p.color}25` : 'rgba(15, 23, 42, 0.4)',
                        }}
                        onClick={() => handleInputChange('priority', p.id)}
                      >
                        <span className="priority-dot" style={{ backgroundColor: p.color }} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Selector */}
              <div className="goal-form-group">
                <label htmlFor="goal-category-select" className="goal-form-label">
                  Categoría de Meta
                </label>
                <select
                  id="goal-category-select"
                  className="goal-form-select"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {Object.values(GOAL_CATEGORIES).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column: Live Circular Progress & Forecast Preview */}
            <div className="goal-form-right-col">
              <div className="goal-preview-card">
                <span className="goal-preview-badge">Previsualización en Vivo</span>

                <div className="goal-circular-progress-wrap">
                  <svg className="goal-circular-svg" viewBox="0 0 100 100">
                    <circle
                      className="goal-circle-bg"
                      cx="50"
                      cy="50"
                      r={radius}
                    />
                    <circle
                      className="goal-circle-progress"
                      cx="50"
                      cy="50"
                      r={radius}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{
                        stroke: percentage >= 100 ? '#10b981' : percentage >= 50 ? '#38bdf8' : '#e2c275',
                      }}
                    />
                  </svg>
                  <div className="goal-circular-text-center">
                    <span className="goal-circular-pct">{percentage}%</span>
                    <span className="goal-circular-label">Completado</span>
                  </div>
                </div>

                <div className="goal-preview-stats">
                  <div className="goal-preview-stat-row">
                    <span className="stat-label">Faltante:</span>
                    <span className="stat-value font-mono">
                      ${Number(evaluation.remainingAmount || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="goal-preview-stat-row">
                    <span className="stat-label">Fecha Proyectada:</span>
                    <span className="stat-value font-mono">
                      {evaluation.projectedCompletionDate || 'Sin proyección'}
                    </span>
                  </div>

                  {evaluation.requiredMonthlySavings > 0 && (
                    <div className="goal-preview-stat-row">
                      <span className="stat-label">Cuota sugerida:</span>
                      <span className="stat-value font-mono">
                        ${Number(evaluation.requiredMonthlySavings).toFixed(2)}/mes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="goal-modal-footer">
            <button
              type="button"
              className="goal-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="goal-btn-submit"
            >
              {goalToEdit ? 'Guardar Cambios' : 'Crear Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
