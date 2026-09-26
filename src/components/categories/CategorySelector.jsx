import React, { useState } from 'react';
import { FINANCIAL_CATEGORIES } from '../../services';
import './CategorySelector.css';

export default function CategorySelector({
  selectedCategory,
  selectedSubCategory,
  onSelectCategory,
  onSelectSubCategory,
  type = 'EXPENSE',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeParentTab, setActiveParentTab] = useState(selectedCategory || FINANCIAL_CATEGORIES[0].name);

  const filteredCategories = FINANCIAL_CATEGORIES.filter((cat) => {
    if (searchTerm) {
      const matchParent = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSub = cat.subCategories.some((sub) =>
        sub.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchParent || matchSub;
    }
    return true;
  });

  const activeParentObj =
    FINANCIAL_CATEGORIES.find((c) => c.name === activeParentTab) || FINANCIAL_CATEGORIES[0];

  const handleSelectParent = (cat) => {
    setActiveParentTab(cat.name);
    onSelectCategory(cat.name);
    if (cat.subCategories.length > 0) {
      onSelectSubCategory(cat.subCategories[0]);
    } else {
      onSelectSubCategory('');
    }
  };

  const handleSelectSub = (subName) => {
    onSelectSubCategory(subName);
  };

  return (
    <div className="category-selector-card">
      <div className="cat-search-box">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar categoría o subcategoría..."
          className="cat-search-input"
        />
      </div>

      {/* Parent Categories Horizontal Grid */}
      <div className="parent-categories-scroll" role="tablist" aria-label="Categorías principales">
        {filteredCategories.map((cat) => {
          const isSelected = activeParentTab === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`parent-cat-chip ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelectParent(cat)}
            >
              <span className="cat-emoji">{cat.icon}</span>
              <span className="cat-title">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subcategories Flow List */}
      {activeParentObj && activeParentObj.subCategories.length > 0 && (
        <div className="subcategories-panel">
          <span className="subcategories-label">
            Subcategorías de {activeParentObj.name}:
          </span>
          <div className="subcategories-chips-wrap">
            {activeParentObj.subCategories.map((sub) => {
              const isSubSelected = selectedSubCategory === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  className={`subcat-pill ${isSubSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectSub(sub)}
                >
                  {isSubSelected ? '✓ ' : ''}
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
