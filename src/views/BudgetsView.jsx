import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../hooks';
import { formatCurrency } from '../utils';
import { calculateEnvelopeExecution } from '../services';
import { Rule502030Card, BudgetModal, EnvelopeCard, EmergencyFundTracker } from '../components';

export default function BudgetsView() {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget } = useAccounts();
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(null);

  const { envelopes, summary } = useMemo(() => {
    return calculateEnvelopeExecution(budgets, transactions);
  }, [budgets, transactions]);

  const handleOpenCreate = () => {
    setBudgetToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (env) => {
    setBudgetToEdit(env);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (budgetData, budgetId) => {
    try {
      if (budgetId) {
        await updateBudget(budgetId, budgetData);
        toast?.success(`Sobre "${budgetData.name}" actualizado correctamente.`);
      } else {
        await addBudget(budgetData);
        toast?.success(`Nuevo sobre "${budgetData.name}" creado con éxito.`);
      }
    } catch (err) {
      toast?.error(err.message || 'Error al guardar el sobre de presupuesto.');
    }
  };

  const handleDeleteBudget = async (budgetId, name) => {
    if (window.confirm(`¿Estás seguro de eliminar el sobre "${name}"?`)) {
      await deleteBudget(budgetId);
      toast?.info(`Sobre "${name}" eliminado.`);
    }
  };

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
            <span>Metodología Zero-Based Envelopes</span>
          </div>
          <h1 className="text-gradient-emerald">Presupuesto por Sobres</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Asignación mensual por categorías con límites inteligentes y alertas dinámicas.
          </p>
        </div>

        <div>
          <button
            type="button"
            className="glass-pill emerald"
            onClick={handleOpenCreate}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nuevo Sobre de Presupuesto
          </button>
        </div>
      </header>

      {/* Emergency Fund & Survival Runway Tracker */}
      <EmergencyFundTracker />

      {/* 50/30/20 Rule Breakdown */}
      <Rule502030Card />

      {/* Envelopes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {envelopes.map((env) => (
          <EnvelopeCard
            key={env.id}
            envelope={env}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteBudget}
          />
        ))}
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBudget}
        budgetToEdit={budgetToEdit}
      />
    </div>
  );
}

