import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <div className="telemetry-item">
          <span className="telemetry-dot online"></span>
          <span className="telemetry-text">Almacenamiento Local Offline-First</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-tag">WCAG 2.2 AAA</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-tag">Zero-Knowledge</span>
        </div>
      </div>

      <div className="footer-right">
        <div className="shortcut-hints">
          <span className="hint-label">Atajos rápidos:</span>
          <kbd className="shortcut-key">H</kbd> <span className="hint-desc">Privacidad</span>
          <kbd className="shortcut-key">N</kbd> <span className="hint-desc">Nuevo Registro</span>
        </div>
      </div>
    </footer>
  );
}
