import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../hooks';
import { formatCurrency } from '../utils';
import { calculateEnvelopeExecution } from '../services';
import {
  Rule502030Card,
  BudgetModal,
  EnvelopeCard,
  EmergencyFundTracker,
  VariableIncomeModal,
  EnvelopeReallocatorModal,
  BudgetVarianceReport,
  CategoryManagerModal,
  FixedVsDiscretionaryCard,
  BurnRateForecastCard,
  MicroExpensesCard,
  BudgetRolloverModal,
  SurplusAllocationModal,
  BudgetMatrix,
  EnvelopeBudgetExplorer,
  SubscriptionManager,
} from '../components';

export default function BudgetsView() {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget } = useAccounts();
  const toast = useToast();

  const [activeBudgetsTab, setActiveBudgetsTab] = useState('envelopes'); // 'envelopes' | 'subscriptions'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isReallocModalOpen, setIsReallocModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [isSurplusModalOpen, setIsSurplusModalOpen] = useState(false);
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
      {/* Top View Selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(6, 26, 20, 0.7)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '0.75rem',
            padding: '0.25rem',
            gap: '0.25rem',
          }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeBudgetsTab === 'envelopes'}
            onClick={() => setActiveBudgetsTab('envelopes')}
            style={{
              background: activeBudgetsTab === 'envelopes' ? '#10b981' : 'transparent',
              color: activeBudgetsTab === 'envelopes' ? '#041a14' : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            ✉️ Sobres de Presupuesto
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeBudgetsTab === 'subscriptions'}
            onClick={() => setActiveBudgetsTab('subscriptions')}
            style={{
              background: activeBudgetsTab === 'subscriptions' ? '#10b981' : 'transparent',
              color: activeBudgetsTab === 'subscriptions' ? '#041a14' : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📱 Gestor de Suscripciones
          </button>
        </div>
      </div>

      {activeBudgetsTab === 'subscriptions' ? (
        <SubscriptionManager />
      ) : (
        <>
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="glass-pill"
            onClick={() => setIsCategoryModalOpen(true)}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
          >
            🏷️ Categorías & Iconos
          </button>
          <button
            type="button"
            className="glass-pill"
            onClick={() => setIsReallocModalOpen(true)}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
          >
            ⇄ Reasignar Sobres
          </button>
          <button
            type="button"
            className="glass-pill"
            onClick={() => setIsRolloverModalOpen(true)}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
          >
            🗓️ Cierre & Reajuste
          </button>
          <button
            type="button"
            className="glass-pill gold"
            onClick={() => setIsSurplusModalOpen(true)}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}
          >
            💰 Asignar Excedente
          </button>
          <button
            type="button"
            className="glass-pill gold"
            onClick={() => setIsVariableModalOpen(true)}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}
          >
            ⚡ Presupuesto Dinámico
          </button>
          <button
            type="button"
            className="glass-pill emerald"
            onClick={handleOpenCreate}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nuevo Sobre
          </button>
        </div>
      </header>

      {/* Emergency Fund & Survival Runway Tracker */}
      <EmergencyFundTracker />

      {/* 50/30/20 Rule Breakdown */}
      <Rule502030Card />

      {/* Analytical Budget Variance Report */}
      <BudgetVarianceReport />

      {/* Fixed vs Discretionary Expenses & FCR Ratio */}
      <FixedVsDiscretionaryCard />

      {/* Burn Rate & Month-End Financial Forecast */}
      <BurnRateForecastCard />

      {/* Micro-Expenses ("Efecto Hormiga") Cumulative Analysis */}
      <MicroExpensesCard />

      {/* Interannual & Multi-Period Budget Matrix */}
      <BudgetMatrix />

      {/* Interactive Envelope Budget Explorer */}
      <EnvelopeBudgetExplorer onEditBudget={handleOpenEdit} />

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

      {/* Variable Income Modal */}
      <VariableIncomeModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
      />

      {/* Envelope Reallocation Modal */}
      <EnvelopeReallocatorModal
        isOpen={isReallocModalOpen}
        onClose={() => setIsReallocModalOpen(false)}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Smart Monthly Period-End Budget Rollover Modal */}
      <BudgetRolloverModal
        isOpen={isRolloverModalOpen}
        onClose={() => setIsRolloverModalOpen(false)}
      />

      {/* Interactive Surplus Allocator Modal */}
      <SurplusAllocationModal
        isOpen={isSurplusModalOpen}
        onClose={() => setIsSurplusModalOpen(false)}
      />
        </>
      )}
    </div>
  );
}

