/**
 * AuraFinance IndexedDB Engine
 * Motor transaccional local sobre IndexedDB con índices optimizados
 * para alto volumen de transacciones, cuentas, bitácoras y metadatos.
 */

const DB_NAME = 'AuraFinanceDB';
const DB_VERSION = 1;

export const STORES = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
};

/**
 * Abre o inicializa la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
export const openDatabase = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está soportado en este entorno.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Almacén de Transacciones con índices de búsqueda rápida
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('accountId', 'accountId', { unique: false });
        txStore.createIndex('category', 'category', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
      }

      // Almacén de Cuentas / Billeteras
      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        const accStore = db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
        accStore.createIndex('name', 'name', { unique: false });
        accStore.createIndex('currency', 'currency', { unique: false });
      }

      // Almacén de Bitácora de Auditoría
      if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
        const auditStore = db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id', autoIncrement: true });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        auditStore.createIndex('eventType', 'eventType', { unique: false });
      }

      // Almacén de Ajustes
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Guarda o actualiza un registro en un almacén
 */
export const dbPut = async (storeName, data) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Obtiene un registro por su clave
 */
export const dbGet = async (storeName, key) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Obtiene todos los registros de un almacén
 */
export const dbGetAll = async (storeName) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Elimina un registro por su clave
 */
export const dbDelete = async (storeName, key) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Limpia todos los registros de un almacén
 */
export const dbClear = async (storeName) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};
