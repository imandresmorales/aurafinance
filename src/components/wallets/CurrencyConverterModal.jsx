import React, { useState } from 'react';
import { Modal, Input, Button } from '../common';
import {
  convertCurrency,
  getExchangeRate,
  getCurrencySymbol,
  BASE_EXCHANGE_RATES_USD,
} from '../../services';
import { formatCurrency } from '../../utils';
import './CurrencyConverterModal.css';

const AVAILABLE_CURRENCIES = Object.keys(BASE_EXCHANGE_RATES_USD);

export default function CurrencyConverterModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');

  const numAmount = parseFloat(amount) || 0;
  const convertedAmount = convertCurrency(numAmount, fromCurrency, toCurrency);
  const currentRate = getExchangeRate(fromCurrency, toCurrency);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conversor Dinámico Multidivisa"
      subtitle="Tipos de cambio de alta precisión y caché local offline"
      maxWidth="540px"
    >
      <div className="currency-converter-body">
        <Input
          label="Monto a Convertir:"
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix={getCurrencySymbol(fromCurrency)}
        />

        <div className="currency-selectors-row">
          <div className="selector-column">
            <label className="input-label" htmlFor="from-curr">De (Origen):</label>
            <select
              id="from-curr"
              className="currency-select"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {AVAILABLE_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} ({getCurrencySymbol(c)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="currency-swap-btn"
            onClick={handleSwapCurrencies}
            title="Invertir divisas"
            aria-label="Invertir divisas de origen y destino"
          >
            ⇄
          </button>

          <div className="selector-column">
            <label className="input-label" htmlFor="to-curr">A (Destino):</label>
            <select
              id="to-curr"
              className="currency-select"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {AVAILABLE_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} ({getCurrencySymbol(c)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Card */}
        <div className="conversion-result-card glass-panel">
          <span className="rate-hint">
            1 {fromCurrency} = <strong className="num-mono">{currentRate.toFixed(4)} {toCurrency}</strong>
          </span>

          <div className="final-converted-value num-mono text-gradient-emerald">
            {formatCurrency(convertedAmount, toCurrency)}
          </div>

          <span className="rate-timestamp">
            ✓ Tipos de cambio sincronizados y almacenados en caché local
          </span>
        </div>

        {/* Table of Major Exchange Rates */}
        <div className="rates-table-wrapper">
          <h5 className="rates-table-title">Tabla de Tipos de Cambio (Base 1 {fromCurrency})</h5>
          <div className="rates-mini-grid">
            {AVAILABLE_CURRENCIES.filter((c) => c !== fromCurrency).slice(0, 6).map((c) => {
              const rate = getExchangeRate(fromCurrency, c);
              return (
                <div key={c} className="rate-mini-item">
                  <span className="rate-code">{c}</span>
                  <span className="rate-val num-mono">{rate.toFixed(3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="converter-actions">
          <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
            Listo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
