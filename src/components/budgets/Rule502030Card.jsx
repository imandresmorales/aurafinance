import React, { useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { calculateRule502030 } from '../../services';
import { formatCurrency } from '../../utils';
import './Rule502030Card.css';

export default function Rule502030Card() {
  const { transactions } = useAccounts();

  const analysis = useMemo(() => {
    return calculateRule502030(transactions);
  }, [transactions]);

  const { pillars, monthlyIncome, recommendations } = analysis;

  const totalSegments = (pillars.needs.percentage + pillars.wants.percentage + pillars.savings.percentage) || 100;
  const needsSegWidth = (pillars.needs.percentage / totalSegments) * 100;
  const wantsSegWidth = (pillars.wants.percentage / totalSegments) * 100;
  const savingsSegWidth = (pillars.savings.percentage / totalSegments) * 100;

  return (
    <div className="rule502030-container">
      <div className="rule502030-header">
        <div className="rule502030-title">
          <span>⚖️ Desglose Inteligente: Regla 50 / 30 / 20</span>
        </div>
        <div className="glass-pill emerald" style={{ fontSize: 'var(--font-size-2xs)' }}>
          Ingresos Analizados: <strong className="num-mono">{formatCurrency(monthlyIncome, 'USD')}</strong>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="rule-segmented-bar">
        <div
          className="rule-segment needs"
          style={{ width: `${needsSegWidth}%` }}
          title={`Necesidades: ${pillars.needs.percentage}%`}
        />
        <div
          className="rule-segment wants"
          style={{ width: `${wantsSegWidth}%` }}
          title={`Deseos: ${pillars.wants.percentage}%`}
        />
        <div
          className="rule-segment savings"
          style={{ width: `${savingsSegWidth}%` }}
          title={`Ahorro e Inversión: ${pillars.savings.percentage}%`}
        />
      </div>

      {/* 3 Pillars Grid */}
      <div className="rule-pillars-grid">
        {/* Needs (50%) */}
        <div className="pillar-card needs">
          <div className="pillar-header">
            <span className="pillar-name">🏠 Necesidades (50%)</span>
            <span className={`glass-pill ${pillars.needs.isCompliant ? 'emerald' : 'danger'}`} style={{ fontSize: 'var(--font-size-2xs)' }}>
              {pillars.needs.percentage}%
            </span>
          </div>
          <div className="pillar-spent num-mono">
            {formatCurrency(pillars.needs.spent, 'USD')}
          </div>
          <div className="pillar-progress-wrapper">
            <div className="pillar-progress-track">
              <div
                className="pillar-progress-fill"
                style={{
                  width: `${Math.min(100, (pillars.needs.percentage / 50) * 100)}%`,
                  background: pillars.needs.isCompliant ? '#38bdf8' : '#f43f5e',
                }}
              />
            </div>
            <div className="pillar-target-info">
              <span>Meta: &le; 50%</span>
              <span className="num-mono">Ideal: {formatCurrency(pillars.needs.idealAmount, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Wants (30%) */}
        <div className="pillar-card wants">
          <div className="pillar-header">
            <span className="pillar-name">🎭 Deseos & Estilo (30%)</span>
            <span className={`glass-pill ${pillars.wants.isCompliant ? 'emerald' : 'gold'}`} style={{ fontSize: 'var(--font-size-2xs)' }}>
              {pillars.wants.percentage}%
            </span>
          </div>
          <div className="pillar-spent num-mono">
            {formatCurrency(pillars.wants.spent, 'USD')}
          </div>
          <div className="pillar-progress-wrapper">
            <div className="pillar-progress-track">
              <div
                className="pillar-progress-fill"
                style={{
                  width: `${Math.min(100, (pillars.wants.percentage / 30) * 100)}%`,
                  background: pillars.wants.isCompliant ? '#f59e0b' : '#f43f5e',
                }}
              />
            </div>
            <div className="pillar-target-info">
              <span>Meta: &le; 30%</span>
              <span className="num-mono">Ideal: {formatCurrency(pillars.wants.idealAmount, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Savings & Investments (20%) */}
        <div className="pillar-card savings">
          <div className="pillar-header">
            <span className="pillar-name">📈 Ahorro & Deuda (20%)</span>
            <span className={`glass-pill ${pillars.savings.isCompliant ? 'emerald' : 'gold'}`} style={{ fontSize: 'var(--font-size-2xs)' }}>
              {pillars.savings.percentage}%
            </span>
          </div>
          <div className="pillar-spent num-mono">
            {formatCurrency(pillars.savings.spent, 'USD')}
          </div>
          <div className="pillar-progress-wrapper">
            <div className="pillar-progress-track">
              <div
                className="pillar-progress-fill"
                style={{
                  width: `${Math.min(100, (pillars.savings.percentage / 20) * 100)}%`,
                  background: pillars.savings.isCompliant ? '#10b981' : '#f59e0b',
                }}
              />
            </div>
            <div className="pillar-target-info">
              <span>Meta: &ge; 20%</span>
              <span className="num-mono">Ideal: {formatCurrency(pillars.savings.idealAmount, 'USD')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advice Box */}
      {recommendations && recommendations.length > 0 && (
        <div className="rule-advice-box">
          <strong>Diagnóstico Financiero: </strong>
          {recommendations.join(' ')}
        </div>
      )}
    </div>
  );
}
