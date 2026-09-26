import React, { useState, useMemo } from 'react';
import { Modal, Button, Input } from '../common';
import { useAccounts, useToast } from '../../hooks';
import { computeReconciliationSummary, applyReconciliation } from '../../services';
import { formatCurrency } from '../../utils';
import './ReconciliationModal.css';

export default function ReconciliationModal({ isOpen, onClose }) {
  const { accounts, transactions, setTransactions } = useAccounts();
  const toast = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [statementBalance, setStatementBalance] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementRef, setStatementRef] = useState('Extracto Bancario Oficial');
  const [clearedTxIds, setClearedTxIds] = useState(new Set());
  const [step, setStep] = useState(1); // 1: Config, 2: Match Table, 3: Success

  // Active Account
  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  // Reconciliation summary
  const summary = useMemo(() => {
    return computeReconciliationSummary({
      account: currentAccount,
      transactions,
      statementBalance: parseFloat(statementBalance) || 0,
      statementDate,
      clearedTxIds,
    });
  }, [currentAccount, transactions, statementBalance, statementDate, clearedTxIds]);

  const handleToggleTx = (id) => {
    const next = new Set(clearedTxIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setClearedTxIds(next);
  };

  const handleSelectAll = () => {
    if (clearedTxIds.size === summary.unreconciledTxs.length) {
      setClearedTxIds(new Set());
    } else {
      setClearedTxIds(new Set(summary.unreconciledTxs.map((t) => t.id)));
    }
  };

  const handleFinalize = async () => {
    if (!summary.isBalanced) {
      toast?.error('Existe una discrepancia contable. La diferencia debe ser exactamente 0.00 para cuadrar.');
      return;
    }

    try {
      const updatedTxs = applyReconciliation(transactions, clearedTxIds, {
        statementReference: statementRef,
        statementDate,
        statementBalance: summary.statementBalance,
      });

      await setTransactions(updatedTxs);
      setStep(3);
      toast?.success(`Conciliación de ${currentAccount.name} completada con éxito.`, 'Conciliación Exitosa');
    } catch (err) {
      toast?.error(`Error al aplicar la conciliación: ${err.message}`);
    }
  };

  const handleClose = () => {
    setStep(1);
    setClearedTxIds(new Set());
    setStatementBalance('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Conciliación Bancaria Oficial"
      subtitle="Cuadre contable y auditoría de extractos bancarios en Libro Mayor"
      maxWidth="780px"
    >
      <div className="recon-modal-body">
        {step === 1 && (
          <div className="recon-step-config">
            <div className="recon-notice-panel">
              <span className="recon-notice-icon">🏛️</span>
              <p>
                La conciliación bancaria garantiza que cada movimiento de tu extracto bancario coincida exactamente con los asientos contables en tu Libro Mayor cifrado.
              </p>
            </div>

            <div className="recon-form-grid">
              <div className="recon-field">
                <label className="input-label" htmlFor="recon-account-select">
                  Cuenta a Conciliar:
                </label>
                <select
                  id="recon-account-select"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="recon-select-input"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="recon-field">
                <label className="input-label" htmlFor="recon-statement-date">
                  Fecha de Corte del Extracto:
                </label>
                <input
                  id="recon-statement-date"
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  className="recon-select-input"
                />
              </div>

              <div className="recon-field">
                <Input
                  label="Saldo Final del Extracto ($):"
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                  prefix="$"
                />
              </div>

              <div className="recon-field">
                <Input
                  label="Referencia / N° de Extracto:"
                  placeholder="Ej. Extracto Banco Santander Septiembre"
                  value={statementRef}
                  onChange={(e) => setStatementRef(e.target.value)}
                />
              </div>
            </div>

            <div className="recon-step-actions">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!statementBalance || isNaN(parseFloat(statementBalance))}
              >
                Continuar al Cuadre ▶
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="recon-step-matching">
            {/* Realtime Reconciliation Balance Banner */}
            <div className={`recon-meter-card ${summary.isBalanced ? 'balanced' : 'unbalanced'}`}>
              <div className="recon-meter-col">
                <span className="recon-meter-label">Saldo Extracto</span>
                <span className="recon-meter-val num-mono">{formatCurrency(summary.statementBalance)}</span>
              </div>
              <div className="recon-meter-divider">−</div>
              <div className="recon-meter-col">
                <span className="recon-meter-label">Saldo Calculado</span>
                <span className="recon-meter-val num-mono">{formatCurrency(summary.clearedBalance)}</span>
              </div>
              <div className="recon-meter-divider">=</div>
              <div className="recon-meter-col">
                <span className="recon-meter-label">Diferencia</span>
                <span className={`recon-meter-val num-mono ${summary.isBalanced ? 'text-emerald' : 'text-crimson'}`}>
                  {formatCurrency(summary.difference)}
                </span>
              </div>
            </div>

            {summary.isBalanced ? (
              <div className="recon-status-alert success">
                <span>✨ ¡El saldo está perfectamente cuadrado ($0.00 de diferencia)! Puedes asentar la conciliación.</span>
              </div>
            ) : (
              <div className="recon-status-alert warning">
                <span>⚠️ Selecciona o desmarca los movimientos de la lista para hacer coincidir el extracto.</span>
              </div>
            )}

            {/* Matching Ledger Table */}
            <div className="recon-table-wrap">
              <div className="recon-table-toolbar">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Movimientos pendientes hasta {statementDate} ({summary.unreconciledTxs.length})
                </span>
                <button
                  type="button"
                  className="recon-select-all-btn"
                  onClick={handleSelectAll}
                >
                  {clearedTxIds.size === summary.unreconciledTxs.length ? 'Deseleccionar Todos' : 'Marcar Todos'}
                </button>
              </div>

              {summary.unreconciledTxs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay movimientos pendientes por conciliar en esta cuenta para la fecha seleccionada.
                </div>
              ) : (
                <table className="recon-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>✓</th>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.unreconciledTxs.map((tx) => {
                      const isCleared = clearedTxIds.has(tx.id);
                      const isIncome = tx.type === 'INCOME' || tx.destinationAccountId === currentAccount.id;

                      return (
                        <tr
                          key={tx.id}
                          className={isCleared ? 'cleared-row' : ''}
                          onClick={() => handleToggleTx(tx.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isCleared}
                              onChange={() => handleToggleTx(tx.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="recon-checkbox"
                            />
                          </td>
                          <td className="num-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                            {tx.date}
                          </td>
                          <td style={{ fontWeight: 600 }}>{tx.concept}</td>
                          <td>
                            <span className="glass-pill" style={{ fontSize: '0.68rem' }}>
                              {tx.category}
                            </span>
                          </td>
                          <td
                            className="num-mono"
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
                            }}
                          >
                            {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="recon-step-actions">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ◀ Modificar Datos
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalize}
                disabled={!summary.isBalanced}
              >
                🔒 Finalizar y Sellar Conciliación
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="recon-step-success">
            <div className="recon-success-icon">📜</div>
            <h2 className="recon-success-title text-gradient-emerald">
              Conciliación Sellada y Verificada
            </h2>
            <p className="recon-success-desc">
              Se han conciliado exitosamente <strong>{clearedTxIds.size} transacciones</strong> para la cuenta <strong>{currentAccount.name}</strong> con saldo final de <strong>{formatCurrency(summary.statementBalance)}</strong>.
            </p>

            <div className="recon-cert-box">
              <div className="recon-cert-item">
                <span>Cuenta:</span>
                <strong>{currentAccount.name}</strong>
              </div>
              <div className="recon-cert-item">
                <span>Fecha de Corte:</span>
                <strong className="num-mono">{statementDate}</strong>
              </div>
              <div className="recon-cert-item">
                <span>Referencia:</span>
                <strong>{statementRef}</strong>
              </div>
              <div className="recon-cert-item">
                <span>Estado de Auditoría:</span>
                <strong style={{ color: 'var(--emerald-primary)' }}>100% Cuadrado (0.00 Diff)</strong>
              </div>
            </div>

            <Button variant="primary" onClick={handleClose} style={{ width: '100%', marginTop: '1.5rem' }}>
              Aceptar y Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
