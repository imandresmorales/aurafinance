import React, { useState, useEffect, useId, useMemo } from 'react';
import { generateAmortizationSchedule, AMORTIZATION_SYSTEMS } from '../../services/amortizationEngine';
import './CreateLoanModal.css';

export const LOAN_TYPES = [
  { id: 'PERSONAL_LOAN', label: 'Préstamo Personal', icon: '👤' },
  { id: 'MORTGAGE', label: 'Hipoteca / Vivienda', icon: '🏠' },
  { id: 'AUTO_LOAN', label: 'Crédito Automotriz', icon: '🚗' },
  { id: 'CREDIT_CARD', label: 'Tarjeta / Consolidación', icon: '💳' },
  { id: 'STUDENT_LOAN', label: 'Préstamo Estudiantil', icon: '🎓' },
  { id: 'OTHER', label: 'Otro Crédito', icon: '📄' }
];

export function CreateLoanModal({
  isOpen = false,
  onClose,
  onSave,
  initialData = null
}) {
  const titleId = useId();

  const [name, setName] = useState('');
  const [type, setType] = useState('PERSONAL_LOAN');
  const [principal, setPrincipal] = useState(10000);
  const [annualRate, setAnnualRate] = useState(12.0); // Porcentaje (ej: 12 = 12%)
  const [termValue, setTermValue] = useState(36);
  const [termUnit, setTermUnit] = useState('MONTHS'); // 'MONTHS' | 'YEARS'
  const [system, setSystem] = useState('FRENCH');
  const [monthlyInsurance, setMonthlyInsurance] = useState(0);
  const [originationFeePct, setOriginationFeePct] = useState(0);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'PERSONAL_LOAN');
      setPrincipal(initialData.principal || initialData.principalBalance || 10000);
      setAnnualRate(initialData.annualRate ? initialData.annualRate * (initialData.annualRate < 1 ? 100 : 1) : 12);
      setTermValue(initialData.termMonths || 36);
      setTermUnit('MONTHS');
      setSystem(initialData.system || 'FRENCH');
      setMonthlyInsurance(initialData.monthlyInsurance || 0);
      setOriginationFeePct(initialData.originationFeePct || 0);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setType('PERSONAL_LOAN');
      setPrincipal(10000);
      setAnnualRate(12.0);
      setTermValue(36);
      setTermUnit('MONTHS');
      setSystem('FRENCH');
      setMonthlyInsurance(0);
      setOriginationFeePct(0);
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cálculo en tiempo real de amortización y cuota
  const calculation = useMemo(() => {
    const p = Math.max(0, Number(principal) || 0);
    const rPct = Math.max(0, Number(annualRate) || 0);
    const rDecimal = rPct / 100;
    const months = termUnit === 'YEARS'
      ? Math.max(1, Math.round((Number(termValue) || 1) * 12))
      : Math.max(1, Math.round(Number(termValue) || 1));
    const insurance = Math.max(0, Number(monthlyInsurance) || 0);
    const origPct = Math.max(0, Number(originationFeePct) || 0);

    if (p <= 0) {
      return {
        estimatedMonthlyPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        totalInsurance: 0,
        originationFeeAmount: 0,
        effectiveTotalMonthly: 0
      };
    }

    const scheduleData = generateAmortizationSchedule({
      principal: p,
      annualRate: rDecimal,
      termMonths: months,
      system
    });

    const baseMonthlyPayment = scheduleData.firstPaymentAmount || 0;
    const totalInsurance = insurance * months;
    const originationFeeAmount = p * (origPct / 100);
    const totalCost = scheduleData.totalPaid + totalInsurance + originationFeeAmount;
    const effectiveTotalMonthly = baseMonthlyPayment + insurance;

    return {
      estimatedMonthlyPayment: baseMonthlyPayment,
      totalInterest: scheduleData.totalInterestPaid,
      totalCost,
      totalInsurance,
      originationFeeAmount,
      effectiveTotalMonthly,
      months,
      systemInfo: AMORTIZATION_SYSTEMS[system] || AMORTIZATION_SYSTEMS.FRENCH
    };
  }, [principal, annualRate, termValue, termUnit, system, monthlyInsurance, originationFeePct]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre o entidad del préstamo es requerido.';
    }
    if (Number(principal) <= 0) {
      newErrors.principal = 'El monto del capital debe ser mayor a 0.';
    }
    if (Number(annualRate) < 0) {
      newErrors.annualRate = 'La tasa de interés anual no puede ser negativa.';
    }
    if (Number(termValue) <= 0) {
      newErrors.termValue = 'El plazo debe ser mayor a 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const months = termUnit === 'YEARS'
      ? Math.round(Number(termValue) * 12)
      : Math.round(Number(termValue));

    const loanPayload = {
      id: initialData?.id || `loan_${Date.now()}`,
      name: name.trim(),
      type,
      principal: Number(principal),
      principalBalance: Number(principal),
      annualRate: Number(annualRate) / 100,
      annualRatePct: Number(annualRate),
      termMonths: months,
      system,
      monthlyPayment: Number(calculation.estimatedMonthlyPayment.toFixed(2)),
      monthlyInsurance: Number(monthlyInsurance) || 0,
      originationFeePct: Number(originationFeePct) || 0,
      totalInterestExpected: Number(calculation.totalInterest.toFixed(2)),
      totalCostExpected: Number(calculation.totalCost.toFixed(2)),
      notes: notes.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    onSave?.(loanPayload);
    onClose?.();
  };

  return (
    <div className="create-loan-backdrop" onClick={onClose} role="presentation">
      <div
        className="create-loan-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="create-loan-header">
          <div className="create-loan-header-title">
            <span className="create-loan-badge">Crédito & Amortización</span>
            <h2 id={titleId}>{initialData ? 'Editar Préstamo' : 'Nuevo Préstamo o Deuda'}</h2>
          </div>
          <button
            type="button"
            className="create-loan-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-loan-form">
          <div className="create-loan-body">
            {/* Columna Izquierda: Entradas de datos */}
            <div className="create-loan-inputs-col">
              <div className="create-loan-field">
                <label htmlFor="loan-name">Nombre / Entidad del Préstamo *</label>
                <input
                  id="loan-name"
                  type="text"
                  placeholder="Ej: Hipoteca Santander, Crédito Vehículo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="field-error-msg">{errors.name}</span>}
              </div>

              <div className="create-loan-row">
                <div className="create-loan-field">
                  <label htmlFor="loan-type">Tipo de Financiamiento</label>
                  <select
                    id="loan-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {LOAN_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="create-loan-field">
                  <label htmlFor="loan-system">Sistema de Amortización</label>
                  <select
                    id="loan-system"
                    value={system}
                    onChange={(e) => setSystem(e.target.value)}
                  >
                    <option value="FRENCH">Francés (Cuota Fija Mensual)</option>
                    <option value="GERMAN">Alemán (Capital Fijo Decreciente)</option>
                    <option value="AMERICAN">Americano (Solo Intereses / Balloon)</option>
                  </select>
                </div>
              </div>

              <div className="create-loan-row">
                <div className="create-loan-field">
                  <label htmlFor="loan-principal">Capital Solicitado ($) *</label>
                  <input
                    id="loan-principal"
                    type="number"
                    min="1"
                    step="100"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    className={errors.principal ? 'input-error' : ''}
                  />
                  {errors.principal && <span className="field-error-msg">{errors.principal}</span>}
                </div>

                <div className="create-loan-field">
                  <label htmlFor="loan-rate">Tasa Anual (APR %) *</label>
                  <input
                    id="loan-rate"
                    type="number"
                    min="0"
                    step="0.05"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className={errors.annualRate ? 'input-error' : ''}
                  />
                  {errors.annualRate && <span className="field-error-msg">{errors.annualRate}</span>}
                </div>
              </div>

              <div className="create-loan-row">
                <div className="create-loan-field">
                  <label htmlFor="loan-term">Plazo de Pago *</label>
                  <div className="create-loan-term-group">
                    <input
                      id="loan-term"
                      type="number"
                      min="1"
                      value={termValue}
                      onChange={(e) => setTermValue(e.target.value)}
                      className={errors.termValue ? 'input-error' : ''}
                    />
                    <select
                      value={termUnit}
                      onChange={(e) => setTermUnit(e.target.value)}
                      aria-label="Unidad de plazo"
                    >
                      <option value="MONTHS">Meses</option>
                      <option value="YEARS">Años</option>
                    </select>
                  </div>
                  {errors.termValue && <span className="field-error-msg">{errors.termValue}</span>}
                </div>

                <div className="create-loan-field">
                  <label htmlFor="loan-insurance">Seguro Mensual ($)</label>
                  <input
                    id="loan-insurance"
                    type="number"
                    min="0"
                    step="1"
                    value={monthlyInsurance}
                    onChange={(e) => setMonthlyInsurance(e.target.value)}
                  />
                </div>
              </div>

              <div className="create-loan-field">
                <label htmlFor="loan-notes">Notas o Referencia (Opcional)</label>
                <textarea
                  id="loan-notes"
                  rows={2}
                  placeholder="Detalles sobre seguro de desgravamen, cláusulas de prepago..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Columna Derecha: Tarjeta de Cálculo Dinámico en Tiempo Real */}
            <div className="create-loan-preview-col">
              <div className="create-loan-calc-card">
                <div className="calc-card-header">
                  <span className="calc-card-tag">Cálculo Instantáneo</span>
                  <h4>Cuota Periódica Estimada</h4>
                </div>

                <div className="calc-card-main-metric">
                  <span className="currency-symbol">$</span>
                  <span className="monthly-amount">
                    {calculation.effectiveTotalMonthly.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  <span className="payment-freq">/ mes</span>
                </div>

                <div className="calc-card-breakdown">
                  <div className="calc-breakdown-row">
                    <span>Cuota Base (Capital + Interés):</span>
                    <strong>${calculation.estimatedMonthlyPayment.toFixed(2)}</strong>
                  </div>
                  {Number(monthlyInsurance) > 0 && (
                    <div className="calc-breakdown-row">
                      <span>Seguro Mensual Adicional:</span>
                      <strong>+${Number(monthlyInsurance).toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="calc-breakdown-row">
                    <span>Intereses Totales a Pagar:</span>
                    <strong className="text-warning">${calculation.totalInterest.toFixed(2)}</strong>
                  </div>
                  <div className="calc-breakdown-row highlight">
                    <span>Costo Financiero Total:</span>
                    <strong className="text-emerald">${calculation.totalCost.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="calc-card-system-note">
                  <p>
                    <strong>{calculation.systemInfo?.name}:</strong>{' '}
                    {calculation.systemInfo?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="create-loan-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-emerald">
              {initialData ? 'Guardar Cambios' : 'Registrar Préstamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
