import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import { TRANSACTION_TYPES } from '../../services';
import './WalletManager.css';

const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export default function WalletManager() {
  const { accounts, balances, addTransaction } = useAccounts();
  const toast = useToast();

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [concept, setConcept] = useState('Traspaso de fondos entre billeteras');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Asset accounts with positive balance preferred as source
  const assetAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.type === 'ASSET');
  }, [accounts]);

  // Set default accounts if not set
  React.useEffect(() => {
    if (accounts.length >= 2) {
      if (!sourceAccountId) setSourceAccountId(accounts[0].id);
      if (!destAccountId) setDestAccountId(accounts[1].id);
    } else if (accounts.length === 1) {
      if (!sourceAccountId) setSourceAccountId(accounts[0].id);
    }
  }, [accounts, sourceAccountId, destAccountId]);

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const destAccount = accounts.find((a) => a.id === destAccountId);

  const sourceBalance = sourceAccount ? (balances[sourceAccount.id] ?? sourceAccount.initialBalance ?? 0) : 0;
  const destBalance = destAccount ? (balances[destAccount.id] ?? destAccount.initialBalance ?? 0) : 0;

  // Swap Source and Destination
  const handleSwapAccounts = () => {
    setSourceAccountId(destAccountId);
    setDestAccountId(sourceAccountId);
  };

  // Quick percentage selection
  const handlePresetPercentage = (pct) => {
    if (sourceBalance <= 0) return;
    const computed = (sourceBalance * pct).toFixed(2);
    setAmount(computed);
  };

  // Distribution calculations for asset accounts
  const totalAssets = useMemo(() => {
    return assetAccounts.reduce((sum, acc) => {
      const bal = Math.max(0, balances[acc.id] ?? acc.initialBalance ?? 0);
      return sum + bal;
    }, 0);
  }, [assetAccounts, balances]);

  const allocations = useMemo(() => {
    if (totalAssets === 0) return [];
    return assetAccounts.map((acc, index) => {
      const bal = Math.max(0, balances[acc.id] ?? acc.initialBalance ?? 0);
      const percentage = totalAssets > 0 ? (bal / totalAssets) * 100 : 0;
      return {
        id: acc.id,
        name: acc.name,
        currency: acc.currency,
        balance: bal,
        percentage: percentage.toFixed(1),
        color: PALETTE[index % PALETTE.length],
      };
    });
  }, [assetAccounts, balances, totalAssets]);

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const numFee = parseFloat(fee) || 0;

    if (!sourceAccountId || !destAccountId) {
      toast?.warning('Selecciona la cuenta de origen y de destino.');
      return;
    }

    if (sourceAccountId === destAccountId) {
      toast?.warning('La cuenta de origen y destino no pueden ser la misma.');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      toast?.warning('Ingresa un monto válido mayor a cero.');
      return;
    }

    if (numAmount + numFee > sourceBalance && sourceAccount?.type === 'ASSET') {
      toast?.warning('El monto supera los fondos disponibles en la cuenta origen.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type: TRANSACTION_TYPES.TRANSFER,
        sourceAccountId,
        destinationAccountId: destAccountId,
        amount: numAmount,
        fee: numFee,
        feeAmount: numFee,
        concept: concept.trim() || 'Traspaso interno',
        category: 'Traspaso Interno',
        date: new Date().toISOString().split('T')[0],
      });

      toast?.success(
        `Traspasados ${formatCurrency(numAmount, sourceAccount.currency)} de "${sourceAccount.name}" a "${destAccount.name}".`,
        'Transferencia Exitosa'
      );

      setAmount('');
      setFee('');
    } catch (err) {
      toast?.error(err.message || 'Error al ejecutar la transferencia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accounts.length < 2) {
    return null;
  }

  return (
    <div className="wallet-manager-container">
      <div className="wallet-manager-rebalance-card">
        <div className="wallet-manager-header">
          <div className="wallet-manager-title">
            <span>⚡ Rebalanceo Rápido & Traspasos Internos</span>
          </div>
          <span className="glass-pill emerald" style={{ fontSize: 'var(--font-size-2xs)' }}>
            Partida Doble Instantánea
          </span>
        </div>

        <form onSubmit={handleExecuteTransfer}>
          <div className="rebalance-form-grid">
            {/* Source Account */}
            <div className="rebalance-select-group">
              <label className="rebalance-label">Cuenta Origen (Emisora)</label>
              <select
                className="rebalance-select"
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                aria-label="Seleccionar cuenta origen"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency}) — Saldo: {formatCurrency(balances[acc.id] ?? acc.initialBalance ?? 0, acc.currency)}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Swap Button */}
            <button
              type="button"
              className="rebalance-swap-btn"
              onClick={handleSwapAccounts}
              title="Invertir origen y destino"
              aria-label="Intercambiar cuentas origen y destino"
            >
              ⇄
            </button>

            {/* Destination Account */}
            <div className="rebalance-select-group">
              <label className="rebalance-label">Cuenta Destino (Receptora)</label>
              <select
                className="rebalance-select"
                value={destAccountId}
                onChange={(e) => setDestAccountId(e.target.value)}
                aria-label="Seleccionar cuenta destino"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency}) — Saldo: {formatCurrency(balances[acc.id] ?? acc.initialBalance ?? 0, acc.currency)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rebalance-amount-row">
            <div className="rebalance-select-group">
              <label className="rebalance-label">Monto a Transferir</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="rebalance-select num-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <div className="rebalance-presets">
                <button type="button" className="preset-chip" onClick={() => handlePresetPercentage(0.25)}>
                  25%
                </button>
                <button type="button" className="preset-chip" onClick={() => handlePresetPercentage(0.50)}>
                  50%
                </button>
                <button type="button" className="preset-chip" onClick={() => handlePresetPercentage(0.75)}>
                  75%
                </button>
                <button type="button" className="preset-chip" onClick={() => handlePresetPercentage(1.0)}>
                  Máx (100%)
                </button>
              </div>
            </div>

            <div className="rebalance-select-group">
              <label className="rebalance-label">Comisión / Tarifa</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00 (Opcional)"
                className="rebalance-select num-mono"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="rebalance-submit-btn"
              disabled={isSubmitting || !amount || sourceAccountId === destAccountId}
            >
              {isSubmitting ? 'Procesando...' : '⚡ Transferir Fondos'}
            </button>
          </div>
        </form>

        {/* Asset Distribution Bar */}
        {allocations.length > 0 && totalAssets > 0 && (
          <div className="allocation-distribution-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-2xs)', color: 'var(--text-secondary)' }}>
              <span>Distribución de Liquidez en Activos</span>
              <span className="num-mono">Total: {formatCurrency(totalAssets, 'USD')}</span>
            </div>
            <div className="allocation-bar">
              {allocations.map((item) => (
                <div
                  key={item.id}
                  className="allocation-segment"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  title={`${item.name}: ${item.percentage}% (${formatCurrency(item.balance, item.currency)})`}
                />
              ))}
            </div>
            <div className="allocation-legend">
              {allocations.map((item) => (
                <div key={item.id} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: <strong>{item.percentage}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
