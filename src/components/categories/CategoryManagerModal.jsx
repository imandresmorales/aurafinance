import React, { useState } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { FINANCIAL_CATEGORIES } from '../../services/categoriesData';
import { SVG_CATEGORY_ICONS, renderCategoryIcon } from './categoryIcons';
import { Modal, Button, Input } from '../common';
import './CategoryManagerModal.css';

const COLOR_PRESETS = [
  '#10b981', '#38bdf8', '#f59e0b', '#a855f7', '#ec4899', '#e2c275', '#6366f1', '#ef4444', '#14b8a6', '#8b5cf6'
];

export default function CategoryManagerModal({ isOpen, onClose }) {
  const { categories = FINANCIAL_CATEGORIES, addCategory, updateCategory, deleteCategory, resetCategoriesToDefault } = useAccounts();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#10b981');
  const [subCategories, setSubCategories] = useState(['General']);
  const [newSubInput, setNewSubInput] = useState('');

  const handleStartCreate = () => {
    setEditingCategory(null);
    setName('');
    setType('EXPENSE');
    setIcon('tag');
    setColor('#10b981');
    setSubCategories(['General']);
    setNewSubInput('');
    setActiveTab('create');
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type || 'EXPENSE');
    setIcon(cat.icon || 'tag');
    setColor(cat.color || '#10b981');
    setSubCategories(cat.subCategories && cat.subCategories.length ? [...cat.subCategories] : ['General']);
    setNewSubInput('');
    setActiveTab('edit');
  };

  const handleAddSubCategory = () => {
    const trimmed = newSubInput.trim();
    if (!trimmed) return;
    if (subCategories.includes(trimmed)) {
      toast?.warning('La subcategoría ya existe en esta lista.');
      return;
    }
    setSubCategories([...subCategories, trimmed]);
    setNewSubInput('');
  };

  const handleRemoveSubCategory = (subToRemove) => {
    if (subCategories.length <= 1) {
      toast?.warning('Debe haber al menos una subcategoría.');
      return;
    }
    setSubCategories(subCategories.filter(s => s !== subToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast?.warning('El nombre de la categoría es requerido.');
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      icon,
      color,
      subCategories: subCategories.filter(Boolean)
    };

    try {
      if (editingCategory && updateCategory) {
        await updateCategory(editingCategory.id, payload);
        toast?.success(`Categoría "${payload.name}" actualizada.`);
      } else if (addCategory) {
        await addCategory(payload);
        toast?.success(`Categoría "${payload.name}" creada.`);
      }
      setActiveTab('list');
    } catch (err) {
      toast?.error(err.message || 'Error al guardar categoría.');
    }
  };

  const handleDelete = async (catId, catName) => {
    if (window.confirm(`¿Seguro que deseas eliminar la categoría "${catName}"?`)) {
      try {
        if (deleteCategory) {
          await deleteCategory(catId);
          toast?.info(`Categoría "${catName}" eliminada.`);
        }
      } catch (err) {
        toast?.error('No se pudo eliminar la categoría.');
      }
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('¿Deseas restaurar todas las categorías del sistema a su configuración por defecto?')) {
      try {
        if (resetCategoriesToDefault) {
          await resetCategoriesToDefault();
          toast?.success('Categorías restauradas a los valores por defecto.');
        }
      } catch (err) {
        toast?.error('Error al restaurar categorías.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestor de Categorías e Iconos Vectoriales">
      <div className="category-manager-modal">
        <div className="cat-manager-tabs">
          <button
            type="button"
            className={`cat-manager-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📋 Mis Categorías ({categories.length})
          </button>
          <button
            type="button"
            className={`cat-manager-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={handleStartCreate}
          >
            + Nueva Categoría
          </button>
        </div>

        {activeTab === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Personaliza tus categorías, colores e iconos SVG vectoriales.
              </span>
              <button
                type="button"
                className="glass-pill"
                onClick={handleResetDefaults}
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', cursor: 'pointer' }}
              >
                🔄 Restaurar Predeterminados
              </button>
            </div>

            <div className="category-items-grid">
              {categories.map((cat) => (
                <div key={cat.id || cat.name} className="category-item-card">
                  <div className="category-item-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        className="category-icon-preview"
                        style={{ background: `${cat.color || '#10b981'}22`, color: cat.color || '#10b981' }}
                      >
                        {renderCategoryIcon(cat.icon, cat.color, 20)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                          {cat.name}
                        </h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {cat.type === 'EXPENSE' ? 'Gasto' : cat.type === 'INCOME' ? 'Ingreso' : 'Transferencia'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="glass-pill"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' }}
                        title="Editar categoría"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="glass-pill rose"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' }}
                        title="Eliminar categoría"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="category-subs-pills">
                    {(cat.subCategories || []).map((sub, idx) => (
                      <span key={idx} className="category-sub-pill">{sub}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'create' || activeTab === 'edit') && (
          <form onSubmit={handleSubmit} className="category-form-section">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
              {activeTab === 'edit' ? `Editar "${editingCategory?.name}"` : 'Crear Nueva Categoría'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Cuidado Personal"
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Tipo Financiero
                </label>
                <select
                  className="glass-input"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="EXPENSE">Gasto (Expense)</option>
                  <option value="INCOME">Ingreso (Income)</option>
                  <option value="TRANSFER">Transferencia / Inversión</option>
                </select>
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Icono Vectorial SVG
              </label>
              <div className="icon-selector-grid">
                {SVG_CATEGORY_ICONS.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    className={`icon-picker-btn ${icon === ic.id ? 'selected' : ''}`}
                    onClick={() => setIcon(ic.id)}
                    title={ic.name}
                  >
                    {ic.svg({ width: 18, height: 18 })}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Color Distintivo
              </label>
              <div className="color-presets-row">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-dot-btn ${color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  title="Color personalizado"
                />
              </div>
            </div>

            {/* Subcategories Editor */}
            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Subcategorías Asociadas
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="glass-input"
                  value={newSubInput}
                  onChange={(e) => setNewSubInput(e.target.value)}
                  placeholder="Añadir subcategoría..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubCategory();
                    }
                  }}
                  style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                />
                <button
                  type="button"
                  className="glass-pill emerald"
                  onClick={handleAddSubCategory}
                  style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                >
                  + Agregar
                </button>
              </div>

              <div className="category-subs-pills">
                {subCategories.map((sub, idx) => (
                  <span key={idx} className="category-sub-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    {sub}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubCategory(sub)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="glass-pill"
                onClick={() => setActiveTab('list')}
                style={{ padding: '0.6rem 1.25rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="glass-pill emerald"
                style={{ padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}
              >
                {activeTab === 'edit' ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
