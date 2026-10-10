import React, { useState, useMemo } from 'react';
import { CreateLoanModal } from './CreateLoanModal';
import { DebtFreePlanner } from './DebtFreePlanner';
import DebtAmortizationHistoryChart from '../charts/DebtAmortizationHistoryChart';
import { compareDebtPayoffStrategies } from '../../services/debtPayoffStrategiesEngine';
import { calculateMaxSafeInstallment } from '../../services/maxInstallmentAdvisorEngine';
import { generateAmortizationSchedule } from '../../services/amortizationEngine';
import './DebtManagementCenter.css';

const INITIAL_DEBTS_DATA = [
  {
    id: 'debt-1',
    name: 'Tarjeta Santander Infinite',
    type: 'CREDIT_CARD',
    principal: 5000,
    principalBalance: 3200,
    interestRate: 0.26,
    annualRatePct: 26,
    minimumMonthlyPayment: 150,
    termMonths: 24,
    system: 'FRENCH'
  },
  {
    id: 'debt-2',
    name: 'Crédito Vehículo Mazda',
    type: 'AUTO_LOAN',
    principal: 18000,
    principalBalance: 11500,
    interestRate: 0.089,
    annualRatePct: 8.9,
    minimumMonthlyPayment: 380,
    termMonths: 48,
    system: 'FRENCH'
  },
  {
    id: 'debt-3',
    name: 'Préstamo Personal Reforma',
    type: 'PERSONAL_LOAN',
    principal: 8000,
    principalBalance: 4600,
    interestRate: 0.14,
    annualRatePct: 14,
    minimumMonthlyPayment: 210,
    termMonths: 36,
    system: 'GERMAN'
  }
];

export function DebtManagementCenter({
  initialDebts = INITIAL_DEBTS_DATA,
  monthlyIncome = 4500,
  onDebtsChange
}) {
  const [debts, setDebts] = useState(initialDebts);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'strategies' | 'planner' | 'amortization'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDebtForSchedule, setSelectedDebtForSchedule] = useState(null);

  // Cálculos consolidados de métricas clave (KPIs)
  const kpis = useMemo(() => {
    let totalBalance = 0;
    let totalMonthlyPayments = 0;
    let weightedRateSum = 0;

    debts.forEach(d => {
      const bal = Number(d.principalBalance ?? d.principal) || 0;
      const rate = Number(d.interestRate || (d.annualRatePct ? d.annualRatePct / 100 : 0)) || 0;
      const minPay = Number(d.minimumMonthlyPayment || d.monthlyPayment) || 0;

      totalBalance += bal;
      totalMonthlyPayments += minPay;
      weightedRateSum += bal * (rate * 100);
    });

    const weightedAvgApr = totalBalance > 0 ? weightedRateSum / totalBalance : 0;
    const advisor = calculateMaxSafeInstallment({
      monthlyIncome,
      existingDebtPayments: totalMonthlyPayments,
      fixedExpenses: monthlyIncome * 0.45
    });

    return {
      totalBalance,
      totalMonthlyPayments,
      weightedAvgApr,
      currentDtiPercent: advisor.currentDtiPercent,
      advisorStatus: advisor.status,
      recommendedMaxInstallment: advisor.recommendedMaxInstallment
    };
  }, [debts, monthlyIncome]);

  // Estrategias comparadas
  const strategyReport = useMemo(() => {
    return compareDebtPayoffStrategies(debts, 150);
  }, [debts]);

  const handleSaveLoan = (newLoan) => {
    const updated = [...debts, newLoan];
    setDebts(updated);
    onDebtsChange?.(updated);
  };

  const handleDeleteDebt = (id) => {
    const updated = debts.filter(d => d.id !== id);
    setDebts(updated);
    onDebtsChange?.(updated);
  };

  // Tabla de amortización para la deuda seleccionada
  const activeScheduleDebt = selectedDebtForSchedule || debts[0];
  const scheduleData = useMemo(() => {
    if (!activeScheduleDebt) return null;
    const p = Number(activeScheduleDebt.principalBalance || activeScheduleDebt.principal) || 1000;
    const r = Number(activeScheduleDebt.interestRate || (activeScheduleDebt.annualRatePct ? activeScheduleDebt.annualRatePct / 100 : 0.12));
    const term = Number(activeScheduleDebt.termMonths) || 24;
    const sys = activeScheduleDebt.system || 'FRENCH';

    return generateAmortizationSchedule({
      principal: p,
      annualRate: r,
      termMonths: term,
      system: sys
    });
  }, [activeScheduleDebt]);

  return (
    <div className="debt-management-center">
      {/* Header & KPI Bar */}
      <div className="debt-center-header">
        <div className="debt-header-text">
          <span className="debt-center-badge">Gestión Integral de Pasivos</span>
          <h2 className="debt-center-title">Centro de Control y Amortización de Deudas</h2>
          <p className="debt-center-desc">
            Monitorea el costo financiero consolidado, elimina pasivos mediante estrategias óptimas y visualiza tu ruta hacia la libertad financiera.
          </p>
        </div>

        <div className="debt-header-actions">
          <button
            type="button"
            className="btn-add-loan"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Registrar Préstamo / Tarjeta
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="debt-kpi-grid">
        <div className="debt-kpi-card">
          <span className="kpi-label">Saldo Total Adeudado</span>
          <h3 className="kpi-value text-red">
            ${kpis.totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </h3>
          <span className="kpi-meta">{debts.length} pasivos activos</span>
        </div>

        <div className="debt-kpi-card">
          <span className="kpi-label">Tasa Media Ponderada (APR)</span>
          <h3 className="kpi-value text-amber">
            {kpis.weightedAvgApr.toFixed(2)}%
          </h3>
          <span className="kpi-meta">Costo financiero global</span>
        </div>

        <div className="debt-kpi-card">
          <span className="kpi-label">Compromiso Mensual Mínimo</span>
          <h3 className="kpi-value">
            ${kpis.totalMonthlyPayments.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </h3>
          <span className="kpi-meta">Cuotas fijas obligatorias</span>
        </div>

        <div className="debt-kpi-card highlight">
          <span className="kpi-label">Ratio de Endeudamiento (DTI)</span>
          <h3 className="kpi-value text-emerald">
            {kpis.currentDtiPercent}%
          </h3>
          <span className="kpi-meta">
            Límite bancario seguro: 35%
          </span>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="debt-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'inventory'}
          className={`debt-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📋 Inventario de Pasivos
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'strategies'}
          className={`debt-tab-btn ${activeTab === 'strategies' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategies')}
        >
          ⚔️ Comparativa de Estrategias
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'planner'}
          className={`debt-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveTab('planner')}
        >
          🗓️ Planificador Cero Deuda
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'amortization'}
          className={`debt-tab-btn ${activeTab === 'amortization' ? 'active' : ''}`}
          onClick={() => setActiveTab('amortization')}
        >
          📊 Tablas de Amortización
        </button>
      </div>

      {/* Contenido de Pestañas */}
      <div className="debt-tab-content">
        {/* PESTAÑA 1: Inventario de Pasivos */}
        {activeTab === 'inventory' && (
          <div className="debt-inventory-view">
            <div className="inventory-cards-list">
              {debts.map(debt => {
                const bal = Number(debt.principalBalance ?? debt.principal) || 0;
                const orig = Number(debt.principal) || bal;
                const progressPct = orig > 0 ? Math.min(100, Math.max(0, ((orig - bal) / orig) * 100)) : 0;
                const apr = debt.annualRatePct || (debt.interestRate ? debt.interestRate * 100 : 0);

                return (
                  <div key={debt.id} className="debt-item-card">
                    <div className="debt-item-top">
                      <div className="debt-item-name-group">
                        <span className="debt-type-pill">{debt.type || 'CRÉDITO'}</span>
                        <h4>{debt.name}</h4>
                      </div>
                      <div className="debt-apr-pill">
                        APR: <strong>{Number(apr).toFixed(1)}%</strong>
                      </div>
                    </div>

                    <div className="debt-progress-section">
                      <div className="debt-progress-labels">
                        <span>Amortizado: {progressPct.toFixed(0)}%</span>
                        <span>Saldo: <strong>${bal.toFixed(2)}</strong> / ${orig.toFixed(2)}</span>
                      </div>
                      <div className="debt-progress-bar-bg">
                        <div
                          className="debt-progress-bar-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="debt-item-footer">
                      <div className="debt-payment-stat">
                        <span>Cuota mínima:</span>
                        <strong>${(debt.minimumMonthlyPayment || debt.monthlyPayment || 0).toFixed(2)}/mes</strong>
                      </div>

                      <div className="debt-actions-row">
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => {
                            setSelectedDebtForSchedule(debt);
                            setActiveTab('amortization');
                          }}
                        >
                          Ver Amortización
                        </button>
                        <button
                          type="button"
                          className="btn-delete-action"
                          onClick={() => handleDeleteDebt(debt.id)}
                          aria-label={`Eliminar ${debt.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gráfico Histórico de Amortización */}
            <div className="inventory-chart-wrapper">
              <DebtAmortizationHistoryChart
                totalDebt={kpis.totalBalance}
                paidOffDebt={debts.reduce((sum, d) => sum + Math.max(0, (Number(d.principal) || 0) - (Number(d.principalBalance) || 0)), 0)}
              />
            </div>
          </div>
        )}

        {/* PESTAÑA 2: Comparativa de Estrategias */}
        {activeTab === 'strategies' && (
          <div className="debt-strategies-view">
            <div className="strategies-comparison-grid">
              <div className="strategy-card recommended">
                <div className="strat-card-header">
                  <span className="strat-tag">Máximo Ahorro Financiero</span>
                  <h3>Estrategia Avalancha</h3>
                </div>
                <div className="strat-main-metric">
                  <span className="strat-months">{strategyReport.strategies.avalanche.monthsToDebtFree}</span>
                  <span className="strat-months-label">meses para terminar</span>
                </div>
                <div className="strat-breakdown">
                  <div className="strat-row">
                    <span>Intereses Totales:</span>
                    <strong>${strategyReport.strategies.avalanche.totalInterestPaid.toFixed(2)}</strong>
                  </div>
                  <div className="strat-row highlight">
                    <span>Ahorro vs Mínimos:</span>
                    <strong className="text-emerald">
                      +${strategyReport.savings.avalancheVsMinimumInterestSaved.toFixed(2)}
                    </strong>
                  </div>
                  <div className="strat-row">
                    <span>Tiempo Ahorrado:</span>
                    <strong>{strategyReport.savings.avalancheMonthsSaved} meses antes</strong>
                  </div>
                </div>
                <p className="strat-desc">
                  Liquida primero los pasivos con mayor tasa de interés. Matemáticamente insuperable.
                </p>
              </div>

              <div className="strategy-card">
                <div className="strat-card-header">
                  <span className="strat-tag blue">Victoria Rápida</span>
                  <h3>Estrategia Bola de Nieve</h3>
                </div>
                <div className="strat-main-metric">
                  <span className="strat-months">{strategyReport.strategies.snowball.monthsToDebtFree}</span>
                  <span className="strat-months-label">meses para terminar</span>
                </div>
                <div className="strat-breakdown">
                  <div className="strat-row">
                    <span>Intereses Totales:</span>
                    <strong>${strategyReport.strategies.snowball.totalInterestPaid.toFixed(2)}</strong>
                  </div>
                  <div className="strat-row highlight">
                    <span>Ahorro vs Mínimos:</span>
                    <strong className="text-emerald">
                      +${strategyReport.savings.snowballVsMinimumInterestSaved.toFixed(2)}
                    </strong>
                  </div>
                  <div className="strat-row">
                    <span>Tiempo Ahorrado:</span>
                    <strong>{strategyReport.savings.snowballMonthsSaved} meses antes</strong>
                  </div>
                </div>
                <p className="strat-desc">
                  Liquida primero los saldos menores para liberar flujo mensual y generar motivación psicológica.
                </p>
              </div>

              <div className="strategy-card danger">
                <div className="strat-card-header">
                  <span className="strat-tag red">Ruta Tradicional</span>
                  <h3>Solo Pagos Mínimos</h3>
                </div>
                <div className="strat-main-metric">
                  <span className="strat-months">{strategyReport.strategies.minimumOnly.monthsToDebtFree}</span>
                  <span className="strat-months-label">meses para terminar</span>
                </div>
                <div className="strat-breakdown">
                  <div className="strat-row">
                    <span>Intereses Totales:</span>
                    <strong className="text-red">${strategyReport.strategies.minimumOnly.totalInterestPaid.toFixed(2)}</strong>
                  </div>
                  <div className="strat-row">
                    <span>Total Pagado al Banco:</span>
                    <strong>${strategyReport.strategies.minimumOnly.totalPaid.toFixed(2)}</strong>
                  </div>
                </div>
                <p className="strat-desc">
                  Pagar solo el mínimo prolonga la deuda y maximiza los intereses que absorbe la entidad financiera.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: Planificador Cero Deuda */}
        {activeTab === 'planner' && (
          <div className="debt-planner-view">
            <DebtFreePlanner debts={debts} />
          </div>
        )}

        {/* PESTAÑA 4: Tablas de Amortización */}
        {activeTab === 'amortization' && (
          <div className="debt-schedule-view">
            {scheduleData && (
              <div className="schedule-table-wrapper">
                <div className="schedule-table-header">
                  <div>
                    <h4>Cronograma de Amortización: {activeScheduleDebt?.name}</h4>
                    <span className="schedule-meta-text">
                      {scheduleData.systemMeta?.name} • Capital: ${scheduleData.principal.toFixed(2)} • Interés Total: ${scheduleData.totalInterestPaid.toFixed(2)}
                    </span>
                  </div>

                  <select
                    className="debt-select-picker"
                    value={activeScheduleDebt?.id}
                    onChange={(e) => {
                      const found = debts.find(d => d.id === e.target.value);
                      if (found) setSelectedDebtForSchedule(found);
                    }}
                    aria-label="Seleccionar préstamo para ver cronograma"
                  >
                    {debts.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (${Number(d.principalBalance ?? d.principal).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="schedule-scroll-container">
                  <table className="schedule-data-table">
                    <thead>
                      <tr>
                        <th>Periodo</th>
                        <th>Fecha</th>
                        <th>Saldo Inicial</th>
                        <th>Cuota Total</th>
                        <th>Amortización Capital</th>
                        <th>Interés Pagado</th>
                        <th>Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleData.schedule.slice(0, 36).map(row => (
                        <tr key={row.period}>
                          <td><strong>#{row.period}</strong></td>
                          <td>{row.date}</td>
                          <td>${row.beginningBalance.toFixed(2)}</td>
                          <td className="payment-col"><strong>${row.totalPayment.toFixed(2)}</strong></td>
                          <td className="principal-col">${row.principalPayment.toFixed(2)}</td>
                          <td className="interest-col">${row.interestPayment.toFixed(2)}</td>
                          <td>${row.endingBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      <CreateLoanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveLoan}
      />
    </div>
  );
}
