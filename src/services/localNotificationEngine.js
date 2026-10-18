/**
 * Local Browser Notifications Engine
 * Gestiona el permiso y la emisión de notificaciones nativas en el navegador
 * para presupuestos rebasados, vencimientos de facturas y eventos de seguridad.
 */

/**
 * Solicita permiso de notificaciones nativas del navegador
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Emite una notificación local de alerta financiera
 * @param {string} title
 * @param {{ body: string, icon?: string, tag?: string }} options
 */
export const notifyFinancialAlert = async (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
  }

  const defaultIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  try {
    return new Notification(title, {
      icon: options.icon || defaultIcon,
      body: options.body || '',
      tag: options.tag || 'aurafinance-alert',
      badge: defaultIcon,
      silent: false,
    });
  } catch (err) {
    // Entornos móviles donde Notification requiere el Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      const reg = await navigator.serviceWorker.ready;
      return reg.showNotification(title, {
        icon: options.icon || defaultIcon,
        body: options.body || '',
        tag: options.tag || 'aurafinance-alert',
      });
    }
  }

  return null;
};

export default { requestNotificationPermission, notifyFinancialAlert };
