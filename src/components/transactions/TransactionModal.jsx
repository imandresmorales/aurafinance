import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, Button, TagPicker } from '../common';
import { CategorySelector } from '../categories';
import ReceiptUploader from './ReceiptUploader';
import LocationPicker from './LocationPicker';
import ReceiptModal from './ReceiptModal';
import { useAccounts, useToast } from '../../hooks';
import { TRANSACTION_TYPES, FINANCIAL_CATEGORIES, suggestCategory, checkBudgetImpact } from '../../services';
import './TransactionModal.css';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 250, 500];

export default function TransactionModal({ isOpen, onClose, defaultType = TRANSACTION_TYPES.EXPENSE }) {
  const { accounts, budgets, transactions, addTransaction } = useAccounts();
  const toast = useToast();

  const [type, setType] = useState(defaultType);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [category, setCategory] = useState('Alimentación');
  const [subCategory, setSubCategory] = useState('Supermercado');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [location, setLocation] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [categorySuggestion, setCategorySuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Proactive Budget Impact Calculation
  const budgetImpact = useMemo(() => {
    if (type !== TRANSACTION_TYPES.EXPENSE) return null;
    return checkBudgetImpact(budgets || [], transactions || [], {
      category,
      amount: parseFloat(amount) || 0,
      date,
    });
  }, [type, budgets, transactions, category, amount, date]);

  // Set default accounts when modal opens
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      setType(defaultType);
      setConcept('');
      setAmount('');
      setFee('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedTags([]);
      setReceipt(null);
      setLocation(null);
      setPreviewReceipt(null);

      const primaryAsset = accounts.find((a) => a.type === 'ASSET') || accounts[0];
      const secondaryAsset = accounts.find((a) => a.id !== primaryAsset?.id) || accounts[0];

      setSourceAccountId(primaryAsset?.id || '');
      setDestinationAccountId(secondaryAsset?.id || primaryAsset?.id || '');

      const initialCat = FINANCIAL_CATEGORIES[0];
      setCategory(initialCat.name);
      setSubCategory(initialCat.subCategories[0] || '');
    }
  }, [isOpen, accounts, defaultType]);

  const handleQuickAddAmount = (addVal) => {
    const currentVal = parseFloat(amount) || 0;
    setAmount((currentVal + addVal).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast?.error('Por favor introduce un monto válido mayor a cero.');
      return;
    }

    if (!concept.trim()) {
      toast?.error('Por favor introduce un concepto o descripción para el movimiento.');
      return;
    }

    try {
      setIsLoading(true);

      const parsedFee = parseFloat(fee) || 0;

      const txPayload = {
        type,
        concept: concept.trim(),
        amount: parsedAmount,
        fee: parsedFee,
        feeAmount: parsedFee,
        date,
        category,
        subCategory: subCategory || undefined,
        sourceAccountId: type === TRANSACTION_TYPES.INCOME ? undefined : sourceAccountId,
        destinationAccountId: type === TRANSACTION_TYPES.EXPENSE ? undefined : destinationAccountId,
        tags: selectedTags,
        receipt: receipt || undefined,
        location: location || undefined,
      };

      await addTransaction(txPayload);
      toast?.success('Movimiento contable asentado en la bóveda con éxito.', 'Transacción Registrada');
      onClose();
    } catch (err) {
      toast?.error(`Error al registrar transacción: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Captura Rápida de Transacción"
        subtitle="Asiento de partida doble en Libro Mayor cifrado"
        maxWidth="620px"
      >
        <form onSubmit={handleSubmit} className="transaction-form-body">
          {/* Type Selector Pills */}
          <div className="tx-type-selector-pills" role="radiogroup" aria-label="Tipo de Transacción">
            <button
              type="button"
              className={`tx-type-pill ${type === TRANSACTION_TYPES.EXPENSE ? 'active expense' : ''}`}
              onClick={() => setType(TRANSACTION_TYPES.EXPENSE)}
            >
              📉 Gasto
            </button>
            <button
              type="button"
              className={`tx-type-pill ${type === TRANSACTION_TYPES.INCOME ? 'active income' : ''}`}
              onClick={() => setType(TRANSACTION_TYPES.INCOME)}
            >
              📈 Ingreso
            </button>
            <button
              type="button"
              className={`tx-type-pill ${type === TRANSACTION_TYPES.TRANSFER ? 'active transfer' : ''}`}
              onClick={() => setType(TRANSACTION_TYPES.TRANSFER)}
            >
              ⇄ Transferencia
            </button>
          </div>

          {/* Amount Input & Quick Chips */}
          <div className="amount-capture-block">
            <Input
              label="Monto:"
              type="number"
              step="any"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              prefix="$"
              className="big-amount-input"
            />

            <div className="quick-amount-chips">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  className="quick-chip-btn num-mono"
                  onClick={() => handleQuickAddAmount(val)}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Fee Field for Transfers */}
          {type === TRANSACTION_TYPES.TRANSFER && (
            <Input
              label="Comisión Bancaria / Fee (Opcional):"
              type="number"
              step="any"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0.00"
              prefix="$"
            />
          )}

          <Input
            label="Concepto / Descripción:"
            required
            value={concept}
            onChange={(e) => {
              const val = e.target.value;
              setConcept(val);
              const suggestion = suggestCategory(val);
              setCategorySuggestion(suggestion);
              if (suggestion && type !== TRANSACTION_TYPES.TRANSFER) {
                setCategory(suggestion.category);
                if (suggestion.subCategory) {
                  setSubCategory(suggestion.subCategory);
                }
              }
            }}
            placeholder="Ej. Supermercado semanal / Factura cliente / Uber"
          />

          {categorySuggestion && type !== TRANSACTION_TYPES.TRANSFER && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: 'var(--font-size-2xs)',
                color: 'var(--color-primary-light)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.65rem',
                margin: '-0.25rem 0 0.5rem 0',
              }}
            >
              <span>{categorySuggestion.icon} Auto-detectado:</span>
              <strong>{categorySuggestion.category}</strong>
              {categorySuggestion.subCategory && <span>&rsaquo; {categorySuggestion.subCategory}</span>}
              <span className="glass-pill emerald" style={{ fontSize: '9px', padding: '1px 5px', marginLeft: 'auto' }}>
                {Math.round(categorySuggestion.confidence * 100)}% certeza
              </span>
            </div>
          )}

          {/* Account Selector Row */}
          <div className="tx-form-row">
            {type !== TRANSACTION_TYPES.INCOME && (
              <div className="tx-field-col">
                <label className="input-label" htmlFor="source-acc">Cuenta Origen:</label>
                <select
                  id="source-acc"
                  className="tx-select-control"
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type !== TRANSACTION_TYPES.EXPENSE && (
              <div className="tx-field-col">
                <label className="input-label" htmlFor="dest-acc">Cuenta Destino:</label>
                <select
                  id="dest-acc"
                  className="tx-select-control"
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="tx-field-col">
              <label className="input-label" htmlFor="tx-date">Fecha:</label>
              <input
                id="tx-date"
                type="date"
                className="tx-select-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Intelligent Hierarchical Category Selector */}
          <div>
            <label className="input-label" style={{ marginBottom: '0.4rem' }}>
              Categoría & Subcategoría:
            </label>
            <CategorySelector
              selectedCategory={category}
              selectedSubCategory={subCategory}
              onSelectCategory={setCategory}
              onSelectSubCategory={setSubCategory}
              type={type}
            />

            {/* Proactive Budget Overflow Alert */}
            {budgetImpact && budgetImpact.warningLevel !== 'NONE' && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-2xs)',
                  marginTop: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: budgetImpact.warningLevel === 'OVERFLOW' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${budgetImpact.warningLevel === 'OVERFLOW' ? 'rgba(244, 63, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                  color: budgetImpact.warningLevel === 'OVERFLOW' ? '#fca5a5' : '#fcd34d',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{budgetImpact.warningLevel === 'OVERFLOW' ? '🔥' : '⚠️'}</span>
                <div>
                  <strong>{budgetImpact.warningLevel === 'OVERFLOW' ? 'Alerta de Límite Superado' : 'Aviso Presupuestario'}: </strong>
                  <span>{budgetImpact.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Tagging Contextual Engine */}
          <div>
            <label className="input-label" style={{ marginBottom: '0.4rem' }}>
              Etiquetas contextuales (#Tags):
            </label>
            <TagPicker
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

          {/* Attachments & Geolocation */}
          <div className="tx-attachments-grid">
            <div>
              <label className="input-label" style={{ marginBottom: '0.4rem' }}>
                Comprobante / Ticket:
              </label>
              <ReceiptUploader
                receipt={receipt}
                onChange={setReceipt}
                onPreview={setPreviewReceipt}
              />
            </div>

            <div>
              <label className="input-label" style={{ marginBottom: '0.4rem' }}>
                Geolocalización / Lugar:
              </label>
              <LocationPicker
                location={location}
                onChange={setLocation}
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="tx-modal-actions">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Asentar Movimiento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Full-view Receipt Preview Lightbox */}
      <ReceiptModal
        isOpen={!!previewReceipt}
        onClose={() => setPreviewReceipt(null)}
        receipt={previewReceipt}
      />
    </>
  );
}
