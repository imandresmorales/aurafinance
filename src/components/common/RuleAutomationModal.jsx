import React, { useState } from 'react';
import { useAccounts, useToast, useEncryptedStorage } from '../../hooks';
import {
  DEFAULT_AUTOMATION_RULES,
  RULE_OPERATORS,
  RULE_FIELDS,
  batchApplyRules,
} from '../../services/ruleAutomationEngine';
import { FINANCIAL_CATEGORIES } from '../../services/categoriesData';
import Modal from './Modal';
import './RuleAutomationModal.css';

export default function RuleAutomationModal({ isOpen, onClose }) {
  const { transactions, rawTransactions, setTransactions, categories } = useAccounts();
  const toast = useToast();

  const [rules, setRules] = useEncryptedStorage('automation_rules', DEFAULT_AUTOMATION_RULES);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'

  // New Rule Form State
  const [ruleName, setRuleName] = useState('');
  const [field, setField] = useState(RULE_FIELDS.DESCRIPTION);
  const [operator, setOperator] = useState(RULE_OPERATORS.CONTAINS);
  const [value, setValue] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [targetSubCategory, setTargetSubCategory] = useState('');
  const [targetTags, setTargetTags] = useState('');

  const currentRules = Array.isArray(rules) ? rules : DEFAULT_AUTOMATION_RULES;
  const availableCategories = categories || FINANCIAL_CATEGORIES;

  const handleToggleRule = async (ruleId) => {
    const updated = currentRules.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r);
    await setRules(updated);
  };

  const handleDeleteRule = async (ruleId, name) => {
    if (window.confirm(`¿Eliminar la regla "${name}"?`)) {
      const updated = currentRules.filter(r => r.id !== ruleId);
      await setRules(updated);
      toast?.info(`Regla "${name}" eliminada.`);
    }
  };

  const handleResetRules = async () => {
    if (window.confirm('¿Restaurar las reglas de automatización por defecto?')) {
      await setRules(DEFAULT_AUTOMATION_RULES);
      toast?.success('Reglas restauradas por defecto.');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!ruleName.trim() || !value.trim()) {
      toast?.warning('Por favor completa el nombre y el valor de la condición.');
      return;
    }

    const tagsArray = targetTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const newRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: ruleName.trim(),
      isActive: true,
      condition: {
        field,
        operator,
        value: value.trim(),
      },
      actions: {
        setCategory: targetCategory || undefined,
        setSubCategory: targetSubCategory || undefined,
        addTags: tagsArray.length ? tagsArray : undefined,
      },
    };

    const updated = [...currentRules, newRule];
    await setRules(updated);
    toast?.success(`Regla "${newRule.name}" creada con éxito.`);

    // Reset Form
    setRuleName('');
    setValue('');
    setTargetCategory('');
    setTargetSubCategory('');
    setTargetTags('');
    setActiveTab('list');
  };

  const handleRunRulesBatch = async () => {
    try {
      const targetList = rawTransactions && rawTransactions.length ? rawTransactions : transactions;
      const { transactions: updatedList, totalModified, appliedCount } = batchApplyRules(targetList, currentRules);

      if (totalModified > 0) {
        await setTransactions(updatedList);
        toast?.success(`¡Automatización ejecutada! ${totalModified} transacciones enriquecidas.`);
      } else {
        toast?.info('Todas las transacciones ya coinciden con las reglas actuales.');
      }
    } catch (err) {
      toast?.error('Error al ejecutar reglas de automatización.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Motor de Reglas y Automatizaciones">
      <div className="rule-automation-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`glass-pill ${activeTab === 'list' ? 'emerald' : ''}`}
              onClick={() => setActiveTab('list')}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
            >
              📋 Reglas Activas ({currentRules.length})
            </button>
            <button
              type="button"
              className={`glass-pill ${activeTab === 'create' ? 'emerald' : ''}`}
              onClick={() => setActiveTab('create')}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
            >
              + Nueva Regla
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="glass-pill gold"
              onClick={handleRunRulesBatch}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 600 }}
              title="Aplica todas las reglas activas a tus transacciones existentes"
            >
              ⚡ Ejecutar en Bóveda
            </button>
          </div>
        </div>

        {activeTab === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Clasifica automáticamente comercios recurrentes, asigna etiquetas (#Fijo, #SaaS) y categorías.
              </span>
              <button
                type="button"
                className="glass-pill"
                onClick={handleResetRules}
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
              >
                🔄 Restaurar
              </button>
            </div>

            <div className="rules-list-container">
              {currentRules.map((rule) => (
                <div key={rule.id} className={`rule-card ${!rule.isActive ? 'inactive' : ''}`}>
                  <div className="rule-info">
                    <div className="rule-name-row">
                      <input
                        type="checkbox"
                        checked={rule.isActive !== false}
                        onChange={() => handleToggleRule(rule.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--emerald-500)' }}
                      />
                      <h4>{rule.name}</h4>
                    </div>

                    <div className="rule-logic-badge">
                      <span>SI</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {rule.condition?.field === 'description' ? 'Descripción' : rule.condition?.field}
                      </strong>
                      <span>
                        {rule.condition?.operator === 'contains' ? 'contiene' : rule.condition?.operator}
                      </span>
                      <span style={{ color: 'var(--emerald-400)' }}>"{rule.condition?.value}"</span>
                    </div>

                    <div className="rule-actions-summary">
                      <span>ENTONCES ➔</span>
                      {rule.actions?.setCategory && (
                        <span className="rule-target-cat">Categoría: {rule.actions.setCategory}</span>
                      )}
                      {rule.actions?.setSubCategory && (
                        <span style={{ color: 'var(--text-secondary)' }}>({rule.actions.setSubCategory})</span>
                      )}
                      {(rule.actions?.addTags || []).map((t, idx) => (
                        <span key={idx} className="rule-tag-pill">{t}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id, rule.name)}
                    className="glass-pill rose"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                    title="Eliminar regla"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <form onSubmit={handleCreateRule} className="rule-form">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
              Crear Regla Condicional de Automatización
            </h3>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Nombre de la Regla
              </label>
              <input
                type="text"
                className="glass-input"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Ej. Auto-etiquetar Uber como Transporte"
                required
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Condición Disparadora (SI...)
              </label>
              <div className="rule-condition-builder">
                <select
                  className="glass-input"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  style={{ padding: '0.5rem' }}
                >
                  <option value={RULE_FIELDS.DESCRIPTION}>Descripción / Comercio</option>
                  <option value={RULE_FIELDS.AMOUNT}>Monto ($)</option>
                  <option value={RULE_FIELDS.CATEGORY}>Categoría Actual</option>
                </select>

                <select
                  className="glass-input"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  style={{ padding: '0.5rem' }}
                >
                  <option value={RULE_OPERATORS.CONTAINS}>Contiene (separar por comas)</option>
                  <option value={RULE_OPERATORS.EQUALS}>Es exactamente igual a</option>
                  <option value={RULE_OPERATORS.STARTS_WITH}>Comienza con</option>
                  <option value={RULE_OPERATORS.GREATER_THAN}>Mayor que (&gt;)</option>
                  <option value={RULE_OPERATORS.LESS_THAN}>Menor que (&lt;)</option>
                </select>

                <input
                  type="text"
                  className="glass-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Ej. uber,taxi,cabify"
                  required
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Acciones a Ejecutar (ENTONCES...)
              </label>
              <div className="rule-action-builder">
                <select
                  className="glass-input"
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  style={{ padding: '0.5rem' }}
                >
                  <option value="">(No cambiar categoría)</option>
                  {availableCategories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  className="glass-input"
                  value={targetSubCategory}
                  onChange={(e) => setTargetSubCategory(e.target.value)}
                  placeholder="Subcategoría (opcional)"
                  style={{ padding: '0.5rem' }}
                />

                <input
                  type="text"
                  className="glass-input"
                  value={targetTags}
                  onChange={(e) => setTargetTags(e.target.value)}
                  placeholder="Etiquetas (Ej. #Fijo, #Movilidad)"
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="glass-pill"
                onClick={() => setActiveTab('list')}
                style={{ padding: '0.6rem 1.25rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="glass-pill emerald"
                style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Guardar y Activar Regla
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
