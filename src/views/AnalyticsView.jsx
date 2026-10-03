import React, { useState } from 'react';
import { ModularAnalyticsDashboard, FinancialChartsSuite } from '../components';

export default function AnalyticsView() {
  const [activeTab, setActiveTab] = useState('suite'); // 'suite' | 'modular'

  return (
    <div className="view-container">
      {/* Top View Selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(6, 26, 20, 0.7)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '0.75rem',
            padding: '0.25rem',
            gap: '0.25rem',
          }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'suite'}
            onClick={() => setActiveTab('suite')}
            style={{
              background: activeTab === 'suite' ? '#10b981' : 'transparent',
              color: activeTab === 'suite' ? '#041a14' : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📊 Suite Gráfica
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'modular'}
            onClick={() => setActiveTab('modular')}
            style={{
              background: activeTab === 'modular' ? '#10b981' : 'transparent',
              color: activeTab === 'modular' ? '#041a14' : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🧩 Dashboard Modular
          </button>
        </div>
      </div>

      {activeTab === 'suite' ? <FinancialChartsSuite /> : <ModularAnalyticsDashboard />}
    </div>
  );
}
