import React, { useState, useEffect, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import {
  ROLLOVER_ACTIONS,
  calculatePeriodEndAnalysis,
  applyPeriodRollover,
} from '../../services/budgetRolloverEngine';
import { Modal } from '../common';
import './BudgetRolloverModal.css';

export default function BudgetRolloverModal({ isOpen, onClose }) {
  const { budgets, setBudgets, transactions } = useAccounts();
  const toast = useToast();

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [closedPeriod, setClosedPeriod] = useState(currentMonthKey);
  const [nextPeriod, setNextPeriod] = useState(() => {
    const [y, m] = currentMonthKey.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    return nextDate.toISOString().slice(0, 7);
  });

  const [envelopeReviews, setEnvelopeReviews] = useState([]);

  // Calculate analysis whenever closedPeriod or nextPeriod changes
  useEffect(() => {
    if (isOpen) {
      const analysis = calculatePeriodEndAnalysis(budgets, transactions, closedPeriod, nextPeriod);
      setEnvelopeReviews(analysis.envelopes || []);
    }
  }, [isOpen, closedPeriod, nextPeriod, budgets, transactions]);

  const handleActionChange = (envelopeId, newAction) => {
    setEnvelopeReviews(prev =>
      prev.map(item => (item.id === envelopeId ? { ...item, selectedAction: newAction } : item))
    );
  };

  const rolloverResults = useMemo(() => {
    return applyPeriodRollover(budgets, envelopeReviews, nextPeriod);
  }, [budgets, envelopeReviews, nextPeriod]);

  const totalPreviousBudget = useMemo(() => {
    return envelopeReviews.reduce((acc, r) => acc + r.baseAllocated, 0);
  }, [envelopeReviews]);

  const totalPreviousSpent = useMemo(() => {
    return envelopeReviews.reduce((acc, r) => acc + r.actualSpent, 0);
  }, [envelopeReviews]);

  const totalSurplus = totalPreviousBudget - totalPreviousSpent;

  const handleApplyRollover = async () => {
    try {
      if (rolloverResults.updatedBudgets && rolloverResults.updatedBudgets.length > 0) {
        await setBudgets(rolloverResults.updatedBudgets);
        toast?.success(
          `¡Cierre de período aplicado! ${envelopeReviews.length} sobres actualizados para el período ${nextPeriod}.`
        );
        onClose();
      }
    } catch (err) {
      toast?.error('Error al aplicar el reajuste presupuestario.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asistente de Cierre de Período y Reajuste Inteligente">
      <div className="rollover-modal-container">
        {/* Period Transition Header */}
        <div className="rollover-periods-bar">
          <div className="rollover-period-item">
            <span className="rollover-period-label">Período a Cerrar (Auditoría):</span>
            <input
              type="month"
              className="glass-input"
              value={closedPeriod}
              onChange={(e) => setClosedPeriod(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          <div style={{ fontSize: '1.25rem', color: 'var(--emerald-400)' }}>➔</div>

          <div className="rollover-period-item">
            <span className="rollover-period-label">Nuevo Período Objetivo:</span>
            <input
              type="month"
              className="glass-input"
              value={nextPeriod}
              onChange={(e) => setNextPeriod(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
            />
          </div>
        </div>

        {/* Aggregate KPI Summary Cards */}
        <div className="rollover-summary-cards">
          <div className="rollover-summary-card">
            <span className="rollover-period-label">Presupuesto Anterior</span>
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalPreviousBudget)}
            </span>
          </div>

          <div className="rollover-summary-card">
            <span className="rollover-period-label">Gasto Real Ejecutado</span>
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalPreviousSpent)}
            </span>
          </div>

          <div className="rollover-summary-card">
            <span className="rollover-period-label">Excedente / Ahorro Disponible</span>
            <span style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: totalSurplus >= 0 ? 'var(--emerald-400)' : '#f87171'
            }}>
              {totalSurplus >= 0 ? `+${formatCurrency(totalSurplus)}` : `-${formatCurrency(Math.abs(totalSurplus))}`}
            </span>
          </div>

          <div className="rollover-summary-card">
            <span className="rollover-period-label">Nuevo Presupuesto Proyectado</span>
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)' }}>
              {formatCurrency(rolloverResults.totalAllocatedNextMonth)}
            </span>
          </div>
        </div>

        {/* Envelope Breakdown & Policy Selector Table */}
        <div className="rollover-table-wrapper">
          <table className="rollover-table">
            <thead>
              <tr>
                <th>Sobre / Categoría</th>
                <th>Asignado Anterior</th>
                <th>Real Gastado</th>
                <th>Excedente</th>
                <th>Política de Cierre</th>
                <th>Nueva Asignación</th>
              </tr>
            </thead>
            <tbody>
              {envelopeReviews.map((env) => {
                const previewBudget = (rolloverResults.updatedBudgets || []).find(b => b.id === env.id);
                return (
                  <tr key={env.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{env.icon}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{env.name}</strong>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(env.baseAllocated)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(env.actualSpent)}</td>
                    <td style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: env.surplus >= 0 ? 'var(--emerald-400)' : '#f87171'
                    }}>
                      {env.surplus >= 0 ? `+${formatCurrency(env.surplus)}` : `-${formatCurrency(Math.abs(env.surplus))}`}
                    </td>
                    <td>
                      <select
                        className="rollover-select"
                        value={env.selectedAction}
                        onChange={(e) => handleActionChange(env.id, e.target.value)}
                      >
                        <option value={ROLLOVER_ACTIONS.SWEEP_TO_SAVINGS}>🧹 Barrer Excedente a Ahorro</option>
                        <option value={ROLLOVER_ACTIONS.ROLLOVER_BALANCE}>🔄 Acumular en Sobre (+Excedente)</option>
                        <option value={ROLLOVER_ACTIONS.ADAPTIVE_SMART}>⚡ Ajuste Adaptativo ({formatCurrency(env.smartProposed)})</option>
                        <option value={ROLLOVER_ACTIONS.RESET_ZERO}>0️⃣ Reiniciar Base Cero</option>
                      </select>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald-300)' }}>
                      {formatCurrency(previewBudget?.allocated || env.baseAllocated)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="glass-pill"
            onClick={onClose}
            style={{ padding: '0.6rem 1.25rem', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="glass-pill emerald"
            onClick={handleApplyRollover}
            style={{ padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            ✓ Aplicar Cierre y Reajustar Presupuestos
          </button>
        </div>
      </div>
    </Modal>
  );
}
