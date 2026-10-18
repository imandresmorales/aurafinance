import React, { useState } from 'react';
import { parseBankCsv } from '../../services/bankCsvParserEngine';
import { parseOFX, parseQIF } from '../../services/bankOfxQifParserEngine';

/**
 * FileDropZone Component
 * Zona de arrastrar y soltar (Drag & Drop) universal para importar
 * archivos de extractos bancarios (.csv, .ofx, .qif) en el cliente.
 */
export const FileDropZone = ({ onFileLoaded, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    if (!file) return;

    setIsProcessing(true);
    const fileName = file.name.toLowerCase();

    try {
      const text = await file.text();

      if (fileName.endsWith('.csv')) {
        const result = parseBankCsv(text);
        if (onFileLoaded) onFileLoaded({ type: 'CSV', data: result.rows, meta: result });
      } else if (fileName.endsWith('.ofx')) {
        const rows = parseOFX(text);
        if (onFileLoaded) onFileLoaded({ type: 'OFX', data: rows });
      } else if (fileName.endsWith('.qif')) {
        const rows = parseQIF(text);
        if (onFileLoaded) onFileLoaded({ type: 'QIF', data: rows });
      } else {
        if (onError) onError('Formato no soportado. Por favor, sube un archivo .csv, .ofx o .qif');
      }
    } catch (err) {
      if (onError) onError(`Error al leer el archivo: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? '#10b981' : '#334155'}`,
        borderRadius: '12px',
        padding: '32px 20px',
        textAlign: 'center',
        background: isDragging ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.4)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => document.getElementById('aura-bank-file-input')?.click()}
    >
      <input
        id="aura-bank-file-input"
        type="file"
        accept=".csv,.ofx,.qif"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
        {isProcessing ? '⏳' : '📂'}
      </div>
      <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#f8fafc' }}>
        {isProcessing ? 'Procesando archivo bancario...' : 'Arrastra tu extracto bancario aquí'}
      </h4>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
        Soporta archivos <strong>.CSV</strong>, <strong>.OFX</strong> y <strong>.QIF</strong> (procesamiento 100% local en cliente)
      </p>
    </div>
  );
};

export default FileDropZone;
