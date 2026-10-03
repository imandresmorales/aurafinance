import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import {
  detectSubscriptionsFromTransactions,
  calculateSubscriptionMetrics,
} from '../../services/subscriptionDetectorEngine';
import { formatCurrency } from '../../utils';
import './SubscriptionManager.css';

export default function SubscriptionManager() {
  const {
    transactions = [],
    wallets = [],
    subscriptions = [],
    addSubscription,
    updateSubscription,
    deleteSubscription,
    baseCurrency = 'USD',
  } = useAccounts();

  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'detected'
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for new subscription
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formFrequency, setFormFrequency] = useState('monthly');
  const [formCategory, setFormCategory] = useState('Streaming');
  const [formNextRenewal, setFormNextRenewal] = useState('');
  const [formWalletId, setFormWalletId] = useState(wallets[0]?.id || '');

  // Local fallback storage for subscriptions if not in context yet
  const [localSubs, setLocalSubs] = useState([
    {
      id: 'sub-netflix',
      name: 'Netflix Premium 4K',
      amount: 17.99,
      frequency: 'monthly',
      category: 'Streaming',
      nextRenewal: '2026-10-15',
      status: 'active',
      walletId: wallets[0]?.id,
    },
    {
      id: 'sub-spotify',
      name: 'Spotify Familiar',
      amount: 14.99,
      frequency: 'monthly',
      category: 'Streaming',
      nextRenewal: '2026-10-22',
      status: 'active',
      walletId: wallets[0]?.id,
    },
    {
      id: 'sub-github',
      name: 'GitHub Copilot Enterprise',
      amount: 19.00,
      frequency: 'monthly',
      category: 'Software & Dev',
      nextRenewal: '2026-10-01',
      status: 'active',
      walletId: wallets[0]?.id,
    },
    {
      id: 'sub-gym',
      name: 'Gimnasio Smart Club',
      amount: 39.99,
      frequency: 'monthly',
      category: 'Salud & Deporte',
      nextRenewal: '2026-10-05',
      status: 'active',
      walletId: wallets[0]?.id,
    },
  ]);

  const allSubscriptions = useMemo(() => {
    return (subscriptions && subscriptions.length > 0) ? subscriptions : localSubs;
  }, [subscriptions, localSubs]);

  // Run detection engine on user's transactions
  const detectedSubscriptions = useMemo(() => {
    return detectSubscriptionsFromTransactions(transactions);
  }, [transactions]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    return calculateSubscriptionMetrics(allSubscriptions, detectedSubscriptions, baseCurrency);
  }, [allSubscriptions, detectedSubscriptions, baseCurrency]);

  // Categories list
  const categoriesList = ['ALL', 'Streaming', 'Software & Dev', 'Salud & Deporte', 'Servicios & Hogar', 'Educación', 'Otros'];

  // Filtered active subscriptions
  const filteredActiveSubs = useMemo(() => {
    return allSubscriptions.filter((sub) => {
      if (filterCategory !== 'ALL' && sub.category !== filterCategory) return false;
      return true;
    });
  }, [allSubscriptions, filterCategory]);

  const handleToggleStatus = (id) => {
    setLocalSubs((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === 'active' ? 'paused' : 'active';
          addToast(`Suscripción ${s.name} marcada como ${nextStatus === 'active' ? 'Activa' : 'Pausada'}`, 'info');
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleDeleteSub = (id, name) => {
    setLocalSubs((prev) => prev.filter((s) => s.id !== id));
    addToast(`Suscripción ${name} eliminada`, 'warning');
  };

  const handleConvertDetected = (detectedItem) => {
    const newSub = {
      id: `sub-${Date.now()}`,
      name: detectedItem.name,
      amount: detectedItem.amount,
      frequency: detectedItem.frequency,
      category: detectedItem.category || 'Streaming',
      nextRenewal: detectedItem.lastPaymentDate || new Date().toISOString().split('T')[0],
      status: 'active',
      walletId: wallets[0]?.id || '',
    };
    setLocalSubs((prev) => [newSub, ...prev]);
    addToast(`"${detectedItem.name}" agregada a tus suscripciones oficiales`, 'success');
    setActiveTab('active');
  };

  const handleCreateSubscription = (e) => {
    e.preventDefault();
    if (!formName || !formAmount || Number(formAmount) <= 0) {
      addToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    const newSub = {
      id: `sub-${Date.now()}`,
      name: formName.trim(),
      amount: parseFloat(formAmount),
      frequency: formFrequency,
      category: formCategory,
      nextRenewal: formNextRenewal || new Date().toISOString().split('T')[0],
      status: 'active',
      walletId: formWalletId,
    };

    setLocalSubs((prev) => [newSub, ...prev]);
    addToast(`Suscripción "${formName}" registrada exitosamente`, 'success');
    setIsAddModalOpen(false);
    setFormName('');
    setFormAmount('');
  };

  return (
    <div className="subscription-manager-container" role="region" aria-label="Gestor Inteligente de Suscripciones">
      {/* Header */}
      <div className="sub-header-card">
        <div>
          <div className="sub-badge">Detector & Auditor Financiero</div>
          <h2 className="sub-title">Gestor de Suscripciones Digitales</h2>
          <p className="sub-subtitle">
            Audita gastos fijos periódicos, detecta aumentos ocultos de tarifas y proyecta renovaciones.
          </p>
        </div>

        <div className="sub-header-actions">
          <button
            type="button"
            className="sub-btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <span>+ Nueva Suscripción</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="sub-kpi-grid">
        <div className="sub-kpi-card">
          <span className="sub-kpi-label">Gasto Mensual Normalizado</span>
          <span className="sub-kpi-val highlight">{formatCurrency(metrics.monthlyTotal, baseCurrency)}</span>
          <span className="sub-kpi-sub">Impacto directo recurrente</span>
        </div>

        <div className="sub-kpi-card">
          <span className="sub-kpi-label">Costo Anual Proyectado</span>
          <span className="sub-kpi-val">{formatCurrency(metrics.annualTotal, baseCurrency)}</span>
          <span className="sub-kpi-sub">12 meses acumulados</span>
        </div>

        <div className="sub-kpi-card">
          <span className="sub-kpi-label">Suscripciones Activas</span>
          <span className="sub-kpi-val positive">{metrics.activeCount} activas</span>
          <span className="sub-kpi-sub">{metrics.pausedCount} en pausa</span>
        </div>

        <div className="sub-kpi-card">
          <span className="sub-kpi-label">Detecciones & Alertas</span>
          <span className={`sub-kpi-val ${metrics.priceHikesCount > 0 ? 'negative' : 'neutral'}`}>
            {metrics.priceHikesCount} subida(s) de precio
          </span>
          <span className="sub-kpi-sub">{detectedSubscriptions.length} detectadas en extractos</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sub-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'active'}
          className={`sub-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <span>⭐ Mis Suscripciones ({allSubscriptions.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'detected'}
          className={`sub-tab-btn ${activeTab === 'detected' ? 'active' : ''}`}
          onClick={() => setActiveTab('detected')}
        >
          <span>🔍 Detección Inteligente ({detectedSubscriptions.length})</span>
          {detectedSubscriptions.some((d) => d.isPriceHikeDetected) && (
            <span className="sub-tab-alert-dot" title="Aumentos detectados" />
          )}
        </button>
      </div>

      {/* Category Filter Pills (When on active tab) */}
      {activeTab === 'active' && (
        <div className="sub-filter-row">
          <span className="sub-filter-label">Filtrar por:</span>
          <div className="sub-pills-group">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`sub-pill-btn ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat === 'ALL' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: ACTIVE SUBSCRIPTIONS */}
      {activeTab === 'active' && (
        <div className="sub-list-grid">
          {filteredActiveSubs.length === 0 ? (
            <div className="sub-empty-state">
              <p>No tienes suscripciones registradas en esta categoría.</p>
              <button
                type="button"
                className="sub-btn-secondary"
                onClick={() => setIsAddModalOpen(true)}
              >
                Añadir tu primera suscripción
              </button>
            </div>
          ) : (
            filteredActiveSubs.map((sub) => (
              <div key={sub.id} className={`sub-item-card ${sub.status === 'paused' ? 'paused' : ''}`}>
                <div className="sub-item-header">
                  <div className="sub-service-avatar">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="sub-item-info">
                    <h3 className="sub-service-name">{sub.name}</h3>
                    <span className="sub-service-category">{sub.category}</span>
                  </div>
                  <div className="sub-item-pricing">
                    <span className="sub-price-val">{formatCurrency(sub.amount, baseCurrency)}</span>
                    <span className="sub-freq-val">/{sub.frequency === 'annual' ? 'año' : 'mes'}</span>
                  </div>
                </div>

                <div className="sub-item-footer">
                  <div className="sub-renewal-info">
                    <span className="sub-renewal-label">Próxima renovación:</span>
                    <span className="sub-renewal-date">{sub.nextRenewal || 'Mensual'}</span>
                  </div>

                  <div className="sub-item-actions">
                    <button
                      type="button"
                      className={`sub-action-toggle ${sub.status === 'active' ? 'active' : 'paused'}`}
                      onClick={() => handleToggleStatus(sub.id)}
                      title={sub.status === 'active' ? 'Pausar suscripción' : 'Reanudar suscripción'}
                    >
                      {sub.status === 'active' ? 'Pausar' : 'Reactivar'}
                    </button>
                    <button
                      type="button"
                      className="sub-action-delete"
                      onClick={() => handleDeleteSub(sub.id, sub.name)}
                      title="Eliminar suscripción"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 2: SMART DETECTION & AUDIT */}
      {activeTab === 'detected' && (
        <div className="sub-detected-container">
          <div className="sub-detected-banner">
            <div className="sub-banner-icon">🤖</div>
            <div>
              <h4 className="sub-banner-title">Motor de Inteligencia de Pagos Periódicos</h4>
              <p className="sub-banner-desc">
                El motor analiza de forma 100% local la periodicidad y montos de tus transacciones para descubrir cargos recurrentes no catalogados y variaciones de precio.
              </p>
            </div>
          </div>

          {detectedSubscriptions.length === 0 ? (
            <div className="sub-empty-state">
              <p>No se encontraron pagos periódicos sin catalogar en tu historial de transacciones.</p>
            </div>
          ) : (
            <div className="sub-detected-grid">
              {detectedSubscriptions.map((item) => (
                <div key={item.id} className="sub-detected-card">
                  <div className="sub-detected-header">
                    <div>
                      <h4 className="sub-det-name">{item.name}</h4>
                      <span className="sub-det-conf">Confianza: {item.confidenceScore}%</span>
                    </div>
                    <div className="sub-det-price">
                      <span className="sub-price-val">{formatCurrency(item.amount, baseCurrency)}</span>
                      <span className="sub-freq-val">/{item.frequency === 'annual' ? 'año' : 'mes'}</span>
                    </div>
                  </div>

                  {item.isPriceHikeDetected && (
                    <div className="sub-hike-badge">
                      ⚠️ ¡Alerta de Aumento! Subió {formatCurrency(item.priceHikeDiff, baseCurrency)} (anteriormente {formatCurrency(item.previousAmount, baseCurrency)})
                    </div>
                  )}

                  <div className="sub-det-footer">
                    <span className="sub-det-occurrences">{item.occurrenceCount} cobro(s) detectado(s)</span>
                    <button
                      type="button"
                      className="sub-btn-convert"
                      onClick={() => handleConvertDetected(item)}
                    >
                      + Guardar como Suscripción
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD SUBSCRIPTION */}
      {isAddModalOpen && (
        <div className="sub-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="sub-modal-card">
            <div className="sub-modal-header">
              <h3 id="modal-title" className="sub-modal-title">Añadir Nueva Suscripción</h3>
              <button
                type="button"
                className="sub-modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="sub-modal-form">
              <div className="sub-form-group">
                <label htmlFor="sub-name">Servicio o Proveedor *</label>
                <input
                  id="sub-name"
                  type="text"
                  className="sub-input"
                  placeholder="Ej. Netflix, Spotify, Amazon Prime, Gimnasio"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="sub-form-row">
                <div className="sub-form-group">
                  <label htmlFor="sub-amount">Importe *</label>
                  <input
                    id="sub-amount"
                    type="number"
                    step="0.01"
                    className="sub-input"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="sub-form-group">
                  <label htmlFor="sub-freq">Frecuencia</label>
                  <select
                    id="sub-freq"
                    className="sub-select"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="annual">Anual</option>
                    <option value="weekly">Semanal</option>
                    <option value="quarterly">Trimestral</option>
                  </select>
                </div>
              </div>

              <div className="sub-form-row">
                <div className="sub-form-group">
                  <label htmlFor="sub-cat">Categoría</label>
                  <select
                    id="sub-cat"
                    className="sub-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {categoriesList.filter((c) => c !== 'ALL').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="sub-form-group">
                  <label htmlFor="sub-renewal">Próxima Renovación</label>
                  <input
                    id="sub-renewal"
                    type="date"
                    className="sub-input"
                    value={formNextRenewal}
                    onChange={(e) => setFormNextRenewal(e.target.value)}
                  />
                </div>
              </div>

              <div className="sub-modal-footer">
                <button
                  type="button"
                  className="sub-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="sub-btn-primary"
                >
                  Guardar Suscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
