import React, { useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { analyzeWindfallCorrelations } from '../../services/correlationEngine';
import './IncomeExpenseCorrelationCard.css';

export function IncomeExpenseCorrelationCard() {
  const { transactions } = useAccounts();

  const analysis = useMemo(() => {
    return analyzeWindfallCorrelations(transactions);
  }, [transactions]);

  return (
    <div className="correlation-card-container" id="income-correlation-section">
      <div className="correlation-header">
        <div>
          <div className="glass-pill gold" style={{ marginBottom: '0.4rem' }}>
            <span>Psicología Financiera & Elasticidad</span>
          </div>
          <h2 className="correlation-title">
            <span>🎯 Correlación de Ingresos Extraordinarios vs Gasto Posterior</span>
          </h2>
        </div>

        <div className="num-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Retención Media: <strong style={{ color: analysis.overallRetentionRate >= 60 ? 'var(--color-primary-light)' : '#f87171' }}>{analysis.overallRetentionRate.toFixed(0)}%</strong>
        </div>
      </div>

      {analysis.windfallEvents.length > 0 ? (
        <div className="correlation-events-grid">
          {analysis.windfallEvents.map((evt) => (
            <div key={evt.id} className="correlation-event-item">
              <div className="correlation-event-header">
                <div>
                  <strong>{evt.source}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {evt.date}
                  </div>
                </div>
                <strong className="num-mono text-gradient-emerald">
                  +{formatCurrency(evt.amount)}
                </strong>
              </div>

              {/* Retention vs Trailing Spending Bar */}
              <div className="correlation-bar-bg">
                <div
                  className="correlation-bar-fill"
                  style={{ width: `${evt.retentionRate}%` }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Retenido: <strong className="num-mono" style={{ color: 'var(--color-primary-light)' }}>{formatCurrency(evt.retainedAmount)}</strong> ({evt.retentionRate.toFixed(0)}%)</span>
                <span>Gastado 14d: <strong className="num-mono" style={{ color: '#f87171' }}>{formatCurrency(evt.trailingSpent14d)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="correlation-diagnosis-banner">
        <span style={{ fontSize: '1.2rem' }}>🧠</span>
        <div>
          <strong>Evaluación Heurística de Inflación de Estilo de Vida:</strong> {analysis.diagnosis}
        </div>
      </div>
    </div>
  );
}
export default IncomeExpenseCorrelationCard;
