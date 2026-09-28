import React from 'react';
import { formatCurrency } from '../../utils';
import EnvelopeProgressBar from './EnvelopeProgressBar';
import './EnvelopeCard.css';

export default function EnvelopeCard({ envelope, onEdit, onDelete, currency = 'USD' }) {
  const { id, name, icon, spent = 0, allocated = 0, remaining = 0, percentSpent = 0, isOverBudget = false, notes } = envelope;

  return (
    <div className="glass-card envelope-card">
      <div>
        <div className="envelope-card-header">
          <div className="envelope-card-title">
            <span className="envelope-icon">{icon || '🏷️'}</span>
            <h3 className="envelope-name">{name}</h3>
          </div>
          <span
            className={`glass-pill ${isOverBudget ? 'danger' : percentSpent >= 75 ? 'gold' : 'emerald'}`}
            style={{ fontSize: 'var(--font-size-2xs)' }}
          >
            {isOverBudget ? 'Excedido' : `${percentSpent.toFixed(0)}% consumido`}
          </span>
        </div>

        {notes && (
          <p style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-tertiary)', margin: '0.25rem 0' }}>
            {notes}
          </p>
        )}

        {/* Dynamic Micro-State Progress Bar */}
        <EnvelopeProgressBar
          spent={spent}
          allocated={allocated}
          currency={currency}
        />

        <div className="envelope-stat-box">
          <div>
            <span>Gastado: </span>
            <strong className="num-mono" style={{ color: isOverBudget ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {formatCurrency(spent, currency)}
            </strong>
          </div>
          <div>
            <span>Límite: </span>
            <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(allocated, currency)}
            </strong>
          </div>
        </div>

        <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
          <span className={`envelope-remaining-badge ${remaining >= 0 ? 'positive' : 'negative'} num-mono`}>
            {remaining >= 0 ? `Disponible: ${formatCurrency(remaining, currency)}` : `Sobrepasado por: ${formatCurrency(Math.abs(remaining), currency)}`}
          </span>
        </div>
      </div>

      <div className="envelope-card-footer">
        <button
          type="button"
          className="envelope-action-btn edit"
          onClick={() => onEdit && onEdit(envelope)}
        >
          ✏️ Editar Límite
        </button>
        <button
          type="button"
          className="envelope-action-btn delete"
          onClick={() => onDelete && onDelete(id, name)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
