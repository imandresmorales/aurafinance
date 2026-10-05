import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { formatCurrency } from '../../utils';
import { generateBillAlerts } from '../../services/billAlertEngine';
import './UpcomingBillsWidget.css';

export function UpcomingBillsWidget({
  bills: customBills,
  daysWindow = 7,
  referenceDate = null,
  onPayBill = null,
}) {
  const { wallets = [], subscriptions = [], baseCurrency = 'USD' } = useAccounts();
  const { addToast } = useToast();

  const [paidBillIds, setPaidBillIds] = useState(new Set());

  // Default fallback recurring commitments if none in context
  const defaultBills = useMemo(() => [
    {
      id: 'bill-cloud',
      name: 'AWS Cloud Hosting',
      amount: 145.50,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Infraestructura',
      frequency: 'monthly',
      walletId: wallets[0]?.id || 'wallet-main',
    },
    {
      id: 'bill-rent',
      name: 'Alquiler Oficina / Coworking',
      amount: 850.00,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Vivienda / Oficina',
      frequency: 'monthly',
      walletId: wallets[0]?.id || 'wallet-main',
    },
    {
      id: 'bill-fiber',
      name: 'Fibra Óptica 1Gbps',
      amount: 60.00,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Servicios',
      frequency: 'monthly',
      walletId: wallets[0]?.id || 'wallet-main',
    },
    {
      id: 'bill-insurance',
      name: 'Seguro Médico Premium',
      amount: 210.00,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Salud',
      frequency: 'monthly',
      walletId: wallets[0]?.id || 'wallet-main',
    },
  ], [wallets]);

  // Combine subscriptions and bills
  const allBills = useMemo(() => {
    if (Array.isArray(customBills)) return customBills;
    if (subscriptions && subscriptions.length > 0) {
      return subscriptions.map(s => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        dueDate: s.nextRenewal || s.dueDate,
        category: s.category || 'Suscripción',
        frequency: s.frequency || 'monthly',
        walletId: s.walletId,
      }));
    }
    return defaultBills;
  }, [customBills, subscriptions, defaultBills]);

  const totalLiquid = useMemo(() => {
    return wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0) || 1200;
  }, [wallets]);

  // Today reference (timezone-safe)
  const today = useMemo(() => {
    if (referenceDate) {
      if (typeof referenceDate === 'string' && referenceDate.includes('-')) {
        const parts = referenceDate.split('-');
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      }
      const d = new Date(referenceDate);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    }
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  }, [referenceDate]);

  // Filter bills within next X days window
  const upcomingList = useMemo(() => {
    return allBills
      .filter((b) => !paidBillIds.has(b.id))
      .map((b) => {
        let billDate;
        if (b.dueDate) {
          const parts = b.dueDate.split('-');
          if (parts.length === 3) {
            billDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
          } else {
            billDate = new Date(b.dueDate);
          }
        } else {
          billDate = today;
        }

        const diffTime = billDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...b,
          billDateObj: billDate,
          daysUntil: diffDays,
        };
      })
      .filter((b) => b.daysUntil >= 0 && b.daysUntil <= daysWindow)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [allBills, today, daysWindow, paidBillIds]);

  const totalUpcomingAmount = useMemo(() => {
    return upcomingList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [upcomingList]);

  const hasLiquidityAlert = totalUpcomingAmount > totalLiquid;
  const liquidityDeficit = totalUpcomingAmount - totalLiquid;

  const handleMarkAsPaid = (bill) => {
    setPaidBillIds((prev) => new Set([...prev, bill.id]));
    if (onPayBill) {
      onPayBill(bill);
    }
    if (addToast) {
      addToast(`Pago de ${bill.name} (${formatCurrency(bill.amount, baseCurrency)}) registrado correctamente.`, 'success');
    }
  };

  const getUrgencyBadge = (daysUntil) => {
    if (daysUntil === 0) {
      return <span className="bill-badge-urgent blink">¡VENCE HOY!</span>;
    }
    if (daysUntil === 1) {
      return <span className="bill-badge-warning">Mañana</span>;
    }
    return <span className="bill-badge-normal">En {daysUntil} días</span>;
  };

  return (
    <div className="upcoming-bills-widget glass-card" data-testid="upcoming-bills-widget">
      <div className="upcoming-bills-header">
        <div className="upcoming-bills-title-group">
          <span className="upcoming-icon">📅</span>
          <div>
            <h3 className="upcoming-title">Próximos Pagos ({daysWindow} días)</h3>
            <span className="upcoming-subtitle">
              {upcomingList.length} {upcomingList.length === 1 ? 'compromiso pendiente' : 'compromisos pendientes'}
            </span>
          </div>
        </div>

        <div className="upcoming-total-pill">
          <span className="upcoming-total-label">Total a Pagar:</span>
          <span className="upcoming-total-val text-gradient-emerald">
            {formatCurrency(totalUpcomingAmount, baseCurrency)}
          </span>
        </div>
      </div>

      {hasLiquidityAlert && (
        <div className="upcoming-liquidity-warning" role="alert">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            <strong>Alerta de Liquidez:</strong> El total de pagos en {daysWindow} días supera tu saldo disponible en{' '}
            <span className="deficit-val">{formatCurrency(liquidityDeficit, baseCurrency)}</span>.
          </div>
        </div>
      )}

      {upcomingList.length === 0 ? (
        <div className="upcoming-empty-state" data-testid="upcoming-empty">
          <span className="empty-emoji">🎉</span>
          <p className="empty-title">¡Sin pagos pendientes!</p>
          <p className="empty-desc">No hay facturas ni suscripciones con vencimiento en los próximos {daysWindow} días.</p>
        </div>
      ) : (
        <div className="upcoming-bills-list" role="list">
          {upcomingList.map((bill) => (
            <div
              key={bill.id}
              className={`upcoming-bill-item ${bill.daysUntil === 0 ? 'due-today' : ''}`}
              role="listitem"
              data-testid={`upcoming-item-${bill.id}`}
            >
              <div className="bill-item-main">
                <div className="bill-item-info">
                  <span className="bill-name">{bill.name}</span>
                  <div className="bill-meta">
                    <span className="bill-category">{bill.category}</span>
                    <span className="bill-dot">•</span>
                    <span className="bill-date">{bill.dueDate}</span>
                  </div>
                </div>
                {getUrgencyBadge(bill.daysUntil)}
              </div>

              <div className="bill-item-actions">
                <span className="bill-amount">{formatCurrency(bill.amount, baseCurrency)}</span>
                <button
                  type="button"
                  className="bill-pay-btn glass-button primary"
                  onClick={() => handleMarkAsPaid(bill)}
                  aria-label={`Marcar ${bill.name} como pagado`}
                >
                  ✓ Pagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingBillsWidget;
