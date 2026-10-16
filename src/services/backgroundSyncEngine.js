/**
 * Background Sync Engine
 * Encola operaciones financieras generadas offline y las procesa
 * automáticamente al recuperar la conectividad con el exterior.
 */

const SYNC_QUEUE_KEY = 'aura_offline_sync_queue';

/**
 * Encola una operación en segundo plano
 * @param {'CREATE' | 'UPDATE' | 'DELETE'} action
 * @param {string} entity
 * @param {any} payload
 */
export const queueOfflineOperation = (action, entity, payload) => {
  const item = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    entity,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    const rawQueue = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue = rawQueue ? JSON.parse(rawQueue) : [];
    queue.push(item);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('aura:sync-queued', { detail: item }));
  } catch (err) {
    // Manejo de cuota
  }

  return item;
};

/**
 * Obtiene la lista actual de operaciones encoladas pendientes
 */
export const getOfflineSyncQueue = () => {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Procesa la cola de sincronización
 * @param {(item: any) => Promise<boolean>} processor
 */
export const processSyncQueue = async (processor) => {
  const queue = getOfflineSyncQueue();
  if (!queue.length) return { processed: 0, remaining: 0 };

  const remaining = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      const success = processor ? await processor(item) : true;
      if (success) {
        processedCount++;
      } else {
        item.retryCount += 1;
        remaining.push(item);
      }
    } catch (err) {
      item.retryCount += 1;
      remaining.push(item);
    }
  }

  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
  window.dispatchEvent(new CustomEvent('aura:sync-completed', { detail: { processed: processedCount, remaining: remaining.length } }));

  return { processed: processedCount, remaining: remaining.length };
};

/**
 * Limpia todas las operaciones encoladas
 */
export const clearSyncQueue = () => {
  localStorage.removeItem(SYNC_QUEUE_KEY);
};
