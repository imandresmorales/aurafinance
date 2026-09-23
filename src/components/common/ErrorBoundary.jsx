import React from 'react';
import './ErrorBoundary.css';

const CRASH_LOG_KEY = 'aura_crash_logs';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    try {
      const logs = JSON.parse(localStorage.getItem(CRASH_LOG_KEY) || '[]');
      const newLog = {
        timestamp: new Date().toISOString(),
        message: error?.message || 'Error no especificado',
        stack: error?.stack || null,
        componentStack: errorInfo?.componentStack || null,
      };
      logs.unshift(newLog);
      // Guardar únicamente los últimos 5 fallos para no saturar el almacenamiento
      localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(logs.slice(0, 5)));
    } catch (e) {
      console.error('No se pudo persistir el registro de excepción:', e);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      // Limpiar datos volátiles sin destruir la metadata de la bóveda
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-shell" role="alert" aria-live="assertive">
          <div className="aurora-bg" aria-hidden="true" />
          <div className="glass-card error-card">
            <div className="error-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>

            <h1 className="error-title">Recuperación de Bóveda</h1>
            <p className="error-subtitle">
              Ha ocurrido una excepción inesperada en la interfaz. Tus datos financieros cifrados permanecen seguros en tu almacenamiento local.
            </p>

            <div className="error-actions">
              <button
                type="button"
                className="glass-pill emerald error-action-btn"
                onClick={this.handleReload}
              >
                🔄 Recargar Aplicación
              </button>
              <button
                type="button"
                className="glass-pill gold error-action-btn"
                onClick={this.handleResetState}
              >
                🔒 Reiniciar Sesión Segura
              </button>
            </div>

            <div className="error-debug-toggle">
              <button
                type="button"
                className="debug-toggle-btn"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              >
                {this.state.showDetails ? '▲ Ocultar Diagnóstico Técnico' : '▼ Ver Diagnóstico Técnico'}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="error-details-box">
                <p className="error-message-text">
                  <strong>Error:</strong> {this.state.error?.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="error-stack-text">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
