import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks';
import './ThemeSelector.css';

export default function ThemeSelector() {
  const { resolvedTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentThemeObj = availableThemes.find((t) => t.id === resolvedTheme) || availableThemes[0];

  return (
    <div className="theme-selector-container" ref={containerRef}>
      <button
        type="button"
        className="theme-selector-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Cambiar tema visual"
      >
        <span
          className="theme-swatch-dot"
          style={{ backgroundColor: currentThemeObj.swatch }}
        />
        <span className="theme-label">{currentThemeObj.label}</span>
        <svg className={`chevron-icon ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="theme-dropdown glass-panel" role="listbox">
          <div className="theme-dropdown-header">Seleccionar Tema</div>
          {availableThemes.map((t) => {
            const isSelected = resolvedTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`theme-option-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className="theme-swatch-dot"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span>{t.label}</span>
                </div>
                {isSelected && (
                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
