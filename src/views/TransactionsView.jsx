import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../hooks';
import { formatCurrency, exportTransactionsToCSV, fuzzyFilter } from '../utils';
import { TransactionModal, ReceiptModal, TransactionFilters, DATE_PRESETS, HighlightText, ReconciliationModal } from '../components';
import './TransactionsView.css';

const INITIAL_FILTERS = {
  searchQuery: '',
  datePreset: DATE_PRESETS.ALL,
  startDate: '',
  endDate: '',
  accountId: '',
  category: '',
  tag: '',
  minAmount: '',
  maxAmount: '',
  onlyWithReceipt: false,
  onlyWithLocation: false,
};

export default function TransactionsView() {
  const { transactions, accounts, deleteTransaction, setTransactions } = useAccounts();
  const toast = useToast();

  const [filterType, setFilterType] = useState('ALL');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Multi-Selection State
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());

  // Sorting State
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getAccountName = (accountId) => {
    const found = accounts.find((a) => a.id === accountId);
    return found ? found.name : 'Bóveda Cifrada';
  };

  // Active filter count calculator
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.datePreset !== DATE_PRESETS.ALL || filters.startDate || filters.endDate) count++;
    if (filters.accountId) count++;
    if (filters.category) count++;
    if (filters.tag) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.onlyWithReceipt) count++;
    if (filters.onlyWithLocation) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  // Advanced Filtering Engine
  const filteredTransactions = useMemo(() => {
    let result = (transactions || []).filter((tx) => {
      // 1. Flow type
      if (filterType !== 'ALL' && tx.type !== filterType) {
        return false;
      }

      // 2. Date range
      if (filters.startDate && tx.date < filters.startDate) return false;
      if (filters.endDate && tx.date > filters.endDate) return false;

      // 3. Account
      if (filters.accountId) {
        if (tx.sourceAccountId !== filters.accountId && tx.destinationAccountId !== filters.accountId) {
          return false;
        }
      }

      // 4. Category
      if (filters.category && tx.category !== filters.category) {
        return false;
      }

      // 5. Tag
      if (filters.tag && (!tx.tags || !tx.tags.includes(filters.tag))) {
        return false;
      }

      // 6. Amount Range
      if (filters.minAmount && (tx.amount || 0) < Number(filters.minAmount)) return false;
      if (filters.maxAmount && (tx.amount || 0) > Number(filters.maxAmount)) return false;

      // 7. With Receipt only
      if (filters.onlyWithReceipt && !tx.receipt) return false;

      // 8. With Location only
      if (filters.onlyWithLocation && !tx.location) return false;

      return true;
    });

    // Apply Fuzzy Search Engine across concept, category, tags, and account names
    if (filters.searchQuery && filters.searchQuery.trim()) {
      result = fuzzyFilter(result, filters.searchQuery, [
        'concept',
        'category',
        'subCategory',
        'tags',
        (tx) => getAccountName(tx.sourceAccountId),
        (tx) => getAccountName(tx.destinationAccountId),
        (tx) => tx.location?.label || '',
      ]);
    }

    return result;
  }, [transactions, filterType, filters, accounts]);

  // Sorting Engine
  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (sortField === 'concept') {
        comparison = (a.concept || '').localeCompare(b.concept || '');
      } else if (sortField === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredTransactions, sortField, sortDirection]);

  // Pagination Calculation
  const totalItems = sortedTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Multi-selection handlers
  const handleSelectAllOnPage = (e) => {
    const newSet = new Set(selectedTxIds);
    if (e.target.checked) {
      paginatedTransactions.forEach((tx) => newSet.add(tx.id));
    } else {
      paginatedTransactions.forEach((tx) => newSet.delete(tx.id));
    }
    setSelectedTxIds(newSet);
  };

  const handleToggleSelectRow = (txId) => {
    const newSet = new Set(selectedTxIds);
    if (newSet.has(txId)) {
      newSet.delete(txId);
    } else {
      newSet.add(txId);
    }
    setSelectedTxIds(newSet);
  };

  const handleClearSelection = () => {
    setSelectedTxIds(new Set());
  };

  const handleBatchDelete = async () => {
    const count = selectedTxIds.size;
    if (count === 0) return;

    if (window.confirm(`¿Estás seguro de eliminar permanentemente ${count} transacciones seleccionadas?`)) {
      try {
        await setTransactions((prev) => (prev || []).filter((t) => !selectedTxIds.has(t.id)));
        setSelectedTxIds(new Set());
        toast?.success(`Se han eliminado ${count} transacciones del Libro Mayor.`, 'Eliminación por Lote');
      } catch (err) {
        toast?.error(`Error al eliminar en lote: ${err.message}`);
      }
    }
  };

  const handleExportCSV = (onlySelected = false) => {
    const dataToExport = onlySelected
      ? transactions.filter((t) => selectedTxIds.has(t.id))
      : sortedTransactions;

    if (dataToExport.length === 0) {
      toast?.warning('No hay transacciones disponibles para exportar.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const ok = exportTransactionsToCSV(dataToExport, accounts, `aurafinance_libro_mayor_${dateStr}.csv`);
    if (ok) {
      toast?.success(`Exportadas ${dataToExport.length} transacciones en CSV.`, 'Exportación Exitosa');
    }
  };

  const isAllPageSelected =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((tx) => selectedTxIds.has(tx.id));

  return (
    <div className="view-container">
      {/* Header */}
      <header className="transactions-view-header">
        <div>
          <div className="glass-pill emerald" style={{ marginBottom: '0.75rem' }}>
            <span>Libro Mayor & Auditoría Criptográfica</span>
          </div>
          <h1 className="text-gradient-emerald">Registro de Transacciones</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Historial contable con búsqueda predictiva, filtros multicriterio, ordenamiento y exportación.
          </p>
        </div>

        <div className="tx-header-actions">
          <button
            type="button"
            className="glass-pill"
            onClick={() => setIsReconModalOpen(true)}
            title="Conciliación bancaria contra extractos"
            style={{ cursor: 'pointer' }}
          >
            🏛️ Conciliar
          </button>
          <button
            type="button"
            className="glass-pill"
            onClick={() => handleExportCSV(false)}
            title="Exportar movimientos a CSV"
            style={{ cursor: 'pointer' }}
          >
            📊 Exportar CSV
          </button>
          <button
            type="button"
            className="glass-pill emerald"
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--font-size-sm)', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nueva Transacción [N]
          </button>
        </div>
      </header>

      {/* Advanced Multi-Criteria Filter Component */}
      <TransactionFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        onReset={handleResetFilters}
        accounts={accounts}
        activeFilterCount={activeFilterCount}
      />

      {/* Floating Batch Actions Bar */}
      {selectedTxIds.size > 0 && (
        <div className="tx-batch-bar">
          <div className="tx-batch-info">
            <span>✓ {selectedTxIds.size} transacciones seleccionadas</span>
          </div>
          <div className="tx-batch-actions">
            <button
              type="button"
              className="glass-pill"
              onClick={() => handleExportCSV(true)}
              style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}
            >
              📥 Exportar Seleccionadas
            </button>
            <button
              type="button"
              className="glass-pill"
              onClick={handleBatchDelete}
              style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              🗑️ Eliminar Seleccionadas
            </button>
            <button
              type="button"
              className="glass-pill"
              onClick={handleClearSelection}
              style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}
            >
              ✕ Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Filter Quick Pills */}
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Tipo de flujo:</span>
        <button
          type="button"
          className={`glass-pill ${filterType === 'ALL' ? 'emerald' : ''}`}
          onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
          style={{ cursor: 'pointer' }}
        >
          Todas ({transactions.length})
        </button>
        <button
          type="button"
          className={`glass-pill ${filterType === 'INCOME' ? 'emerald' : ''}`}
          onClick={() => { setFilterType('INCOME'); setCurrentPage(1); }}
          style={{ cursor: 'pointer' }}
        >
          Ingresos
        </button>
        <button
          type="button"
          className={`glass-pill ${filterType === 'EXPENSE' ? 'emerald' : ''}`}
          onClick={() => { setFilterType('EXPENSE'); setCurrentPage(1); }}
          style={{ cursor: 'pointer' }}
        >
          Gastos
        </button>
        <button
          type="button"
          className={`glass-pill ${filterType === 'TRANSFER' ? 'emerald' : ''}`}
          onClick={() => { setFilterType('TRANSFER'); setCurrentPage(1); }}
          style={{ cursor: 'pointer' }}
        >
          Transferencias
        </button>
      </div>

      {/* Dynamic Data Table */}
      <div className="glass-panel tx-table-container">
        <div className="tx-table-responsive">
          {totalItems === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🍃 No se encontraron transacciones</p>
              <p style={{ fontSize: '0.85rem' }}>
                {activeFilterCount > 0
                  ? 'Prueba modificando o limpiando los filtros avanzados aplicados.'
                  : 'Pulsa el botón + Nueva Transacción o la tecla [N] para asentar tu primer movimiento.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="glass-pill emerald"
                  onClick={handleResetFilters}
                  style={{ marginTop: '1rem', cursor: 'pointer' }}
                >
                  Restablecer Filtros
                </button>
              )}
            </div>
          ) : (
            <table className="tx-data-table">
              <thead>
                <tr>
                  <th className="tx-checkbox-cell">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleSelectAllOnPage}
                      className="tx-custom-checkbox"
                      aria-label="Seleccionar todas las transacciones de esta página"
                    />
                  </th>
                  <th
                    className={`tx-sortable-th ${sortField === 'date' ? 'active-sort' : ''}`}
                    onClick={() => handleSort('date')}
                  >
                    FECHA {sortField === 'date' && <span className="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    className={`tx-sortable-th ${sortField === 'concept' ? 'active-sort' : ''}`}
                    onClick={() => handleSort('concept')}
                  >
                    CONCEPTO {sortField === 'concept' && <span className="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    className={`tx-sortable-th ${sortField === 'category' ? 'active-sort' : ''}`}
                    onClick={() => handleSort('category')}
                  >
                    CATEGORÍA {sortField === 'category' && <span className="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th>CUENTA / DESTINO</th>
                  <th
                    className={`tx-sortable-th ${sortField === 'amount' ? 'active-sort' : ''}`}
                    style={{ textAlign: 'right' }}
                    onClick={() => handleSort('amount')}
                  >
                    MONTO {sortField === 'amount' && <span className="sort-icon">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const isTransfer = tx.type === 'TRANSFER';
                  const isSelected = selectedTxIds.has(tx.id);
                  const accountLabel = isTransfer
                    ? `${getAccountName(tx.sourceAccountId)} ➔ ${getAccountName(tx.destinationAccountId)}`
                    : isIncome
                      ? getAccountName(tx.destinationAccountId)
                      : getAccountName(tx.sourceAccountId);

                  return (
                    <tr key={tx.id} className={isSelected ? 'row-selected' : ''}>
                      <td className="tx-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(tx.id)}
                          className="tx-custom-checkbox"
                          aria-label={`Seleccionar transacción ${tx.concept}`}
                        />
                      </td>
                      <td className="num-mono" style={{ color: 'var(--text-tertiary)' }}>
                        {tx.date}
                      </td>
                      <td>
                        <div className="tx-concept-cell">
                          <div className="tx-concept-main">
                            <HighlightText text={tx.concept} query={filters.searchQuery} />
                          </div>

                          <div className="tx-meta-badges">
                            {/* Receipt badge */}
                            {tx.receipt && (
                              <button
                                type="button"
                                className="tx-badge-receipt"
                                onClick={() => setPreviewReceipt(tx.receipt)}
                                title="Ver comprobante adjunto"
                              >
                                🧾 Comprobante
                              </button>
                            )}

                            {/* Location badge */}
                            {tx.location?.label && (
                              <span className="tx-badge-loc" title={tx.location.label}>
                                📍 <HighlightText text={tx.location.label} query={filters.searchQuery} />
                              </span>
                            )}

                            {/* Tags */}
                            {tx.tags && tx.tags.length > 0 && (
                              <div className="tx-tag-list">
                                {tx.tags.map((tg) => (
                                  <span key={tg} className="tx-tag-pill">
                                    <HighlightText text={tg} query={filters.searchQuery} />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="glass-pill" style={{ fontSize: 'var(--font-size-2xs)' }}>
                          {tx.category || 'General'}
                        </span>
                        {tx.subCategory && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            {tx.subCategory}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                        {accountLabel}
                      </td>
                      <td
                        className="num-mono"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isIncome ? 'var(--color-income)' : isTransfer ? 'var(--color-transfer)' : 'var(--color-expense)',
                        }}
                      >
                        <div>
                          {isIncome ? `+${formatCurrency(tx.amount)}` : isTransfer ? `⇄ ${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                        </div>
                        {isTransfer && (tx.feeAmount > 0 || tx.fee > 0) && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            +{formatCurrency(tx.feeAmount || tx.fee)} com.
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar asiento contable "${tx.concept}"?`)) {
                              deleteTransaction(tx.id);
                              toast?.info('Asiento contable eliminado de la bóveda.');
                            }
                          }}
                          style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          title="Eliminar asiento contable"
                          aria-label={`Eliminar asiento ${tx.concept}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls Footer */}
        {totalItems > 0 && (
          <div className="tx-pagination-footer">
            <div className="tx-pagination-info">
              Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalItems)} - {Math.min(currentPage * pageSize, totalItems)} de {totalItems} transacciones
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="tx-pagesize-select"
                aria-label="Transacciones por página"
              >
                <option value={10}>10 por pág.</option>
                <option value={25}>25 por pág.</option>
                <option value={50}>50 por pág.</option>
              </select>
            </div>

            <div className="tx-pagination-controls">
              <button
                type="button"
                className="tx-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ◀ Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
                    <button
                      type="button"
                      className={`tx-page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              <button
                type="button"
                className="tx-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Lightbox Modal for Receipt Attachment */}
      <ReceiptModal
        isOpen={!!previewReceipt}
        onClose={() => setPreviewReceipt(null)}
        receipt={previewReceipt}
      />

      {/* Bank Reconciliation Modal */}
      <ReconciliationModal
        isOpen={isReconModalOpen}
        onClose={() => setIsReconModalOpen(false)}
      />
    </div>
  );
}
