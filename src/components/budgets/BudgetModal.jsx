import React, { useState, useEffect } from 'react';
import { Modal } from '../common';
import { FINANCIAL_CATEGORIES } from '../../services';
import './BudgetModal.css';

const ICONS = ['🥑', '🏠', '🚗', '🎭', '🩺', '💻', '📈', '🛍️', '📚', '✈️', '🏷️', '⚡', '☕', '👶', '🐾'];
const COLORS = [
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Cielo', value: '#38bdf8' },
  { label: 'Dorado', value: '#f59e0b' },
  { label: 'Violeta', value: '#a855f7' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Ámbar', value: '#e2c275' },
];

export default function BudgetModal({ isOpen, onClose, onSave, budgetToEdit = null }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [allocated, setAllocated] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [color, setColor] = useState('#10b981');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (budgetToEdit) {
      setName(budgetToEdit.name || '');
      setCategory(budgetToEdit.category || '');
      setAllocated(budgetToEdit.allocated !== undefined ? String(budgetToEdit.allocated) : '');
      setIcon(budgetToEdit.icon || '🏷️');
      setColor(budgetToEdit.color || '#10b981');
      setPeriod(budgetToEdit.period || new Date().toISOString().slice(0, 7));
      setNotes(budgetToEdit.notes || '');
    } else {
      setName('');
      setCategory(FINANCIAL_CATEGORIES[0]?.name || 'Alimentación');
      setAllocated('');
      setIcon('🥑');
      setColor('#10b981');
      setPeriod(new Date().toISOString().slice(0, 7));
      setNotes('');
    }
  }, [budgetToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAllocated = parseFloat(allocated);
    if (!name.trim()) return;
    if (isNaN(numAllocated) || numAllocated < 0) return;

    onSave(
      {
        name: name.trim(),
        category: category || name.trim(),
        allocated: numAllocated,
        icon,
        color,
        period,
        notes: notes.trim(),
      },
      budgetToEdit?.id
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Editar Sobre de Presupuesto' : 'Nuevo Sobre de Presupuesto'}
    >
      <form onSubmit={handleSubmit} className="budget-modal-form">
        <div className="budget-field-group">
          <label htmlFor="budget-name">Nombre del Sobre</label>
          <input
            id="budget-name"
            type="text"
            required
            placeholder="Ej: Alimentación Familiar, Gastos Vivienda"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="budget-form-grid">
          <div className="budget-field-group">
            <label htmlFor="budget-category">Categoría Contable</label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const found = FINANCIAL_CATEGORIES.find((c) => c.name === e.target.value);
                if (found) {
                  setIcon(found.icon);
                  setColor(found.color);
                  if (!name) setName(found.name);
                }
              }}
            >
              {FINANCIAL_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="budget-field-group">
            <label htmlFor="budget-allocated">Límite Mensual Asignado ($)</label>
            <input
              id="budget-allocated"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="num-mono"
              value={allocated}
              onChange={(e) => setAllocated(e.target.value)}
            />
          </div>
        </div>

        <div className="budget-form-grid">
          <div className="budget-field-group">
            <label htmlFor="budget-period">Periodo Presupuestario</label>
            <input
              id="budget-period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div className="budget-field-group">
            <label htmlFor="budget-color">Color Distintivo</label>
            <select
              id="budget-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {COLORS.map((col) => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="budget-field-group">
          <label>Icono del Sobre</label>
          <div className="icon-selector-grid">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`icon-choice-btn ${icon === ic ? 'selected' : ''}`}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="budget-field-group">
          <label htmlFor="budget-notes">Notas / Propósito (Opcional)</label>
          <textarea
            id="budget-notes"
            rows={2}
            placeholder="Detalles sobre este límite o reglas de consumo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="budget-modal-actions">
          <button
            type="button"
            className="glass-pill"
            onClick={onClose}
            style={{ cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="glass-pill emerald"
            style={{ cursor: 'pointer', fontWeight: 600 }}
          >
            {budgetToEdit ? 'Guardar Cambios' : 'Crear Sobre'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
