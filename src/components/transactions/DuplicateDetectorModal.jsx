import React, { useState, useMemo } from 'react';
import { Modal, Button } from '../common';
import { useAccounts, useToast } from '../../hooks';
import { scanLedgerAnomalies } from '../../services';
import { formatCurrency } from '../../utils';
import './DuplicateDetectorModal.css';

export default function DuplicateDetectorModal({ isOpen, onClose }) {
  const { transactions, softDeleteTransaction } = useAccounts();
  const toast = useToast();

  const [dismissedPairKeys, setDismissedPairKeys] = useState(new Set());

  // Scan anomalies reactively
  const report = useMemo(() => {
    return scanLedgerAnomalies(transactions);
  }, [transactions]);

  // Filter out dismissed pairs
  const activeDuplicateGroups = useMemo(() => {
    return report.duplicates
      .map((group) => ({
        ...group,
        candidates: group.candidates.filter(
          (c) => !dismissedPairKeys.has(`${group.primaryTx.id}:::${c.duplicateTx.id}`)
        ),
      }))
      .filter((g) => g.candidates.length > 0);
  }, [report.duplicates, dismissedPairKeys]);

  const totalActiveWarnings = activeDuplicateGroups.length + report.outliers.length;

  const handleDismissPair = (txAId, txBId) => {
    const key = `${txAId}:::${txBId}`;
    setDismissedPairKeys((prev) => new Set([...prev, key]));
    toast?.info('Alerta descartada.');
  };

  const handleDeleteDuplicate = async (duplicateTxId, concept) => {
    try {
      await softDeleteTransaction(duplicateTxId, 'Cobro o asiento duplicado');
      toast?.success(`Duplicado "${concept}" enviado a la papelera.`, 'Duplicado Eliminado');
    } catch (err) {
      toast?.error(`Error al eliminar duplicado: ${err.message}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detector Heurístico de Duplicados & Cobros Sospechosos"
      subtitle="Auditoría automática de posibles cobros dobles y consumos atípicos"
      maxWidth="780px"
    >
      <div className="detector-modal-body">
        {/* Status Header Banner */}
        <div className={`detector-status-banner ${totalActiveWarnings > 0 ? 'warning' : 'clean'}`}>
          <div className="detector-status-icon">
            {totalActiveWarnings > 0 ? '🛡️' : '✨'}
          </div>
          <div>
            <h4 className="detector-status-title">
              {totalActiveWarnings > 0
                ? `${totalActiveWarnings} advertencias detectadas en el Libro Mayor`
                : 'Libro Mayor 100% íntegro'}
            </h4>
            <p className="detector-status-desc">
              {totalActiveWarnings > 0
                ? 'Revisa los movimientos sospechosos a continuación y elimina los duplicados con un clic.'
                : 'No se encontraron cargos duplicados ni cobros dobles en tus cuentas financieras.'}
            </p>
          </div>
        </div>

        {/* Section 1: Duplicates */}
        {activeDuplicateGroups.length > 0 && (
          <div className="detector-section">
            <h4 className="detector-section-title text-gradient-gold">
              🔁 Posibles Asientos Duplicados ({activeDuplicateGroups.length})
            </h4>

            <div className="duplicates-cards-list">
              {activeDuplicateGroups.map((group) =>
                group.candidates.map((cand) => (
                  <div
                    key={`${group.primaryTx.id}-${cand.duplicateTx.id}`}
                    className="duplicate-pair-card"
                  >
                    <div className="pair-comparison-row">
                      {/* Left: Original */}
                      <div className="pair-tx-col original">
                        <span className="pair-tag">Asiento Original</span>
                        <div className="pair-concept">{group.primaryTx.concept}</div>
                        <div className="pair-meta num-mono">
                          <span>{group.primaryTx.date}</span>
                          <span className="pair-amount">{formatCurrency(group.primaryTx.amount)}</span>
                        </div>
                      </div>

                      {/* Middle: Match Badge */}
                      <div className="pair-match-badge">
                        <span className="match-confidence">{cand.confidence === 'HIGH' ? '100% Idéntico' : 'Similitud Alta'}</span>
                        <span className="match-days num-mono">{cand.daysDiff === 0 ? 'Mismo día' : `±${cand.daysDiff}d`}</span>
                      </div>

                      {/* Right: Duplicate Candidate */}
                      <div className="pair-tx-col duplicate">
                        <span className="pair-tag warning">Copia / Duplicado</span>
                        <div className="pair-concept">{cand.duplicateTx.concept}</div>
                        <div className="pair-meta num-mono">
                          <span>{cand.duplicateTx.date}</span>
                          <span className="pair-amount">{formatCurrency(cand.duplicateTx.amount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pair-actions-row">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissPair(group.primaryTx.id, cand.duplicateTx.id)}
                      >
                        Descartar Alerta
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteDuplicate(cand.duplicateTx.id, cand.duplicateTx.concept)}
                        style={{ color: 'var(--crimson-accent)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                      >
                        🗑️ Eliminar Duplicado
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section 2: Outliers */}
        {report.outliers.length > 0 && (
          <div className="detector-section">
            <h4 className="detector-section-title text-gradient-emerald">
              📈 Picos de Gasto Atípicos ({report.outliers.length})
            </h4>

            <div className="outliers-grid">
              {report.outliers.map((outlier) => (
                <div key={outlier.tx.id} className="outlier-card">
                  <div className="outlier-header">
                    <span className="outlier-cat-pill">{outlier.category}</span>
                    <span className="outlier-factor-badge">⚡ {outlier.factor}x promedio</span>
                  </div>
                  <div className="outlier-concept">{outlier.tx.concept}</div>
                  <div className="outlier-amounts-row num-mono">
                    <span className="outlier-amount">{formatCurrency(outlier.tx.amount)}</span>
                    <span className="outlier-avg">(Media cat: {formatCurrency(outlier.categoryAverage)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detector-modal-footer">
          <Button variant="primary" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
}
