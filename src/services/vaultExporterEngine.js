import { deriveMasterKey, encryptData, generateSalt, bufferToBase64 } from '../crypto';

/**
 * Vault Exporter Engine
 * Exporta el estado completo de la bóveda (transacciones, cuentas, presupuestos)
 * a CSV plano o archivo JSON fuertemente cifrado con AES-256-GCM y PBKDF2.
 */

/**
 * Exporta una lista de transacciones a formato CSV estándar con descarga inmediata
 * @param {Array<any>} transactions
 * @param {string} [filename='aurafinance_export.csv']
 */
export const exportTransactionsToCSV = (transactions, filename = 'aurafinance_export.csv') => {
  if (!transactions || !transactions.length) return false;

  const headers = ['ID', 'Fecha', 'Descripcion', 'Monto', 'Tipo', 'Categoria', 'Cuenta'];
  const csvRows = [headers.join(',')];

  transactions.forEach((tx) => {
    const row = [
      `"${tx.id || ''}"`,
      `"${tx.date || ''}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.amount || 0,
      `"${tx.type || ''}"`,
      `"${(tx.category || '').replace(/"/g, '""')}"`,
      `"${(tx.accountId || '').replace(/"/g, '""')}"`,
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerBrowserDownload(blob, filename);
  return true;
};

/**
 * Exporta toda la bóveda cifrada con contraseña en formato JSON AES-256-GCM
 * @param {any} vaultData
 * @param {string} passphrase
 * @param {string} [filename='aurafinance_vault_backup.json']
 */
export const exportEncryptedVaultJSON = async (vaultData, passphrase, filename = 'aurafinance_vault_backup.json') => {
  if (!vaultData || !passphrase) {
    throw new Error('Se requiere la carga de la bóveda y una contraseña para el cifrado.');
  }

  const salt = generateSalt(16);
  const key = await deriveMasterKey(passphrase, salt, 100000);
  const encryptedPayload = await encryptData(vaultData, key);

  const exportPackage = {
    auraVersion: '1.0',
    exportedAt: new Date().toISOString(),
    crypto: {
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256',
      iterations: 100000,
      salt: bufferToBase64(salt),
    },
    payload: encryptedPayload,
  };

  const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
  triggerBrowserDownload(blob, filename);
  return true;
};

const triggerBrowserDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default { exportTransactionsToCSV, exportEncryptedVaultJSON };
