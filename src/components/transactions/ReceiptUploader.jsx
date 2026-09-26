import React, { useRef, useState } from 'react';
import './ReceiptUploader.css';

/**
 * Comprime y escala imágenes en cliente usando HTML5 Canvas
 * para no saturar la bóveda cifrada de IndexedDB / WebCrypto.
 */
function compressImage(file, maxWidth = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      // Para PDFs u otros archivos, leer directamente como base64
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target.result, size: file.size });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({
        dataUrl,
        size: Math.round((dataUrl.length * 3) / 4), // tamaño aproximado en bytes
        dimensions: { width, height },
      });
    };

    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReceiptUploader({ receipt, onChange, onPreview }) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo original supera el límite permitido de 15MB.');
      return;
    }

    try {
      setIsProcessing(true);
      const { dataUrl, size, dimensions } = await compressImage(file);
      onChange({
        name: file.name,
        type: file.type,
        size,
        dataUrl,
        uploadedAt: Date.now(),
        dimensions,
      });
    } catch (err) {
      console.error('Error al procesar comprobante:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="receipt-uploader-root">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {!receipt ? (
        <div
          className={`receipt-dropzone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Subir comprobante o factura"
        >
          {isProcessing ? (
            <div className="receipt-drop-content">
              <span className="receipt-spinner">⏳</span>
              <span className="receipt-drop-label">Comprimiendo y optimizando archivo...</span>
            </div>
          ) : (
            <div className="receipt-drop-content">
              <span className="receipt-drop-icon">🧾</span>
              <div className="receipt-drop-texts">
                <span className="receipt-drop-main">Adjuntar Comprobante / Ticket</span>
                <span className="receipt-drop-sub">Arrastra una imagen o haz clic (JPG, PNG, PDF)</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="receipt-attached-card">
          <div
            className="receipt-thumbnail-wrap"
            onClick={() => onPreview && onPreview(receipt)}
            title="Ver comprobante completo"
          >
            {receipt.type?.startsWith('image/') || receipt.dataUrl?.startsWith('data:image') ? (
              <img src={receipt.dataUrl} alt={receipt.name} className="receipt-thumbnail-img" />
            ) : (
              <div className="receipt-thumbnail-fallback">📄 PDF</div>
            )}
            <div className="receipt-thumbnail-overlay">🔍 Ver</div>
          </div>

          <div className="receipt-info-meta">
            <span className="receipt-filename" title={receipt.name}>
              {receipt.name}
            </span>
            <span className="receipt-filesize num-mono">
              {(receipt.size / 1024).toFixed(1)} KB (Cifrado AES-256)
            </span>
          </div>

          <button
            type="button"
            className="receipt-remove-btn"
            onClick={handleClear}
            title="Eliminar comprobante"
            aria-label="Eliminar comprobante"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
