import React from 'react';
import { Modal, Button } from '../common';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import './RecycleBinModal.css';

export default function RecycleBinModal({ isOpen, onClose }) {
  const { deletedTransactions, restoreTransaction, purgeDeletedTransactions } = useAccounts();
  const toast = useToast();

  const handleRestore = async (txId, concept) => {
    try {
      await restoreTransaction(txId);
      toast?.success(`Transacción "${concept}" restaurada al Libro Mayor.`, 'Asiento Restaurado');
    } catch (err) {
      toast?.error(`Error al restaurar: ${err.message}`);
    }
  };

  const handleRestoreAll = async () => {
    if (deletedTransactions.length === 0) return;
    try {
      for (const tx of deletedTransactions) {
        await restoreTransaction(tx.id);
      }
      toast?.success('Todas las transacciones han sido restauradas.', 'Papelera Vaciada');
    } catch (err) {
      toast?.error(`Error al restaurar lote: ${err.message}`);
    }
  };

  const handlePurgeAll = async () => {
    if (deletedTransactions.length === 0) return;
    if (window.confirm('¿Deseas purgar permanentemente todos los registros de la papelera? Esta acción no se puede deshacer.')) {
      try {
        await purgeDeletedTransactions();
        toast?.info('Registros purgados definitivamente de la memoria cifrada.');
      } catch (err) {
        toast?.error(`Error al purgar: ${err.message}`);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Papelera de Reciclaje & Auditoría"
      subtitle="Recuperación de asientos contables y trazabilidad de eliminaciones"
      maxWidth="720px"
    >
      <div className="recycle-bin-body">
        {/* Header Actions */}
        <div className="recycle-bin-toolbar">
          <span className="recycle-count-text">
            {deletedTransactions.length} {deletedTransactions.length === 1 ? 'registro en papelera' : 'registros en papelera'}
          </span>

          {deletedTransactions.length > 0 && (
            <div className="recycle-toolbar-actions">
              <Button variant="ghost" size="sm" onClick={handleRestoreAll}>
                ↺ Restaurar Todo
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePurgeAll} style={{ color: 'var(--crimson-accent)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                🗑️ Vaciar Definitivamente
              </Button>
            </div>
          )}
        </div>

        {/* Table or Empty State */}
        {deletedTransactions.length === 0 ? (
          <div className="recycle-empty-box">
            <span className="recycle-empty-icon">🍃</span>
            <p className="recycle-empty-title">La papelera de reciclaje está vacía</p>
            <p className="recycle-empty-sub">
              Los asientos contables eliminados se resguardan aquí temporalmente antes de su purga definitiva.
            </p>
          </div>
        ) : (
          <div className="recycle-table-wrap">
            <table className="recycle-table">
              <thead>
                <tr>
                  <th>Fecha Original</th>
                  <th>Concepto</th>
                  <th>Motivo de Baja</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {deletedTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="num-mono" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      {tx.date}
                    </td>
                    <td style={{ fontWeight: 600 }}>{tx.concept}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {tx.deletionReason || 'Eliminación manual'}
                    </td>
                    <td className="num-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="recycle-restore-btn"
                        onClick={() => handleRestore(tx.id, tx.concept)}
                        title="Restaurar al Libro Mayor"
                      >
                        ↺ Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="recycle-footer">
          <Button variant="primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
