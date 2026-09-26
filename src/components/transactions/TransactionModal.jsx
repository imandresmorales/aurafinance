import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, TagPicker } from '../common';
import { CategorySelector } from '../categories';
import { useAccounts, useToast } from '../../hooks';
import { TRANSACTION_TYPES, FINANCIAL_CATEGORIES } from '../../services';
import './TransactionModal.css';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 250, 500];

export default function TransactionModal({ isOpen, onClose, defaultType = TRANSACTION_TYPES.EXPENSE }) {
  const { accounts, addTransaction } = useAccounts();
  const toast = useToast();

  const [type, setType] = useState(defaultType);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [category, setCategory] = useState('Alimentación');
  const [subCategory, setSubCategory] = useState('Supermercado');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Set default accounts when modal opens
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      setType(defaultType);
      setConcept('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedTags([]);

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

      const txPayload = {
        type,
        concept: concept.trim(),
        amount: parsedAmount,
        date,
        category,
        subCategory: subCategory || undefined,
        sourceAccountId: type === TRANSACTION_TYPES.INCOME ? undefined : sourceAccountId,
        destinationAccountId: type === TRANSACTION_TYPES.EXPENSE ? undefined : destinationAccountId,
        tags: selectedTags,
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

        <Input
          label="Concepto / Descripción:"
          required
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Ej. Supermercado semanal / Factura cliente"
        />

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
  );
}
