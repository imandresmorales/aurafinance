import React, { useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateMicroTrends } from '../../services/microTrendsEngine';
import './MicroTrendCards.css';

export function MicroTrendCards() {
  const { transactions } = useAccounts();

  const trends = useMemo(() => {
    return calculateMicroTrends(transactions);
  }, [transactions]);

  return (
    <div className="microtrends-grid" aria-label="Micro-tendencias estadísticas de consumo">
      {trends.metrics.map((m) => (
        <div key={m.id} className="microtrend-card">
          <div className="microtrend-header">
            <span className="microtrend-title">
              <span>{m.icon}</span>
              <span>{m.title}</span>
            </span>

            <span
              className={`microtrend-badge ${
                m.isIncrease ? 'increase' : 'decrease'
              }`}
            >
              {m.diffPercent > 0 ? '+' : ''}
              {m.diffPercent.toFixed(1)}% vs media
            </span>
          </div>

          <div className="microtrend-value num-mono">
            {m.unit === 'currency' ? formatCurrency(m.currentValue) : `${m.currentValue.toFixed(1)} / día`}
          </div>

          <div className="microtrend-footer">
            Promedio histórico: <strong className="num-mono">{m.unit === 'currency' ? formatCurrency(m.baselineValue) : `${m.baselineValue.toFixed(1)} / día`}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
export default MicroTrendCards;
