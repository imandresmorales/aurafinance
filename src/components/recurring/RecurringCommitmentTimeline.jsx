import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import { generateProjectedOccurrences } from '../../services/recurringEngine';
import { formatCurrency } from '../../utils';
import './RecurringCommitmentTimeline.css';

export default function RecurringCommitmentTimeline() {
  const {
    transactions = [],
    recurringRules = [],
    wallets = [],
    baseCurrency = 'USD',
  } = useAccounts();

  const { addToast } = useToast();
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE' | 'SUBSCRIPTION'

  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const currentMonthEnd = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today]);

  const monthName = currentMonthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Default demo recurring rules if none
  const effectiveRules = useMemo(() => {
    if (recurringRules && recurringRules.length > 0) return recurringRules;
    return [
      { id: 'r1', name: 'Alquiler Vivienda', amount: 850, type: 'expense', frequency: 'monthly', startDate: `${today.getFullYear()}-10-05`, category: 'Vivienda' },
      { id: 'r2', name: 'Cuota Gimnasio', amount: 39.99, type: 'expense', frequency: 'monthly', startDate: `${today.getFullYear()}-10-10`, isSubscription: true, category: 'Salud' },
      { id: 'r3', name: 'Netflix 4K', amount: 17.99, type: 'expense', frequency: 'monthly', startDate: `${today.getFullYear()}-10-15`, isSubscription: true, category: 'Streaming' },
      { id: 'r4', name: 'Nómina Salarial', amount: 2800, type: 'income', frequency: 'monthly', startDate: `${today.getFullYear()}-10-25`, category: 'Salario' },
      { id: 'r5', name: 'Fibra Óptica & Móvil', amount: 45.00, type: 'expense', frequency: 'monthly', startDate: `${today.getFullYear()}-10-28`, category: 'Servicios' },
    ];
  }, [recurringRules, today]);

  // Combine actual transactions this month with projected recurring items
  const timelineItems = useMemo(() => {
    const projected = generateProjectedOccurrences(effectiveRules, currentMonthStart, currentMonthEnd);

    // Normalize and combine
    const combined = [];

    // Add projected items
    projected.forEach((p) => {
      combined.push({
        id: p.id,
        name: p.name,
        amount: p.amount,
        type: p.type,
        category: p.category,
        date: p.date,
        isProjected: true,
        isSubscription: p.isSubscription,
      });
    });

    // Sort chronologically
    return combined.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [effectiveRules, currentMonthStart, currentMonthEnd]);

  // Filter items
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => {
      if (filterType === 'INCOME') return item.type === 'income';
      if (filterType === 'EXPENSE') return item.type === 'expense';
      if (filterType === 'SUBSCRIPTION') return item.isSubscription;
      return true;
    });
  }, [timelineItems, filterType]);

  const handleMarkPaid = (item) => {
    addToast(`"${item.name}" marcado como pagado exitosamente.`, 'success');
  };

  return (
    <div className="recurring-timeline-card" role="region" aria-label="Línea de Tiempo de Compromisos del Mes">
      <div className="r-timeline-header">
        <div>
          <div className="r-timeline-badge">Línea de Tiempo Mensual</div>
          <h3 className="r-timeline-title">Compromisos de {monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h3>
        </div>

        {/* Filter Pills */}
        <div className="r-timeline-filters" role="group" aria-label="Filtros de compromisos">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'INCOME', label: 'Ingresos' },
            { id: 'EXPENSE', label: 'Gastos' },
            { id: 'SUBSCRIPTION', label: 'Suscripciones' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`r-pill-btn ${filterType === f.id ? 'active' : ''}`}
              onClick={() => setFilterType(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline track */}
      <div className="r-timeline-track">
        {filteredItems.length === 0 ? (
          <div className="r-timeline-empty">
            <p>No hay compromisos agendados para este filtro.</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isIncome = item.type === 'income';
            const isToday = item.date === today.toISOString().split('T')[0];

            return (
              <div key={item.id || idx} className={`r-timeline-node ${isIncome ? 'income' : 'expense'} ${isToday ? 'today' : ''}`}>
                {/* Connector Line & Dot */}
                <div className="r-node-connector">
                  <div className="r-node-dot" />
                  {idx < filteredItems.length - 1 && <div className="r-node-line" />}
                </div>

                {/* Content Box */}
                <div className="r-node-content">
                  <div className="r-node-left">
                    <span className="r-node-date">{item.date}</span>
                    <h4 className="r-node-name">{item.name}</h4>
                    <div className="r-node-tags">
                      <span className="r-node-tag-cat">{item.category}</span>
                      {item.isSubscription && <span className="r-node-tag-sub">⭐ Suscripción</span>}
                    </div>
                  </div>

                  <div className="r-node-right">
                    <span className={`r-node-amount ${isIncome ? 'positive' : 'negative'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(item.amount, baseCurrency)}
                    </span>
                    <button
                      type="button"
                      className="r-node-btn-action"
                      onClick={() => handleMarkPaid(item)}
                    >
                      ✓ Confirmar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
