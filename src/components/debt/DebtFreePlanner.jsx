import React, { useState, useMemo } from 'react';
import {
  simulatePayoffStrategy,
  compareDebtPayoffStrategies
} from '../../services/debtPayoffStrategiesEngine';
import './DebtFreePlanner.css';

const DEFAULT_DEBTS = [
  { id: 'd1', name: 'Tarjeta Platinum', principalBalance: 4200, interestRate: 0.24, minimumMonthlyPayment: 130 },
  { id: 'd2', name: 'Préstamo Auto', principalBalance: 9800, interestRate: 0.085, minimumMonthlyPayment: 260 },
  { id: 'd3', name: 'Crédito Personal', principalBalance: 5500, interestRate: 0.15, minimumMonthlyPayment: 175 }
];

export function DebtFreePlanner({
  debts = DEFAULT_DEBTS,
  hourlyWage = 25,
  onPayoffAction
}) {
  const [strategy, setStrategy] = useState('AVALANCHE');
  const [extraMonthlyBudget, setExtraMonthlyBudget] = useState(150);

  // Sanitizar deudas activas
  const activeDebts = useMemo(() => {
    return (debts || [])
      .filter(d => (Number(d.principalBalance || d.balance) || 0) > 0)
      .map(d => ({
        id: d.id || `debt_${d.name}`,
        name: d.name || 'Deuda',
        principalBalance: Number(d.principalBalance || d.balance) || 0,
        interestRate: Number(d.interestRate || d.rate || d.apr) > 1
          ? (Number(d.interestRate || d.rate || d.apr) / 100)
          : (Number(d.interestRate || d.rate || d.apr) || 0.12),
        minimumMonthlyPayment: Number(d.minimumMonthlyPayment || d.minPayment || d.monthlyPayment) || 25
      }));
  }, [debts]);

  const totalCurrentBalance = useMemo(() => {
    return activeDebts.reduce((sum, d) => sum + d.principalBalance, 0);
  }, [activeDebts]);

  const totalMonthlyMinimums = useMemo(() => {
    return activeDebts.reduce((sum, d) => sum + d.minimumMonthlyPayment, 0);
  }, [activeDebts]);

  // Simulación actual con el aporte extra seleccionado
  const simulation = useMemo(() => {
    return simulatePayoffStrategy(activeDebts, strategy, extraMonthlyBudget);
  }, [activeDebts, strategy, extraMonthlyBudget]);

  // Simulación base (solo pagos mínimos, sin acelerador)
  const baselineSimulation = useMemo(() => {
    return simulatePayoffStrategy(activeDebts, 'MINIMUM_ONLY', 0);
  }, [activeDebts]);

  // Comparativa global de estrategias
  const comparison = useMemo(() => {
    return compareDebtPayoffStrategies(activeDebts, extraMonthlyBudget);
  }, [activeDebts, extraMonthlyBudget]);

  // Cálculos de ahorro y aceleración
  const monthsSaved = Math.max(0, baselineSimulation.monthsToDebtFree - simulation.monthsToDebtFree);
  const interestSaved = Math.max(0, baselineSimulation.totalInterestPaid - simulation.totalInterestPaid);
  const wage = Math.max(0, Number(hourlyWage) || 0);
  const laborHoursSaved = wage > 0 ? Math.round(interestSaved / wage) : 0;

  // Formato legible de fecha de libertad
  const formattedFreedomDate = useMemo(() => {
    if (!simulation.debtFreeDate) return 'Pronto';
    const d = new Date(simulation.debtFreeDate);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }, [simulation.debtFreeDate]);

  return (
    <div className="debt-free-planner">
      {/* Encabezado Principal & Cuenta Regresiva */}
      <div className="planner-hero-card">
        <div className="planner-hero-content">
          <div className="planner-tag-wrapper">
            <span className="planner-hero-tag">Planificador Hacia Cero Deuda</span>
            {monthsSaved > 0 && (
              <span className="planner-boost-tag">
                ⚡ ¡{monthsSaved} meses adelantados!
              </span>
            )}
          </div>

          <h2 className="planner-hero-title">Tu Día de Libertad Financiera</h2>
          <p className="planner-freedom-date">{formattedFreedomDate}</p>

          <div className="planner-countdown-pills">
            <div className="countdown-pill">
              <span className="pill-number">{simulation.monthsToDebtFree}</span>
              <span className="pill-label">Meses para Libertad Total</span>
            </div>
            <div className="countdown-pill">
              <span className="pill-number">
                ${simulation.totalInterestPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
              <span className="pill-label">Intereses Proyectados</span>
            </div>
            <div className="countdown-pill highlight">
              <span className="pill-number">
                ${interestSaved.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
              <span className="pill-label">Ahorro en Intereses Bancarios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Estrategia y Acelerador Mensual */}
      <div className="planner-controls-grid">
        <div className="planner-control-card">
          <div className="control-header">
            <h4>Estrategia de Liquidación</h4>
            <span className="control-subtitle">Optimización matemática vs psicológica</span>
          </div>

          <div className="strategy-toggle-group">
            <button
              type="button"
              className={`strategy-btn ${strategy === 'AVALANCHE' ? 'active' : ''}`}
              onClick={() => setStrategy('AVALANCHE')}
            >
              <div className="strategy-btn-header">
                <strong>🏔️ Avalancha de Intereses</strong>
                <span className="mini-badge">Recomendado</span>
              </div>
              <p>Prioriza la deuda con mayor tasa de interés (APR). Máximo ahorro financiero.</p>
            </button>

            <button
              type="button"
              className={`strategy-btn ${strategy === 'SNOWBALL' ? 'active' : ''}`}
              onClick={() => setStrategy('SNOWBALL')}
            >
              <div className="strategy-btn-header">
                <strong>❄️ Bola de Nieve</strong>
                <span className="mini-badge motivational">Motivacional</span>
              </div>
              <p>Liquida primero las deudas con menor saldo para victorias psicológicas tempranas.</p>
            </button>
          </div>
        </div>

        <div className="planner-control-card">
          <div className="control-header">
            <h4>Acelerador Mensual Extra</h4>
            <span className="control-subtitle">
              Pago adicional voluntario sobre los mínimos (${totalMonthlyMinimums.toFixed(2)}/mes)
            </span>
          </div>

          <div className="accelerator-presets">
            {[0, 50, 100, 200, 350, 500].map(val => (
              <button
                key={val}
                type="button"
                className={`preset-btn ${extraMonthlyBudget === val ? 'selected' : ''}`}
                onClick={() => setExtraMonthlyBudget(val)}
              >
                +${val}
              </button>
            ))}
          </div>

          <div className="accelerator-slider-row">
            <label htmlFor="extra-budget-slider">
              Aporte Extra Personalizado: <strong>${extraMonthlyBudget}/mes</strong>
            </label>
            <input
              id="extra-budget-slider"
              type="range"
              min="0"
              max="1000"
              step="25"
              value={extraMonthlyBudget}
              onChange={(e) => setExtraMonthlyBudget(Number(e.target.value))}
              aria-label="Aporte extra mensual para acelerar pago de deudas"
            />
          </div>

          {laborHoursSaved > 0 && (
            <div className="work-hours-callout">
              <span className="callout-icon">⏱️</span>
              <p>
                Al aportar <strong>${extraMonthlyBudget}/mes</strong> extra, rescatas{' '}
                <strong>{laborHoursSaved} horas</strong> de tu tiempo de trabajo que ya no regalarás a los intereses.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hoja de Ruta de Metas & Orden de Pago */}
      <div className="planner-milestones-card">
        <div className="milestones-header">
          <h3>Ruta de Victoria: Orden de Liquidación Consecutiva</h3>
          <span className="milestones-summary">
            Efecto bola de nieve: al liquidar cada pasivo, su cuota mínima se suma íntegra a la siguiente deuda.
          </span>
        </div>

        <div className="payoff-order-track">
          {simulation.payoffOrder && simulation.payoffOrder.length > 0 ? (
            simulation.payoffOrder.map((step, idx) => (
              <div key={step.debtId || idx} className="payoff-step-item">
                <div className="step-badge">
                  <span className="step-num">{idx + 1}</span>
                </div>
                <div className="step-details">
                  <div className="step-top-line">
                    <h5 className="step-name">{step.name}</h5>
                    <span className="step-month-badge">Liquidada en Mes {step.monthPaidOff}</span>
                  </div>
                  <div className="step-metrics">
                    <span>Interés pagado: <strong>${step.totalInterestPaid.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-payoff-notice">
              <p>¡Felicitaciones! No tienes deudas con saldo pendiente activo en este momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
