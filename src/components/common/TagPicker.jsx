import React, { useState } from 'react';
import { POPULAR_TAGS } from '../../services';
import './TagPicker.css';

export default function TagPicker({ selectedTags = [], onChange }) {
  const [customTagInput, setCustomTagInput] = useState('');

  const handleAddTag = (tagToAdd) => {
    let clean = tagToAdd.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = `#${clean}`;

    if (!selectedTags.includes(clean)) {
      onChange([...selectedTags, clean]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(customTagInput);
    }
  };

  return (
    <div className="tag-picker-container">
      <div className="tag-picker-input-wrap">
        <input
          type="text"
          value={customTagInput}
          onChange={(e) => setCustomTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Añadir etiqueta (#Deducible, #Vacaciones...)"
          className="tag-input-control"
        />
        <button
          type="button"
          onClick={() => handleAddTag(customTagInput)}
          disabled={!customTagInput.trim()}
          className="add-tag-btn"
        >
          + Añadir
        </button>
      </div>

      {/* Selected Tags Chips */}
      {selectedTags.length > 0 && (
        <div className="selected-tags-flow">
          {selectedTags.map((tag) => (
            <span key={tag} className="tag-chip active">
              {tag}
              <button
                type="button"
                className="remove-tag-x"
                onClick={() => handleRemoveTag(tag)}
                aria-label={`Eliminar etiqueta ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick Suggested Tags */}
      <div className="suggested-tags-row">
        <span className="suggested-title">Sugeridas:</span>
        <div className="suggested-chips">
          {POPULAR_TAGS.filter((t) => !selectedTags.includes(t)).slice(0, 5).map((t) => (
            <button
              key={t}
              type="button"
              className="tag-chip suggested"
              onClick={() => handleAddTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
