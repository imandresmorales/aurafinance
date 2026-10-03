/**
 * useDashboardLayout.js
 * React Hook for persisting and customizing modular dashboard widget visibility and ordering.
 */

import { useState, useCallback, useEffect } from 'react';
import useEncryptedStorage from './useEncryptedStorage';

export const DEFAULT_ANALYTICS_WIDGETS = [
  { id: 'micro-trends', title: 'Micro-Tendencias Estadísticas', visible: true, order: 0 },
  { id: 'windfall-correlation', title: 'Correlación de Ingresos Extraordinarios', visible: true, order: 1 },
  { id: 'financial-radar', title: 'Radar de Salud y Equilibrio', visible: true, order: 2 },
  { id: 'net-worth-area', title: 'Evolución del Patrimonio Neto', visible: true, order: 3 },
  { id: 'cash-flow-timeline', title: 'Flujo de Caja Histórico', visible: true, order: 4 },
  { id: 'income-vs-expense', title: 'Comparativa Ingresos vs Gastos', visible: true, order: 5 },
  { id: 'sankey-flow', title: 'Diagrama Sankey de Trayecto del Dinero', visible: true, order: 6 },
  { id: 'spending-heatmap', title: 'Mapa de Calor de Consumo', visible: true, order: 7 },
  { id: 'waterfall-balance', title: 'Gráfico de Cascada (Waterfall)', visible: true, order: 8 },
  { id: 'category-donut', title: 'Distribución por Categorías', visible: true, order: 9 },
];

export function useDashboardLayout(storageKey = 'aurafinance_analytics_layout') {
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_ANALYTICS_WIDGETS;
  });

  const saveLayout = useCallback((newWidgets) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newWidgets));
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggleWidgetVisibility = useCallback((widgetId) => {
    setWidgets((prev) => {
      const updated = prev.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      );
      saveLayout(updated);
      return updated;
    });
  }, [saveLayout]);

  const moveWidget = useCallback((index, direction) => {
    setWidgets((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);

      // Re-index orders
      const normalized = updated.map((w, idx) => ({ ...w, order: idx }));
      saveLayout(normalized);
      return normalized;
    });
  }, [saveLayout]);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_ANALYTICS_WIDGETS);
    saveLayout(DEFAULT_ANALYTICS_WIDGETS);
  }, [saveLayout]);

  return {
    widgets,
    toggleWidgetVisibility,
    moveWidget,
    resetLayout,
  };
}
export default useDashboardLayout;
