import React, { useState } from 'react';
import './AccessibleDataTable.css';

/**
 * Reusable WCAG AAA Accessible Data Table component for pairing with graphical charts.
 * @param {Object} props
 * @param {string} props.caption - Accessible table description
 * @param {Array<string>} props.headers - Column names
 * @param {Array<Array<any>>} props.rows - Row matrix
 * @param {string} [props.id] - Accessible identifier
 * @param {boolean} [props.defaultOpen=false] - Initial visibility
 */
export function AccessibleDataTable({
  caption = 'Datos de la gráfica',
  headers = [],
  rows = [],
  id = 'accessible-data-table',
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="accessible-table-wrapper">
      <button
        type="button"
        className="accessible-table-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <span>{isOpen ? '▲ Ocultar tabla accesible' : '📋 Ver datos en tabla accesible (WCAG AAA)'}</span>
      </button>

      {isOpen && (
        <div className="accessible-table-container" id={id}>
          <table className="accessible-table">
            <caption>{caption}</caption>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={typeof cell === 'number' || (typeof cell === 'string' && /^\$?[0-9]/.test(cell)) ? 'num-mono' : ''}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default AccessibleDataTable;
