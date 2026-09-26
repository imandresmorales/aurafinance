import React, { useState } from 'react';
import { Modal, Button } from '../common';
import './ReceiptModal.css';

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!receipt) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receipt.dataUrl;
    link.download = receipt.name || 'comprobante_aurafinance.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receipt.name || 'Comprobante de Pago'}
      subtitle={`Archivo adjunto cifrado AES-256 (${(receipt.size / 1024).toFixed(1)} KB)`}
      maxWidth="750px"
    >
      <div className="receipt-modal-content">
        {/* Toolbar */}
        <div className="receipt-viewer-toolbar">
          <div className="receipt-zoom-controls">
            <button type="button" className="toolbar-btn" onClick={handleZoomOut} title="Alejar">
              ➖
            </button>
            <span className="zoom-indicator num-mono">{Math.round(zoom * 100)}%</span>
            <button type="button" className="toolbar-btn" onClick={handleZoomIn} title="Acercar">
              ➕
            </button>
            <button type="button" className="toolbar-btn" onClick={handleRotate} title="Rotar 90°">
              🔄
            </button>
            <button type="button" className="toolbar-btn" onClick={handleReset} title="Restablecer">
              ↺
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleDownload}>
            💾 Descargar
          </Button>
        </div>

        {/* Image Display Area */}
        <div className="receipt-viewport">
          {receipt.dataUrl?.startsWith('data:image') || receipt.type?.startsWith('image/') ? (
            <img
              src={receipt.dataUrl}
              alt={receipt.name}
              className="receipt-viewer-image"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
          ) : (
            <div className="receipt-pdf-preview">
              <span className="pdf-icon">📄</span>
              <p>Documento adjunto: {receipt.name}</p>
              <Button variant="primary" onClick={handleDownload}>
                Descargar Documento
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
