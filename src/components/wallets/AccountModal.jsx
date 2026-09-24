import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../common';
import { ACCOUNT_TYPES } from '../../services';
import { useToast } from '../../hooks';
import './AccountModal.css';

const ACCOUNT_CATEGORIES = [
  { id: 'BANK', label: 'Cuenta Bancaria', type: ACCOUNT_TYPES.ASSET, defaultIcon: 'bank' },
  { id: 'CASH', label: 'Efectivo / Caja', type: ACCOUNT_TYPES.ASSET, defaultIcon: 'cash' },
  { id: 'INVESTMENT', label: 'Bóveda de Inversión', type: ACCOUNT_TYPES.ASSET, defaultIcon: 'investment' },
  { id: 'DIGITAL_WALLET', label: 'Billetera Digital / Fintech', type: ACCOUNT_TYPES.ASSET, defaultIcon: 'wallet' },
  { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito (Pasivo)', type: ACCOUNT_TYPES.LIABILITY, defaultIcon: 'credit-card' },
];

const COLOR_PALETTES = [
  { id: 'emerald', label: 'Esmeralda', hex: '#10b981' },
  { id: 'gold', label: 'Champagne Oro', hex: '#e2c275' },
  { id: 'cyan', label: 'Cyan Glaciar', hex: '#38bdf8' },
  { id: 'danger', label: 'Rubí / Pasivo', hex: '#f43f5e' },
  { id: 'amethyst', label: 'Amatista', hex: '#a855f7' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN', 'COP', 'ARS', 'CLP'];

export default function AccountModal({ isOpen, onClose, onSave, accountToEdit = null }) {
  const toast = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('BANK');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState('emerald');
  const [creditLimit, setCreditLimit] = useState('');
  const [apr, setApr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setCategory(accountToEdit.category || 'BANK');
      setCurrency(accountToEdit.currency || 'USD');
      setInitialBalance(accountToEdit.initialBalance?.toString() || '0');
      setColor(accountToEdit.color || 'emerald');
      setCreditLimit(accountToEdit.creditLimit?.toString() || '');
      setApr(accountToEdit.apr?.toString() || '');
    } else {
      setName('');
      setCategory('BANK');
      setCurrency('USD');
      setInitialBalance('0');
      setColor('emerald');
      setCreditLimit('');
      setApr('');
    }
  }, [accountToEdit, isOpen]);

  const selectedCatObj = ACCOUNT_CATEGORIES.find((c) => c.id === category) || ACCOUNT_CATEGORIES[0];
  const isLiability = selectedCatObj.type === ACCOUNT_TYPES.LIABILITY;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast?.error('Por favor introduce un nombre para la cuenta.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        name: name.trim(),
        category,
        type: selectedCatObj.type,
        currency,
        initialBalance: parseFloat(initialBalance) || 0,
        color: isLiability ? 'danger' : color,
        creditLimit: isLiability && creditLimit ? parseFloat(creditLimit) : undefined,
        apr: isLiability && apr ? parseFloat(apr) : undefined,
      };

      await onSave(payload, accountToEdit?.id);
      toast?.success(
        accountToEdit ? 'Cuenta actualizada con éxito.' : 'Nueva cuenta agregada a la bóveda.',
        'Operación Contable'
      );
      onClose();
    } catch (err) {
      toast?.error(`Error al guardar cuenta: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={accountToEdit ? 'Editar Cuenta Financiera' : 'Nueva Cuenta / Billetera'}
      subtitle="Configura una entidad de partida doble para el Libro Mayor"
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} className="account-modal-form">
        <Input
          label="Nombre de la Cuenta o Billetera:"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. BBVA Cuenta Nómina / Ledger Cripto"
        />

        <div className="form-row-dual">
          <div className="form-field-wrapper">
            <label className="input-label" htmlFor="acc-category">Categoría Contable:</label>
            <select
              id="acc-category"
              className="account-select-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {ACCOUNT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field-wrapper">
            <label className="input-label" htmlFor="acc-currency">Moneda:</label>
            <select
              id="acc-currency"
              className="account-select-control"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label={isLiability ? 'Saldo Pendiente / Deuda Inicial (número negativo o cero):' : 'Saldo Inicial Disponible:'}
          type="number"
          step="any"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          prefix={currency === 'EUR' ? '€' : '$'}
          helperText="Se registrará en el asiento de apertura del Libro Mayor."
        />

        {isLiability && (
          <div className="form-row-dual">
            <Input
              label="Límite de Crédito:"
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="Ej. 5000"
            />
            <Input
              label="Tasa de Interés Anual (APR %):"
              type="number"
              step="0.1"
              value={apr}
              onChange={(e) => setApr(e.target.value)}
              placeholder="Ej. 18.5"
              suffix="%"
            />
          </div>
        )}

        {/* Color Palette Selector */}
        {!isLiability && (
          <div>
            <label className="input-label" style={{ marginBottom: '0.5rem' }}>Identificador Visual:</label>
            <div className="color-swatch-list">
              {COLOR_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  className={`color-swatch-btn ${color === pal.id ? 'active' : ''}`}
                  onClick={() => setColor(pal.id)}
                  style={{ '--swatch-color': pal.hex }}
                  title={pal.label}
                  aria-label={pal.label}
                >
                  <span className="swatch-inner-circle" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="account-modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {accountToEdit ? 'Guardar Cambios' : 'Crear Cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
