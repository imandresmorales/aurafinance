import React from 'react';
import './DailyFinancialDiagnosticCard.css';

/**
 * DailyFinancialDiagnosticCard Component
 * Comprehensive Emerald Glass diagnostic card synthesizing Health Score, Cash Runway,
 * Upcoming Obligations, Active Alerts, and Daily Wisdom Nugget with actionable shortcuts.
 */
export default function DailyFinancialDiagnosticCard({
  healthScore = 75,
  healthScoreLabel = 'Buena Salud',
  runwayMonths = 4.5,
  upcomingBillsCount = 2,
  upcomingBillsTotal = 150.0,
  activeAlerts = [],
  dailyWisdom = null,
  onActionClick = () => {},
}) {
  const scoreValue = typeof healthScore === 'object' && healthScore !== null ? healthScore.score || 0 : Number(healthScore) || 0;
  const scoreBadgeClass = scoreValue >= 80 ? 'diagnostic-badge-excel' : scoreValue >= 60 ? 'diagnostic-badge-good' : 'diagnostic-badge-warning';
  const scoreColor = scoreValue >= 80 ? '#10b981' : scoreValue >= 60 ? '#3b82f6' : '#f59e0b';

  const defaultWisdom = dailyWisdom || {
    quote: 'El secreto del interés compuesto es el tiempo y la constancia, no el volumen inicial.',
    author: 'Sabiduría Financiera',
    tag: 'Mentalidad',
  };

  return (
    <div className="daily-diagnostic-card" data-testid="daily-financial-diagnostic-card">
      <div className="daily-diagnostic-header">
        <div className="diagnostic-title-group">
          <div className="diagnostic-sparkle-icon" aria-hidden="true">✨</div>
          <div>
            <h3 className="diagnostic-title">Diagnóstico Financiero Diario</h3>
            <p className="diagnostic-subtitle">Monitoreo continuo de salud y liquidez en tiempo real</p>
          </div>
        </div>
        <span className={`diagnostic-status-pill ${scoreBadgeClass}`} style={{ borderColor: scoreColor }}>
          <span className="diagnostic-dot" style={{ backgroundColor: scoreColor }}></span>
          {scoreValue}/100 • {healthScoreLabel}
        </span>
      </div>

      <div className="diagnostic-kpi-grid">
        <div className="diagnostic-kpi-item" data-testid="kpi-score">
          <div className="diagnostic-kpi-icon" style={{ color: '#10b981' }}>🛡️</div>
          <div className="diagnostic-kpi-details">
            <span className="diagnostic-kpi-label">Health Score</span>
            <span className="diagnostic-kpi-value">{scoreValue}/100</span>
          </div>
        </div>

        <div className="diagnostic-kpi-item" data-testid="kpi-runway">
          <div className="diagnostic-kpi-icon" style={{ color: '#06b6d4' }}>⏱️</div>
          <div className="diagnostic-kpi-details">
            <span className="diagnostic-kpi-label">Runway Liquidez</span>
            <span className="diagnostic-kpi-value">{runwayMonths} meses</span>
          </div>
        </div>

        <div className="diagnostic-kpi-item" data-testid="kpi-bills">
          <div className="diagnostic-kpi-icon" style={{ color: '#f59e0b' }}>📅</div>
          <div className="diagnostic-kpi-details">
            <span className="diagnostic-kpi-label">Facturas (7 días)</span>
            <span className="diagnostic-kpi-value">{upcomingBillsCount} (${Number(upcomingBillsTotal).toFixed(2)})</span>
          </div>
        </div>

        <div className="diagnostic-kpi-item" data-testid="kpi-alerts">
          <div className="diagnostic-kpi-icon" style={{ color: '#ec4899' }}>⚡</div>
          <div className="diagnostic-kpi-details">
            <span className="diagnostic-kpi-label">Alertas Activas</span>
            <span className="diagnostic-kpi-value">{activeAlerts.length} pendientes</span>
          </div>
        </div>
      </div>

      {defaultWisdom && (
        <div className="diagnostic-wisdom-box" data-testid="diagnostic-wisdom">
          <div className="diagnostic-wisdom-badge">💡 {defaultWisdom.tag || 'Tip del Día'}</div>
          <p className="diagnostic-wisdom-text">"{defaultWisdom.quote}"</p>
          {defaultWisdom.author && <span className="diagnostic-wisdom-author">— {defaultWisdom.author}</span>}
        </div>
      )}

      {activeAlerts && activeAlerts.length > 0 && (
        <div className="diagnostic-alerts-section">
          <h4 className="diagnostic-section-heading">Sugerencias y Alertas Accionables</h4>
          <div className="diagnostic-alerts-list">
            {activeAlerts.map((alert, idx) => (
              <div key={alert.id || idx} className={`diagnostic-alert-row alert-severity-${alert.severity || 'info'}`}>
                <span className="alert-row-icon">{alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <span className="alert-row-text">{alert.message || alert.text}</span>
                {alert.actionType && (
                  <button
                    type="button"
                    className="diagnostic-btn-action"
                    onClick={() => onActionClick(alert.actionType, alert)}
                  >
                    {alert.actionLabel || 'Resolver'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="diagnostic-footer-actions">
        <button
          type="button"
          className="diagnostic-btn-primary"
          onClick={() => onActionClick('VIEW_ADVISOR')}
        >
          Ver Asesor Financiero Completo ➔
        </button>
        <button
          type="button"
          className="diagnostic-btn-ghost"
          onClick={() => onActionClick('REFRESH_DIAGNOSTIC')}
        >
          🔄 Actualizar Métricas
        </button>
      </div>
    </div>
  );
}

