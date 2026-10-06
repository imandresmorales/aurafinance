import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import SubscriptionManager from './SubscriptionManager';
import FinancialCalendar from './FinancialCalendar';
import RecurringCommitmentTimeline from './RecurringCommitmentTimeline';
import CreateRecurringModal from './CreateRecurringModal';
import { simulateFinancialStress, STRESS_SCENARIOS } from '../../services/financialStressEngine';
import './RecurringBillsCenter.css';

export function RecurringBillsCenter() {
  const { wallets = [], subscriptions = [], transactions = [], baseCurrency = 'USD' } = useAccounts();
  const { addToast } = useToast();

  const [activeView, setActiveView] = useState('subscriptions'); // 'subscriptions' | 'calendar' | 'timeline' | 'stress'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customRules, setCustomRules] = useState([]);

  // Stress simulator state
  const [stressScenario, setStressScenario] = useState(STRESS_SCENARIOS.INCOME_DELAY);
  const [delayDays, setDelayDays] = useState(30);
  const [emergencyAmount, setEmergencyAmount] = useState(1500);

  // Combine subscriptions and custom rules
  const allCommitments = useMemo(() => {
    const list = [...subscriptions, ...customRules];
    if (list.length === 0) {
      return [
        { id: 'sub-1', name: 'Netflix Premium 4K', amount: 17.99, frequency: 'monthly', type: 'expense', category: 'Streaming & Ocio' },
        { id: 'sub-2', name: 'Spotify Familiar', amount: 14.99, frequency: 'monthly', type: 'expense', category: 'Streaming & Ocio' },
        { id: 'sub-3', name: 'AWS Cloud Hosting', amount: 89.50, frequency: 'monthly', type: 'expense', category: 'Software & Cloud' },
        { id: 'sub-4', name: 'Salario Nómina Tech', amount: 3500.00, frequency: 'monthly', type: 'income', category: 'Nómina / Salario' },
        { id: 'sub-5', name: 'Alquiler Oficina', amount: 650.00, frequency: 'monthly', type: 'expense', category: 'Vivienda & Alquiler' },
      ];
    }
    return list;
  }, [subscriptions, customRules]);

  // Macro Totals
  const totals = useMemo(() => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    allCommitments.forEach((item) => {
      const amt = Number(item.amount) || 0;
      const freq = item.frequency || 'monthly';
      const monthlyAmt = freq === 'annual' ? amt / 12 : freq === 'weekly' ? amt * 4.33 : freq === 'biweekly' ? amt * 2.16 : amt;

      if (item.type === 'income') {
        monthlyIncome += monthlyAmt;
      } else {
        monthlyExpense += monthlyAmt;
      }
    });

    const netRecurring = monthlyIncome - monthlyExpense;
    const totalLiquid = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0) || 1200;

    return {
      monthlyIncome,
      monthlyExpense,
      netRecurring,
      totalLiquid,
    };
  }, [allCommitments, wallets]);

  // Run stress simulation
  const stressReport = useMemo(() => {
    const recurringIncomes = allCommitments.filter((c) => c.type === 'income');
    const recurringExpenses = allCommitments.filter((c) => c.type !== 'income');

    return simulateFinancialStress({
      baseLiquidBalance: totals.totalLiquid,
      recurringIncomes,
      recurringExpenses,
      dailyDiscretionaryBurn: 15,
      scenarioType: stressScenario,
      scenarioParams: {
        delayDays,
        emergencyCost: emergencyAmount,
        incomeCutPct: 50,
        inflationSurgePct: 20,
      },
      horizonDays: 90,
    });
  }, [allCommitments, totals.totalLiquid, stressScenario, delayDays, emergencyAmount]);

  const handleSaveRule = (newRule) => {
    setCustomRules((prev) => [newRule, ...prev]);
  };

  return (
    <div className="recurring-bills-center" data-testid="recurring-bills-center">
      {/* Header & Controls */}
      <div className="recurring-center-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.4rem' }}>
            <span>Centro Integral de Finanzas Recurrentes</span>
          </div>
          <h1 className="text-gradient-emerald">Compromisos & Suscripciones</h1>
          <p className="recurring-center-subtitle">
            Control centralizado de flujos periódicos, contratos, calendario de vencimientos y simulación de solvencia.
          </p>
        </div>

        <button
          type="button"
          className="glass-button primary new-rule-btn"
          onClick={() => setIsCreateModalOpen(true)}
          data-testid="open-create-rule-btn"
        >
          <span>＋</span> Nueva Regla Recurrente
        </button>
      </div>

      {/* KPI Summary Banner */}
      <div className="recurring-kpi-banner">
        <div className="kpi-stat-card glass-card">
          <span className="kpi-label">Gastos Recurrentes / Mes</span>
          <span className="kpi-value text-red">
            -{formatCurrency(totals.monthlyExpense, baseCurrency)}
          </span>
          <span className="kpi-meta">{allCommitments.filter(c => c.type !== 'income').length} compromisos fijos</span>
        </div>

        <div className="kpi-stat-card glass-card">
          <span className="kpi-label">Ingresos Recurrentes / Mes</span>
          <span className="kpi-value text-emerald">
            +{formatCurrency(totals.monthlyIncome, baseCurrency)}
          </span>
          <span className="kpi-meta">{allCommitments.filter(c => c.type === 'income').length} fuentes periódicas</span>
        </div>

        <div className="kpi-stat-card glass-card">
          <span className="kpi-label">Flujo Neto Recurrente</span>
          <span className={`kpi-value ${totals.netRecurring >= 0 ? 'text-emerald' : 'text-red'}`}>
            {totals.netRecurring >= 0 ? '+' : ''}{formatCurrency(totals.netRecurring, baseCurrency)}
          </span>
          <span className="kpi-meta">Capacidad de ahorro base</span>
        </div>

        <div className="kpi-stat-card glass-card">
          <span className="kpi-label">Reserva Líquida Disponible</span>
          <span className="kpi-value text-gradient-emerald">
            {formatCurrency(totals.totalLiquid, baseCurrency)}
          </span>
          <span className="kpi-meta">Suma de saldos de billeteras</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="recurring-center-nav glass-card" role="tablist" aria-label="Vistas del centro recurrente">
        <button
          type="button"
          className={`nav-tab-btn ${activeView === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveView('subscriptions')}
          role="tab"
          aria-selected={activeView === 'subscriptions'}
          id="tab-subscriptions"
        >
          💳 Gestor de Suscripciones & Contratos
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
          role="tab"
          aria-selected={activeView === 'calendar'}
          id="tab-calendar"
        >
          🗓️ Calendario Financiero Interactivo
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeView === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveView('timeline')}
          role="tab"
          aria-selected={activeView === 'timeline'}
          id="tab-timeline"
        >
          ⏳ Timeline Cronológico del Mes
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeView === 'stress' ? 'active' : ''}`}
          onClick={() => setActiveView('stress')}
          role="tab"
          aria-selected={activeView === 'stress'}
          id="tab-stress"
        >
          ⚡ Simulador de Estrés Financiero
        </button>
      </div>

      {/* View Content Panels */}
      <div className="recurring-view-content" role="region" aria-labelledby={`tab-${activeView}`}>
        {activeView === 'subscriptions' && (
          <div className="view-pane" data-testid="view-subscriptions">
            <SubscriptionManager />
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="view-pane" data-testid="view-calendar">
            <FinancialCalendar />
          </div>
        )}

        {activeView === 'timeline' && (
          <div className="view-pane" data-testid="view-timeline">
            <RecurringCommitmentTimeline />
          </div>
        )}

        {activeView === 'stress' && (
          <div className="view-pane stress-simulator-pane" data-testid="view-stress">
            <div className="stress-config-card glass-card">
              <div className="stress-config-header">
                <h3>⚡ Configuración del Escenario de Contingencia</h3>
                <span className="resilience-badge" style={{ background: `${stressReport.tierColor}20`, borderColor: stressReport.tierColor, color: stressReport.tierColor }}>
                  {stressReport.tierLabel} (Score: {stressReport.resilienceScore}/100)
                </span>
              </div>

              <div className="stress-controls-grid">
                <div className="form-group">
                  <label className="form-label">Tipo de Shock Financiero</label>
                  <select
                    className="form-select"
                    value={stressScenario}
                    onChange={(e) => setStressScenario(e.target.value)}
                  >
                    <option value={STRESS_SCENARIOS.INCOME_DELAY}>Retraso de Cobros / Nómina (+30 días)</option>
                    <option value={STRESS_SCENARIOS.EMERGENCY_EXPENSE}>Gasto Extraordinario de Emergencia</option>
                    <option value={STRESS_SCENARIOS.INCOME_CUT}>Reducción del 50% en Ingresos</option>
                    <option value={STRESS_SCENARIOS.INFLATION_SURGE}>Subida del 20% en Costo de Vida</option>
                    <option value={STRESS_SCENARIOS.COMBINED_CRISIS}>Crisis Combinada (Retraso + Gasto + Inflación)</option>
                  </select>
                </div>

                {stressScenario === STRESS_SCENARIOS.INCOME_DELAY && (
                  <div className="form-group">
                    <label className="form-label">Días de retraso en cobros</label>
                    <input
                      type="number"
                      min="5"
                      max="90"
                      className="form-input"
                      value={delayDays}
                      onChange={(e) => setDelayDays(Number(e.target.value))}
                    />
                  </div>
                )}

                {(stressScenario === STRESS_SCENARIOS.EMERGENCY_EXPENSE || stressScenario === STRESS_SCENARIOS.COMBINED_CRISIS) && (
                  <div className="form-group">
                    <label className="form-label">Costo de la Emergencia ({baseCurrency})</label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      className="form-input"
                      value={emergencyAmount}
                      onChange={(e) => setEmergencyAmount(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Stress Results Summary */}
            <div className="stress-results-grid">
              <div className="stress-result-card glass-card">
                <span className="stress-res-title">¿Riesgo de Insolvencia?</span>
                <span className={`stress-res-val ${stressReport.hasInsolvencyRisk ? 'text-red' : 'text-emerald'}`}>
                  {stressReport.hasInsolvencyRisk ? '⚠️ SÍ, RIESGO ALTO' : '✅ NO, ABSORBIBLE'}
                </span>
                <span className="stress-res-sub">
                  {stressReport.hasInsolvencyRisk
                    ? `Déficit máximo proyectado: -${formatCurrency(stressReport.maxDeficit, baseCurrency)}`
                    : 'La reserva líquida soporta el shock sin caer a números rojos'}
                </span>
              </div>

              <div className="stress-result-card glass-card">
                <span className="stress-res-title">Días en Negativo</span>
                <span className="stress-res-val">
                  {stressReport.daysInNegative} días
                </span>
                <span className="stress-res-sub">
                  {stressReport.insolvencyDate ? `Entrada en descubierto: ${stressReport.insolvencyDate}` : 'Sin descubierto'}
                </span>
              </div>

              <div className="stress-result-card glass-card span-all">
                <span className="stress-res-title">🛡️ Medidas de Mitigación Recomendadas</span>
                <div className="mitigation-list">
                  {stressReport.recommendedMitigations.map((m, idx) => (
                    <div key={idx} className="mitigation-item">
                      <strong>{m.title}:</strong> {m.detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for creating recurring commitment */}
      <CreateRecurringModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveRule}
      />
    </div>
  );
}

export default RecurringBillsCenter;
