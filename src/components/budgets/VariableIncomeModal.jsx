import React, { useState, useMemo } from 'react';
import { Modal, Input } from '../common';
import { useAccounts, useToast } from '../../hooks';
import { calculateDynamicVariableBudget } from '../../services';
import { formatCurrency } from '../../utils';
import './VariableIncomeModal.css';

export default function VariableIncomeModal({ isOpen, onClose }) {
  const { transactions, setBudgets } = useAccounts();
  const toast = useToast();

  // Calcular ingresos del mes en curso como punto de partida
  const initialMonthlyIncome = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const inc = transactions
      .filter((t) => !t.deleted && t.type === 'INCOME' && t.date?.startsWith(currentMonth))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return inc > 0 ? inc : 2800;
  }, [transactions]);

  const [simulatedIncome, setSimulatedIncome] = useState(initialMonthlyIncome);

  const dynamicBudget = useMemo(() => {
    return calculateDynamicVariableBudget(Number(simulatedIncome) || 0);
  }, [simulatedIncome]);

  const { tierBreakdown, activeTier, statusSummary, allEnvelopes } = dynamicBudget;

  const handleApplyToEnvelopes = async () => {
    try {
      const convertedEnvelopes = allEnvelopes.map((env) => ({
        id: `dyn-${env.id}`,
        name: env.name,
        category: env.category,
        allocated: env.allocated,
        icon: env.icon || '🏷️',
        color: env.tier === 'SURVIVAL' ? '#38bdf8' : env.tier === 'COMFORT' ? '#f59e0b' : '#10b981',
        period: new Date().toISOString().slice(0, 7),
        notes: `Nivel Dinámico: ${env.tier}`,
      }));

      await setBudgets(convertedEnvelopes);
      toast?.success('Presupuesto dinámico en cascada aplicado a tus sobres activos.');
      onClose();
    } catch (err) {
      toast?.error(err.message || 'Error al aplicar el presupuesto.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Presupuesto Dinámico en Cascada (Freelancers & Variables)"
      subtitle="Distribución jerárquica: Supervivencia ➔ Confort ➔ Crecimiento"
      maxWidth="700px"
    >
      <div className="variable-income-container">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Ingreso Percibido este Mes ($):"
              type="number"
              step="any"
              min="0"
              value={simulatedIncome}
              onChange={(e) => setSimulatedIncome(e.target.value)}
              placeholder="0.00"
              className="num-mono"
            />
          </div>
          <div className="glass-pill emerald" style={{ height: '42px', display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span>Nivel Activo: <strong>{activeTier}</strong></span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0.75rem 1rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          💡 {statusSummary}
        </div>

        {/* 3 Tiers Breakdown */}
        <div className="tier-cascade-grid">
          {/* Tier 1: Survival */}
          <div className={`tier-card-block ${tierBreakdown.tier1.isFullyFunded ? 'active' : ''}`}>
            <div className="tier-card-header">
              <span className="tier-title">🛡️ Nivel 1: Supervivencia Innegociable</span>
              <span className="num-mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {formatCurrency(tierBreakdown.tier1.total, 'USD')}
              </span>
            </div>
            <div className="tier-envelope-list">
              {tierBreakdown.tier1.envelopes.map((env) => (
                <div key={env.id} className="tier-env-item">
                  <span>{env.icon} {env.name}</span>
                  <strong className="num-mono">{formatCurrency(env.allocated, 'USD')}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2: Comfort */}
          <div className={`tier-card-block ${tierBreakdown.tier2.isFullyFunded ? 'active' : ''}`}>
            <div className="tier-card-header">
              <span className="tier-title">☕ Nivel 2: Confort & Estabilidad</span>
              <span className="num-mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {formatCurrency(tierBreakdown.tier2.total, 'USD')}
              </span>
            </div>
            <div className="tier-envelope-list">
              {tierBreakdown.tier2.envelopes.map((env) => (
                <div key={env.id} className="tier-env-item">
                  <span>{env.icon} {env.name}</span>
                  <strong className="num-mono">{formatCurrency(env.allocated, 'USD')}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 3: Growth & Buffer */}
          <div className={`tier-card-block ${tierBreakdown.tier3.total > 0 ? 'active' : ''}`}>
            <div className="tier-card-header">
              <span className="tier-title">📈 Nivel 3: Inversión & Holding Buffer</span>
              <span className="num-mono text-gradient-emerald" style={{ fontWeight: 700 }}>
                {formatCurrency(tierBreakdown.tier3.total, 'USD')}
              </span>
            </div>
            <div className="tier-envelope-list">
              {tierBreakdown.tier3.envelopes.map((env) => (
                <div key={env.id} className="tier-env-item">
                  <span>{env.icon} {env.name}</span>
                  <strong className="num-mono">{formatCurrency(env.allocated, 'USD')}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
          <button type="button" className="glass-pill" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="glass-pill emerald" onClick={handleApplyToEnvelopes} style={{ fontWeight: 600 }}>
            ⚡ Aplicar Distribución a Sobres
          </button>
        </div>
      </div>
    </Modal>
  );
}
