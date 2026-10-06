import React, { useState, useMemo, useEffect } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import { generateNextCivilOccurrences, formatCivilDate } from '../../services/timezoneSafeScheduler';
import './CreateRecurringModal.css';

export function CreateRecurringModal({ isOpen, onClose, onSave, initialData = null }) {
  const { wallets = [], baseCurrency = 'USD' } = useAccounts();
  const { addToast } = useToast();

  const [type, setType] = useState(initialData?.type || 'expense');
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [category, setCategory] = useState(initialData?.category || 'Servicios & Hogar');
  const [frequency, setFrequency] = useState(initialData?.frequency || 'monthly');
  const [nextDate, setNextDate] = useState(
    initialData?.nextDueDate || initialData?.nextRenewal || formatCivilDate(new Date())
  );
  const [walletId, setWalletId] = useState(initialData?.walletId || wallets[0]?.id || '');
  
  // Advanced parameters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pinEndOfMonth, setPinEndOfMonth] = useState(Boolean(initialData?.pinEndOfMonth));
  const [gracePeriodDays, setGracePeriodDays] = useState(initialData?.gracePeriodDays ?? 3);
  const [autoSettle, setAutoSettle] = useState(initialData?.autoSettle ?? false);
  const [isInflationIndexed, setIsInflationIndexed] = useState(Boolean(initialData?.isInflationIndexed));
  const [annualInflationRate, setAnnualInflationRate] = useState(initialData?.annualInflationRate ?? 3.5);
  const [noticePeriodDays, setNoticePeriodDays] = useState(initialData?.noticePeriodDays ?? 15);

  const [errors, setErrors] = useState({});

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live upcoming occurrences preview
  const upcomingOccurrences = useMemo(() => {
    if (!nextDate) return [];
    try {
      return generateNextCivilOccurrences(
        { frequency, pinEndOfMonth },
        nextDate,
        3,
        nextDate
      );
    } catch {
      return [];
    }
  }, [frequency, pinEndOfMonth, nextDate]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'El nombre o descripción es obligatorio';
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) errs.amount = 'Ingresa un monto mayor a 0';
    if (!nextDate) errs.nextDate = 'Selecciona la fecha de inicio / vencimiento';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newRule = {
      id: initialData?.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      type, // 'income' | 'expense'
      amount: parseFloat(amount),
      category,
      frequency,
      nextDueDate: nextDate,
      nextRenewal: nextDate,
      dueDate: nextDate,
      walletId: walletId || wallets[0]?.id || 'wallet-default',
      pinEndOfMonth,
      gracePeriodDays: Number(gracePeriodDays),
      autoSettle: Boolean(autoSettle),
      isInflationIndexed: Boolean(isInflationIndexed),
      annualInflationRate: isInflationIndexed ? Number(annualInflationRate) / 100 : 0,
      noticePeriodDays: Number(noticePeriodDays),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (onSave) {
      onSave(newRule);
    }
    if (addToast) {
      addToast(`Recurrencia "${newRule.name}" configurada exitosamente`, 'success');
    }
    onClose();
  };

  const categoriesExpense = [
    'Servicios & Hogar',
    'Vivienda & Alquiler',
    'Streaming & Ocio',
    'Software & Cloud',
    'Salud & Seguros',
    'Educación',
    'Transporte & Vehículo',
    'Otros Gastos',
  ];

  const categoriesIncome = [
    'Nómina / Salario',
    'Freelance / Clientes',
    'Alquileres Recibidos',
    'Dividendos & Rendimientos',
    'Otros Ingresos',
  ];

  return (
    <div className="recurring-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="recurring-modal-container glass-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-modal-title"
        data-testid="create-recurring-modal"
      >
        <div className="recurring-modal-header">
          <div className="recurring-header-left">
            <span className="recurring-header-icon">{type === 'income' ? '📈' : '📉'}</span>
            <div>
              <h2 id="recurring-modal-title" className="recurring-header-title">
                {initialData ? 'Editar Compromiso Recurrente' : 'Nueva Regla Recurrente'}
              </h2>
              <span className="recurring-header-sub">
                Automatiza el seguimiento y proyección de tus flujos periódicos
              </span>
            </div>
          </div>
          <button
            type="button"
            className="recurring-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="recurring-modal-form">
          {/* Type Selector Tabs */}
          <div className="recurring-type-switch" role="tablist">
            <button
              type="button"
              className={`type-tab-btn ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => {
                setType('expense');
                if (!categoriesExpense.includes(category)) setCategory(categoriesExpense[0]);
              }}
              role="tab"
              aria-selected={type === 'expense'}
            >
              💸 Gasto / Factura Periódica
            </button>
            <button
              type="button"
              className={`type-tab-btn ${type === 'income' ? 'active income' : ''}`}
              onClick={() => {
                setType('income');
                if (!categoriesIncome.includes(category)) setCategory(categoriesIncome[0]);
              }}
              role="tab"
              aria-selected={type === 'income'}
            >
              💰 Ingreso / Cobro Recurrente
            </button>
          </div>

          <div className="recurring-form-grid">
            {/* Name */}
            <div className="form-group span-2">
              <label htmlFor="rec-name" className="form-label">
                Nombre o Proveedor <span className="req">*</span>
              </label>
              <input
                id="rec-name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Ej. AWS Cloud, Alquiler Oficina, Salario Nómina"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Amount */}
            <div className="form-group">
              <label htmlFor="rec-amount" className="form-label">
                Monto ({baseCurrency}) <span className="req">*</span>
              </label>
              <input
                id="rec-amount"
                type="number"
                step="0.01"
                min="0"
                className={`form-input ${errors.amount ? 'error' : ''}`}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>

            {/* Frequency */}
            <div className="form-group">
              <label htmlFor="rec-frequency" className="form-label">
                Frecuencia
              </label>
              <select
                id="rec-frequency"
                className="form-select"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="weekly">Semanal (cada 7 días)</option>
                <option value="biweekly">Quincenal (cada 14 días)</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral (cada 3 meses)</option>
                <option value="annual">Anual</option>
              </select>
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="rec-category" className="form-label">
                Categoría
              </label>
              <select
                id="rec-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {(type === 'income' ? categoriesIncome : categoriesExpense).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Date */}
            <div className="form-group">
              <label htmlFor="rec-next-date" className="form-label">
                Próxima Fecha de Vencimiento / Cobro <span className="req">*</span>
              </label>
              <input
                id="rec-next-date"
                type="date"
                className={`form-input ${errors.nextDate ? 'error' : ''}`}
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
              {errors.nextDate && <span className="form-error">{errors.nextDate}</span>}
            </div>

            {/* Linked Wallet */}
            {wallets.length > 0 && (
              <div className="form-group span-2">
                <label htmlFor="rec-wallet" className="form-label">
                  Billetera / Cuenta Asignada
                </label>
                <select
                  id="rec-wallet"
                  className="form-select"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance, baseCurrency)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Advanced Options Accordion */}
          <div className="advanced-accordion">
            <button
              type="button"
              className="advanced-toggle-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
            >
              <span>⚙️ Opciones y Reglas Avanzadas de Proyección</span>
              <span className="accordion-chevron">{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {showAdvanced && (
              <div className="advanced-content-grid">
                <div className="advanced-check-row">
                  <input
                    type="checkbox"
                    id="rec-pin-end"
                    checked={pinEndOfMonth}
                    onChange={(e) => setPinEndOfMonth(e.target.checked)}
                    style={{ accentColor: '#10b981' }}
                  />
                  <label htmlFor="rec-pin-end">
                    <strong>Ajustar a último día de mes:</strong> Si vence el 31, pasar automáticamente al 28/29 en febrero y 30 en meses de 30 días.
                  </label>
                </div>

                <div className="advanced-check-row">
                  <input
                    type="checkbox"
                    id="rec-auto-settle"
                    checked={autoSettle}
                    onChange={(e) => setAutoSettle(e.target.checked)}
                    style={{ accentColor: '#10b981' }}
                  />
                  <label htmlFor="rec-auto-settle">
                    <strong>Liquidación Automática Simulada:</strong> Generar asiento contable y descontar saldo automáticamente en la fecha de vencimiento.
                  </label>
                </div>

                <div className="advanced-check-row">
                  <input
                    type="checkbox"
                    id="rec-inflation"
                    checked={isInflationIndexed}
                    onChange={(e) => setIsInflationIndexed(e.target.checked)}
                    style={{ accentColor: '#10b981' }}
                  />
                  <label htmlFor="rec-inflation">
                    <strong>Monto Indexado a Inflación:</strong> Ajustar proyecciones anuales con tasa inflacionaria estimada.
                  </label>
                </div>

                {isInflationIndexed && (
                  <div className="form-group" style={{ marginLeft: '1.5rem' }}>
                    <label htmlFor="rec-inflation-rate" className="form-label">
                      Tasa de Inflación Anual Estimada (%)
                    </label>
                    <input
                      id="rec-inflation-rate"
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={annualInflationRate}
                      onChange={(e) => setAnnualInflationRate(e.target.value)}
                    />
                  </div>
                )}

                <div className="advanced-two-col">
                  <div className="form-group">
                    <label htmlFor="rec-grace-days" className="form-label">
                      Días de Gracia (Tolerancia antes de mora)
                    </label>
                    <input
                      id="rec-grace-days"
                      type="number"
                      min="0"
                      max="30"
                      className="form-input"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="rec-notice-days" className="form-label">
                      Aviso de Renovación Contrato (Días previos)
                    </label>
                    <input
                      id="rec-notice-days"
                      type="number"
                      min="0"
                      max="90"
                      className="form-input"
                      value={noticePeriodDays}
                      onChange={(e) => setNoticePeriodDays(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Projected Dates Preview */}
          {upcomingOccurrences.length > 0 && (
            <div className="recurring-occurrences-preview">
              <span className="preview-label">🗓️ Próximas 3 fechas de ejecución calculadas:</span>
              <div className="preview-dates-pills">
                {upcomingOccurrences.map((dateStr, idx) => (
                  <span key={dateStr} className="preview-date-pill">
                    #{idx + 1} {dateStr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="recurring-modal-actions">
            <button
              type="button"
              className="glass-button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="glass-button primary save-btn"
            >
              ✓ {initialData ? 'Guardar Cambios' : 'Guardar Regla Recurrente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRecurringModal;
