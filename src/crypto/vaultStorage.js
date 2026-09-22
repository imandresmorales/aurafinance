import { encryptData, decryptData } from './encryption';
import { hashSHA256 } from './keyDerivation';

const VAULT_PREFIX = 'aura_vault_';

/**
 * Guarda un registro financiero cifrado en el almacenamiento local con checksum SHA-256 de integridad
 */
export async function saveEncryptedRecord(key, data, cryptoKey) {
  const encryptedPayload = await encryptData(data, cryptoKey);
  const rawString = JSON.stringify(encryptedPayload);
  const checksum = await hashSHA256(rawString);

  const container = {
    data: encryptedPayload,
    checksum,
    updatedAt: Date.now(),
  };

  localStorage.setItem(`${VAULT_PREFIX}${key}`, JSON.stringify(container));
  return container;
}

/**
 * Carga y descifra un registro financiero del almacenamiento local validando su checksum
 */
export async function loadEncryptedRecord(key, cryptoKey) {
  const rawContainer = localStorage.getItem(`${VAULT_PREFIX}${key}`);
  if (!rawContainer) return null;

  const container = JSON.parse(rawContainer);
  const rawDataString = JSON.stringify(container.data);
  const calculatedChecksum = await hashSHA256(rawDataString);

  if (calculatedChecksum !== container.checksum) {
    throw new Error(`Alerta de seguridad: Checksum alterado en el registro '${key}'. Posible manipulación.`);
  }

  return await decryptData(container.data, cryptoKey);
}
