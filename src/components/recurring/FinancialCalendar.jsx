import React, { useState, useMemo } from 'react';
import { useAccounts, useToast } from '../../hooks';
import {
  generateCalendarGrid,
  mapEventsToCalendarGrid,
  calculateMonthCalendarSummary,
} from '../../services/financialCalendarEngine';
import { generateProjectedOccurrences } from '../../services/recurringEngine';
import { formatCurrency } from '../../utils';
import './FinancialCalendar.css';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function FinancialCalendar() {
  const {
    transactions = [],
    recurringRules = [],
    wallets = [],
    baseCurrency = 'USD',
  } = useAccounts();

  const { addToast } = useToast();

  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDateStr, setSelectedDateStr] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline' | 'list'

  // Default demo recurring rules if none set in context
  const effectiveRules = useMemo(() => {
    if (recurringRules && recurringRules.length > 0) return recurringRules;
    return [
      {
        id: 'rec-rent',
        name: 'Alquiler Residencia',
        amount: 850,
        type: 'expense',
        frequency: 'monthly',
        startDate: `${currentYear}-01-05`,
        category: 'Vivienda',
      },
      {
        id: 'rec-salary',
        name: 'Nómina Empresa',
        amount: 2800,
        type: 'income',
        frequency: 'monthly',
        startDate: `${currentYear}-01-25`,
        category: 'Salario',
      },
      {
        id: 'rec-netflix',
        name: 'Netflix 4K',
        amount: 17.99,
        type: 'expense',
        frequency: 'monthly',
        startDate: `${currentYear}-01-15`,
        isSubscription: true,
        category: 'Streaming',
      },
      {
        id: 'rec-gym',
        name: 'Cuota Gimnasio',
        amount: 39.99,
        type: 'expense',
        frequency: 'monthly',
        startDate: `${currentYear}-01-10`,
        isSubscription: true,
        category: 'Salud',
      },
    ];
  }, [recurringRules, currentYear]);

  // Generate monthly projections for current view month
  const projectedOccurrences = useMemo(() => {
    const startDate = new Date(currentYear, currentMonth - 1, 20);
    const endDate = new Date(currentYear, currentMonth + 1, 15);
    return generateProjectedOccurrences(effectiveRules, startDate, endDate);
  }, [effectiveRules, currentYear, currentMonth]);

  // Generate and enrich calendar grid
  const calendarCells = useMemo(() => {
    const baseGrid = generateCalendarGrid(currentYear, currentMonth);
    return mapEventsToCalendarGrid(baseGrid, transactions, projectedOccurrences);
  }, [currentYear, currentMonth, transactions, projectedOccurrences]);

  // Monthly Summary
  const summary = useMemo(() => {
    return calculateMonthCalendarSummary(calendarCells, baseCurrency);
  }, [calendarCells, baseCurrency]);

  // Selected Cell
  const selectedCell = useMemo(() => {
    return calendarCells.find((c) => c.dateStr === selectedDateStr) || null;
  }, [calendarCells, selectedDateStr]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    );
  };

  const handleConfirmProjected = (eventItem) => {
    addToast(`Pago proyectado "${eventItem.name}" confirmado en el libro contable.`, 'success');
  };

  return (
    <div className="financial-calendar-container" role="region" aria-label="Calendario Financiero de Compromisos">
      {/* Header & Controls */}
      <div className="cal-header-card">
        <div className="cal-header-main">
          <div className="cal-badge">Agenda Financiera & Proyección</div>
          <h2 className="cal-title">Calendario de Compromisos</h2>
          <p className="cal-subtitle">
            Visualiza pagos recurrentes, vencimientos de facturas y fechas de cobro proyectadas.
          </p>
        </div>

        <div className="cal-nav-controls">
          <div className="cal-month-stepper">
            <button
              type="button"
              className="cal-btn-step"
              onClick={handlePrevMonth}
              title="Mes anterior"
            >
              ◀
            </button>
            <span className="cal-current-month-label">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              className="cal-btn-step"
              onClick={handleNextMonth}
              title="Mes siguiente"
            >
              ▶
            </button>
          </div>

          <button
            type="button"
            className="cal-btn-today"
            onClick={handleGoToToday}
          >
            Hoy
          </button>

          {/* View Switcher */}
          <div className="cal-view-switch" role="group" aria-label="Modo de visualización">
            <button
              type="button"
              className={`cal-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              📅 Mes
            </button>
            <button
              type="button"
              className={`cal-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 Lista
            </button>
          </div>
        </div>
      </div>

      {/* KPI Monthly Summary Bar */}
      <div className="cal-kpi-bar">
        <div className="cal-kpi-item">
          <span className="cal-kpi-label">Ingresos Esperados</span>
          <span className="cal-kpi-val positive">{formatCurrency(summary.grandTotalIncome, baseCurrency)}</span>
          <span className="cal-kpi-note">Real: {formatCurrency(summary.actualIncome, baseCurrency)} | Proy: {formatCurrency(summary.projectedIncome, baseCurrency)}</span>
        </div>

        <div className="cal-kpi-item">
          <span className="cal-kpi-label">Gastos & Compromisos</span>
          <span className="cal-kpi-val negative">{formatCurrency(summary.grandTotalExpense, baseCurrency)}</span>
          <span className="cal-kpi-note">Real: {formatCurrency(summary.actualExpense, baseCurrency)} | Proy: {formatCurrency(summary.projectedExpense, baseCurrency)}</span>
        </div>

        <div className="cal-kpi-item">
          <span className="cal-kpi-label">Balance Neto Estimado</span>
          <span className={`cal-kpi-val ${summary.projectedMonthEndBalance >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(summary.projectedMonthEndBalance, baseCurrency)}
          </span>
          <span className="cal-kpi-note">Cierre estimado de mes</span>
        </div>

        <div className="cal-kpi-item">
          <span className="cal-kpi-label">Pico de Mayor Gasto</span>
          <span className="cal-kpi-val highlight">
            {summary.peakExpenseDay ? `${summary.peakExpenseDay.date.slice(8)} de ${MONTH_NAMES[currentMonth].slice(0, 3)}` : 'N/A'}
          </span>
          <span className="cal-kpi-note">{summary.peakExpenseDay ? formatCurrency(summary.peakExpenseDay.amount, baseCurrency) : 'Sin gastos'}</span>
        </div>
      </div>

      {/* VIEW MODE 1: GRID CALENDAR */}
      {viewMode === 'grid' && (
        <div className="cal-layout-grid">
          {/* Calendar Grid Box */}
          <div className="cal-grid-card">
            {/* Weekday Labels Header */}
            <div className="cal-weekdays-row">
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className="cal-weekday-cell">
                  {w}
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="cal-days-matrix">
              {calendarCells.map((cell) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const totalEvents = cell.events.length;
                const hasIncome = cell.actualIncome > 0 || cell.projectedIncome > 0;
                const hasExpense = cell.actualExpense > 0 || cell.projectedExpense > 0;

                return (
                  <div
                    key={cell.dateStr}
                    tabIndex={0}
                    role="button"
                    aria-label={`Día ${cell.dayNumber} de ${cell.isCurrentMonth ? MONTH_NAMES[currentMonth] : 'mes adyacente'}, ${totalEvents} eventos`}
                    className={`cal-day-cell ${!cell.isCurrentMonth ? 'outside-month' : ''} ${isSelected ? 'selected' : ''} ${cell.pressureType}`}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDateStr(cell.dateStr);
                      }
                    }}
                  >
                    <div className="cal-day-number-row">
                      <span className="cal-day-number">{cell.dayNumber}</span>
                      {totalEvents > 0 && (
                        <span className="cal-event-count-dot">{totalEvents}</span>
                      )}
                    </div>

                    {/* Compact Day Badges */}
                    <div className="cal-day-pills">
                      {hasIncome && (
                        <div className="cal-pill income">
                          +{(cell.actualIncome + cell.projectedIncome) >= 1000 ? `${Math.round((cell.actualIncome + cell.projectedIncome)/1000)}k` : formatCurrency(cell.actualIncome + cell.projectedIncome, baseCurrency)}
                        </div>
                      )}
                      {hasExpense && (
                        <div className="cal-pill expense">
                          -{(cell.actualExpense + cell.projectedExpense) >= 1000 ? `${Math.round((cell.actualExpense + cell.projectedExpense)/1000)}k` : formatCurrency(cell.actualExpense + cell.projectedExpense, baseCurrency)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector Side Panel */}
          <div className="cal-day-inspector-card">
            <div className="cal-inspector-header">
              <span className="cal-inspector-tag">Detalle del Día</span>
              <h3 className="cal-inspector-date">{selectedDateStr}</h3>
            </div>

            {selectedCell && (
              <div className="cal-inspector-body">
                {/* Day Summary */}
                <div className="cal-inspector-summary">
                  <div className="cal-ins-stat">
                    <span>Ingresos:</span>
                    <strong className="positive">+{formatCurrency(selectedCell.actualIncome + selectedCell.projectedIncome, baseCurrency)}</strong>
                  </div>
                  <div className="cal-ins-stat">
                    <span>Gastos:</span>
                    <strong className="negative">-{formatCurrency(selectedCell.actualExpense + selectedCell.projectedExpense, baseCurrency)}</strong>
                  </div>
                  <div className="cal-ins-stat total">
                    <span>Neto:</span>
                    <strong className={selectedCell.netFlow >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(selectedCell.netFlow, baseCurrency)}
                    </strong>
                  </div>
                </div>

                {/* Events list */}
                <div className="cal-events-list">
                  <h4 className="cal-events-title">Compromisos & Transacciones ({selectedCell.events.length})</h4>
                  {selectedCell.events.length === 0 ? (
                    <div className="cal-events-empty">
                      <p>No hay transacciones ni vencimientos agendados para este día.</p>
                    </div>
                  ) : (
                    selectedCell.events.map((evt) => (
                      <div key={evt.id} className={`cal-event-card ${evt.type} ${evt.isProjected ? 'projected' : 'actual'}`}>
                        <div className="cal-evt-top">
                          <span className="cal-evt-name">{evt.name}</span>
                          <span className={`cal-evt-amount ${evt.type === 'income' ? 'positive' : 'negative'}`}>
                            {evt.type === 'income' ? '+' : '-'}{formatCurrency(evt.amount, baseCurrency)}
                          </span>
                        </div>

                        <div className="cal-evt-bottom">
                          <span className="cal-evt-cat">{evt.category}</span>
                          <span className={`cal-evt-badge ${evt.isProjected ? 'badge-proj' : 'badge-real'}`}>
                            {evt.isProjected ? '⏳ Programado' : '✓ Ejecutado'}
                          </span>
                        </div>

                        {evt.isProjected && (
                          <button
                            type="button"
                            className="cal-btn-confirm-evt"
                            onClick={() => handleConfirmProjected(evt)}
                          >
                            ✓ Registrar Ahora
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CHRONOLOGICAL LIST */}
      {viewMode === 'list' && (
        <div className="cal-list-view-card">
          <h3 className="cal-list-title">Lista Cronológica de Vencimientos de {MONTH_NAMES[currentMonth]} {currentYear}</h3>

          <div className="cal-chronological-feed">
            {calendarCells
              .filter((c) => c.isCurrentMonth && c.events.length > 0)
              .map((cell) => (
                <div key={cell.dateStr} className="cal-feed-group">
                  <div className="cal-feed-date-badge">
                    <span className="feed-day">{cell.dayNumber}</span>
                    <span className="feed-month">{MONTH_NAMES[currentMonth].slice(0, 3)}</span>
                  </div>

                  <div className="cal-feed-events">
                    {cell.events.map((evt) => (
                      <div key={evt.id} className="cal-feed-event-item">
                        <div>
                          <h4 className="cal-feed-name">{evt.name}</h4>
                          <span className="cal-feed-category">{evt.category} • {evt.isProjected ? 'Proyectado' : 'Real'}</span>
                        </div>
                        <div className="cal-feed-pricing">
                          <span className={`cal-feed-amt ${evt.type === 'income' ? 'positive' : 'negative'}`}>
                            {evt.type === 'income' ? '+' : '-'}{formatCurrency(evt.amount, baseCurrency)}
                          </span>
                          {evt.isProjected && (
                            <button
                              type="button"
                              className="cal-feed-action-btn"
                              onClick={() => handleConfirmProjected(evt)}
                            >
                              Confirmar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
