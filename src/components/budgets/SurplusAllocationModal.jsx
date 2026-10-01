import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import {
  SURPLUS_PRESETS,
  calculateAvailableSurplus,
  computeSurplusSplits,
  generateSurplusTransferPayloads,
} from '../../services/surplusAllocationEngine';
import { Modal } from '../common';
import './SurplusAllocationModal.css';

export default function SurplusAllocationModal({ isOpen, onClose }) {
  const { budgets, transactions, accounts, addTransaction } = useAccounts();
  const toast = useToast();

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [selectedPresetKey, setSelectedPresetKey] = useState('FIRE_GROWTH');

  // Account routing
  const [sourceAccountId, setSourceAccountId] = useState(() => accounts[0]?.id || '');
  const [investAccountId, setInvestAccountId] = useState(() => {
    const inv = accounts.find(a => a.category === 'INVESTMENT' || a.name.toLowerCase().includes('inversión'));
    return inv ? inv.id : accounts[0]?.id || '';
  });
  const [emergencyAccountId, setEmergencyAccountId] = useState(() => {
    const emg = accounts.find(a => a.category === 'CASH' || a.category === 'BANK');
    return emg ? emg.id : accounts[0]?.id || '';
  });

  // Calculate surplus
  const surplusData = useMemo(() => {
    return calculateAvailableSurplus(budgets, transactions, selectedMonth);
  }, [budgets, transactions, selectedMonth]);

  // Splits State
  const [customSplits, setCustomSplits] = useState(SURPLUS_PRESETS.FIRE_GROWTH.splits);

  const handleSelectPreset = (presetKey) => {
    setSelectedPresetKey(presetKey);
    if (presetKey !== 'CUSTOM' && SURPLUS_PRESETS[presetKey]) {
      setCustomSplits(SURPLUS_PRESETS[presetKey].splits);
    }
  };

  const handlePercentageChange = (idx, newPercentage) => {
    setSelectedPresetKey('CUSTOM');
    const updated = customSplits.map((s, i) =>
      i === idx ? { ...s, percentage: Number(newPercentage) } : s
    );
    setCustomSplits(updated);
  };

  const computedSplits = useMemo(() => {
    return computeSurplusSplits(surplusData.totalSurplus, customSplits);
  }, [surplusData.totalSurplus, customSplits]);

  const totalPercentage = useMemo(() => {
    return customSplits.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
  }, [customSplits]);

  const handleExecuteAllocation = async () => {
    if (surplusData.totalSurplus <= 0) {
      toast?.warning('No hay excedentes presupuestarios positivos para asignar en este período.');
      return;
    }
    if (totalPercentage !== 100) {
      toast?.warning(`La suma de los porcentajes debe ser exactamente 100% (actual: ${totalPercentage}%).`);
      return;
    }
    if (!sourceAccountId) {
      toast?.warning('Por favor selecciona una cuenta origen.');
      return;
    }

    try {
      const targetMap = {
        INVESTMENT: investAccountId,
        EMERGENCY: emergencyAccountId,
        DEFAULT: sourceAccountId,
      };

      const payloads = generateSurplusTransferPayloads(computedSplits, sourceAccountId, targetMap);

      for (const p of payloads) {
        await addTransaction(p);
      }

      toast?.success(
        `🎉 ¡Excedente de ${formatCurrency(surplusData.totalSurplus)} asignado exitosamente a tus metas de inversión y ahorro!`
      );
      onClose();
    } catch (err) {
      toast?.error(err.message || 'Error al ejecutar la asignación del excedente.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignador Interactivo de Excedentes Presupuestarios">
      <div className="surplus-modal-container">
        {/* Surplus Hero Banner */}
        <div className="surplus-hero-banner">
          <div className="surplus-hero-title">
            <span style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Superávit Presupuestario Acumulado ({selectedMonth})
            </span>
            <span className="surplus-hero-value">{formatCurrency(surplusData.totalSurplus)}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Fondos no gastados en {surplusData.surplusEnvelopes.length} sobres con ahorro positivo.
            </span>
          </div>

          <div>
            <input
              type="month"
              className="glass-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || currentMonthKey)}
              style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
            />
          </div>
        </div>

        {/* Strategy Presets */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Estrategia de Destino de Excedentes:
          </label>
          <div className="surplus-presets-row">
            {Object.values(SURPLUS_PRESETS).map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`surplus-preset-btn ${selectedPresetKey === preset.id ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset.id)}
              >
                <div className="surplus-preset-head">
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </div>
                <span className="surplus-preset-desc">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Percentage Sliders & Targets */}
        <div className="surplus-targets-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              🎯 Distribución de Fondos
            </span>
            <span style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: totalPercentage === 100 ? 'var(--emerald-400)' : '#f87171'
            }}>
              Total: {totalPercentage}% {totalPercentage !== 100 && '(Debe sumar 100%)'}
            </span>
          </div>

          {computedSplits.map((split, idx) => (
            <div key={idx} className="surplus-target-row">
              <div className="surplus-target-header">
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{split.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{split.percentage}%</span>
              </div>
              <div className="surplus-target-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="surplus-slider"
                  value={split.percentage}
                  onChange={(e) => handlePercentageChange(idx, e.target.value)}
                />
                <span className="surplus-target-amount">{formatCurrency(split.amount)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Account Routing Selection */}
        <div className="surplus-accounts-grid">
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Cuenta Origen del Excedente:
            </label>
            <select
              className="glass-input"
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Cuenta Destino de Inversión:
            </label>
            <select
              className="glass-input"
              value={investAccountId}
              onChange={(e) => setInvestAccountId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Actions */}
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
            onClick={handleExecuteAllocation}
            disabled={surplusData.totalSurplus <= 0 || totalPercentage !== 100}
            style={{
              padding: '0.6rem 1.5rem',
              cursor: surplusData.totalSurplus > 0 && totalPercentage === 100 ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              opacity: surplusData.totalSurplus > 0 && totalPercentage === 100 ? 1 : 0.5
            }}
          >
            ⚡ Ejecutar Asignación de Excedente
          </button>
        </div>
      </div>
    </Modal>
  );
}
