import React from 'react';
import { splitForHighlight } from '../../utils';
import './HighlightText.css';

/**
 * Componente que resalta coincidencias de búsqueda dentro de un texto con estética Emerald Glass.
 */
export default function HighlightText({ text, query, className = '' }) {
  if (!text) return null;
  if (!query || !query.trim()) return <span className={className}>{text}</span>;

  const parts = splitForHighlight(text, query);

  return (
    <span className={`highlight-text-wrapper ${className}`}>
      {parts.map((part, i) =>
        part.isMatch ? (
          <mark key={i} className="fuzzy-highlight">
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </span>
  );
}
