import React, { useState, useEffect } from 'react';
import { Modal, Input } from '../common';
import { useAccounts, useToast } from '../../hooks';
import { reallocateEnvelopeFunds, calculateEnvelopeExecution } from '../../services';
import { formatCurrency } from '../../utils';
import './EnvelopeReallocatorModal.css';

export default function EnvelopeReallocatorModal({ isOpen, onClose }) {
  const { budgets, transactions, setBudgets } = useAccounts();
  const toast = useToast();

  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');

  // Default envelope selections
  useEffect(() => {
    if (isOpen && budgets.length >= 2) {
      if (!sourceId || !budgets.find((b) => b.id === sourceId)) {
        setSourceId(budgets[0].id);
      }
      if (!targetId || !budgets.find((b) => b.id === targetId)) {
        setTargetId(budgets[1].id);
      }
      setAmount('');
    }
  }, [isOpen, budgets, sourceId, targetId]);

  const { envelopes } = React.useMemo(() => {
    return calculateEnvelopeExecution(budgets, transactions);
  }, [budgets, transactions]);

  const sourceEnv = envelopes.find((e) => e.id === sourceId);
  const targetEnv = envelopes.find((e) => e.id === targetId);

  const handleSwap = () => {
    setSourceId(targetId);
    setTargetId(sourceId);
  };

  const handlePercentagePreset = (pct) => {
    if (!sourceEnv || sourceEnv.allocated <= 0) return;
    const computed = (sourceEnv.allocated * pct).toFixed(2);
    setAmount(computed);
  };

  const handleExecuteReallocation = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!sourceId || !targetId) {
      toast?.warning('Selecciona los sobres de origen y destino.');
      return;
    }

    if (sourceId === targetId) {
      toast?.warning('El sobre origen y destino deben ser diferentes.');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      toast?.warning('Introduce un monto válido mayor a cero.');
      return;
    }

    if (numAmount > (sourceEnv?.allocated || 0)) {
      toast?.warning(`El monto supera la asignación disponible en "${sourceEnv?.name}".`);
      return;
    }

    try {
      const updatedEnvelopes = reallocateEnvelopeFunds(budgets, sourceId, targetId, numAmount);
      await setBudgets(updatedEnvelopes);
      toast?.success(
        `Reasignados ${formatCurrency(numAmount, 'USD')} de "${sourceEnv.name}" hacia "${targetEnv.name}".`,
        'Reasignación Exitosa'
      );
      onClose();
    } catch (err) {
      toast?.error(err.message || 'Error al reasignar fondos.');
    }
  };

  if (budgets.length < 2) {
    return null;
  }

  const numAmount = parseFloat(amount) || 0;
  const newSourceAlloc = Math.max(0, (sourceEnv?.allocated || 0) - numAmount);
  const newTargetAlloc = (targetEnv?.allocated || 0) + numAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reasignación Equilibrada de Sobres (Base Cero)"
      subtitle="Traspasa presupuesto disponible entre categorías sin alterar el balance total"
      maxWidth="650px"
    >
      <form onSubmit={handleExecuteReallocation} className="reallocator-modal-form">
        <div className="reallocator-grid">
          {/* Source Envelope */}
          <div className="reallocator-card-picker">
            <label className="reallocator-label">Sobre Donante (Origen)</label>
            <select
              className="reallocator-select"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {envelopes.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.icon} {env.name} (Límite: {formatCurrency(env.allocated, 'USD')})
                </option>
              ))}
            </select>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-secondary)' }}>
              Disponible: <strong className="num-mono" style={{ color: 'var(--color-primary-light)' }}>{formatCurrency(sourceEnv?.remaining || 0, 'USD')}</strong>
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            className="reallocator-swap-btn"
            onClick={handleSwap}
            title="Invertir origen y destino"
          >
            ⇄
          </button>

          {/* Destination Envelope */}
          <div className="reallocator-card-picker">
            <label className="reallocator-label">Sobre Receptor (Destino)</label>
            <select
              className="reallocator-select"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {envelopes.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.icon} {env.name} (Límite: {formatCurrency(env.allocated, 'USD')})
                </option>
              ))}
            </select>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-secondary)' }}>
              Disponible: <strong className="num-mono" style={{ color: (targetEnv?.remaining || 0) < 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{formatCurrency(targetEnv?.remaining || 0, 'USD')}</strong>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label="Monto a Reasignar ($):"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="num-mono"
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="glass-pill" onClick={() => handlePercentagePreset(0.25)} style={{ fontSize: '11px', cursor: 'pointer' }}>
              25%
            </button>
            <button type="button" className="glass-pill" onClick={() => handlePercentagePreset(0.50)} style={{ fontSize: '11px', cursor: 'pointer' }}>
              50%
            </button>
            <button type="button" className="glass-pill" onClick={() => handlePercentagePreset(1.0)} style={{ fontSize: '11px', cursor: 'pointer' }}>
              Máx Asignado ({formatCurrency(sourceEnv?.allocated || 0, 'USD')})
            </button>
          </div>
        </div>

        {/* Live Simulation Preview */}
        {numAmount > 0 && sourceEnv && targetEnv && (
          <div className="reallocator-preview-box">
            <div>
              <span>{sourceEnv.name}:</span>{' '}
              <strong className="num-mono">{formatCurrency(sourceEnv.allocated, 'USD')} ➔ {formatCurrency(newSourceAlloc, 'USD')}</strong>
            </div>
            <div>
              <span>{targetEnv.name}:</span>{' '}
              <strong className="num-mono text-gradient-emerald">{formatCurrency(targetEnv.allocated, 'USD')} ➔ {formatCurrency(newTargetAlloc, 'USD')}</strong>
            </div>
          </div>
        )}

        <div className="reallocator-actions">
          <button type="button" className="glass-pill" onClick={onClose} style={{ cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            type="submit"
            className="glass-pill emerald"
            disabled={!numAmount || sourceId === targetId}
            style={{ cursor: 'pointer', fontWeight: 600 }}
          >
            ⚡ Confirmar Reasignación
          </button>
        </div>
      </form>
    </Modal>
  );
}
