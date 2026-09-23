import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { saveEncryptedRecord, loadEncryptedRecord } from '../crypto';

/**
 * Hook reactivo para persistencia local cifrada con autenticación AES-256-GCM y verificación anti-manipulación SHA-256
 * @param {string} key - Clave del registro en la bóveda
 * @param {any} initialValue - Valor inicial por defecto si el registro no existe
 */
export function useEncryptedStorage(key, initialValue) {
  const { masterKey, isAuthenticated, isLocked } = useAuth();
  const toast = useToast();

  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar y descifrar el registro al montar o cuando la llave maestra cambie
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!isAuthenticated || isLocked || !masterKey) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const decryptedData = await loadEncryptedRecord(key, masterKey);
        if (isMounted) {
          if (decryptedData !== null && decryptedData !== undefined) {
            setStoredValue(decryptedData);
          } else {
            setStoredValue(initialValue);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          console.error(`Error en useEncryptedStorage para '${key}':`, err);
          toast?.error(
            `Fallo de verificación de integridad en '${key}'. Los datos podrían haber sido alterados fuera de la bóveda.`,
            'Alerta de Seguridad'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key, masterKey, isAuthenticated, isLocked]);

  // Función para guardar datos cifrados
  const setValue = useCallback(
    async (value) => {
      try {
        const valueToStore = typeof value === 'function' ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (masterKey) {
          await saveEncryptedRecord(key, valueToStore, masterKey);
        }
      } catch (err) {
        setError(err.message);
        console.error(`Error al guardar en useEncryptedStorage para '${key}':`, err);
        toast?.error(`No se pudieron guardar los cambios cifrados para '${key}'.`);
      }
    },
    [key, masterKey, storedValue, toast]
  );

  return [storedValue, setValue, { isLoading, error, isEncrypted: Boolean(masterKey) }];
}

export default useEncryptedStorage;
