import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../hooks';
import { formatCurrency } from '../utils';
import { calculateEnvelopeExecution } from '../services';
import { Rule502030Card, BudgetModal } from '../components';

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

      {/* 50/30/20 Rule Breakdown */}
      <Rule502030Card />

      {/* Envelopes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {envelopes.map((env) => {
          const percent = Math.min(100, Math.round(env.percentSpent || 0));
          const isOver = env.isOverBudget;

          return (
            <div key={env.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{env.icon || '🏷️'}</span>
                  <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>{env.name}</h3>
                </div>
                <span className={`glass-pill ${isOver ? 'danger' : percent > 85 ? 'gold' : 'emerald'}`} style={{ fontSize: 'var(--font-size-2xs)' }}>
                  {percent}% consumido
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '1rem 0' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: isOver 
                      ? 'linear-gradient(90deg, #f43f5e, #e11d48)' 
                      : percent > 85 
                        ? 'linear-gradient(90deg, #e2c275, #f59e0b)' 
                        : 'linear-gradient(90deg, #10b981, #34d399)',
                    borderRadius: 'var(--radius-full)',
                    boxShadow: isOver ? '0 0 8px rgba(244,63,94,0.5)' : '0 0 8px rgba(16,185,129,0.4)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                <span>Gastado: <strong className="num-mono" style={{ color: isOver ? 'var(--color-expense)' : 'var(--text-primary)' }}>{formatCurrency(env.spent)}</strong></span>
                <span>Límite: <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(env.allocated)}</strong></span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(env)}
                  style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-primary-light)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  ✏️ Editar Límite
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBudget(env.id, env.name)}
                  style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
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

