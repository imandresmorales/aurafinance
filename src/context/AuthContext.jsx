import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  generateSalt,
  deriveMasterKey,
  deriveAuthHash,
  bufferToBase64,
  base64ToBuffer,
} from '../crypto';

export const AuthContext = createContext(null);

const VAULT_META_KEY = 'aura_vault_meta';
const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutos por defecto

export function AuthProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [masterKey, setMasterKey] = useState(null); // Clave criptográfica en memoria volátil únicamente
  const [userProfile, setUserProfile] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  const lockTimerRef = useRef(null);

  // Comprobar si ya existe una bóveda inicializada localmente
  useEffect(() => {
    try {
      const meta = localStorage.getItem(VAULT_META_KEY);
      if (meta) {
        const parsed = JSON.parse(meta);
        setIsInitialized(true);
        setUserProfile({ alias: parsed.alias, createdAt: parsed.createdAt });
      } else {
        setIsInitialized(false);
      }
    } catch (e) {
      console.error('Error al leer metadata de la bóveda:', e);
      setIsInitialized(false);
    }
  }, []);

  // Función para rotar o generar token volátil de sesión
  const rotateSessionToken = useCallback(() => {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    const token = bufferToBase64(array);
    setSessionToken(token);
    return token;
  }, []);

  // Bloquear la bóveda y purgar claves de memoria
  const lockVault = useCallback(() => {
    setMasterKey(null);
    setIsAuthenticated(false);
    setIsLocked(true);
    setSessionToken(null);
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  // Reiniciar temporizador de auto-bloqueo por inactividad
  const resetAutoLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = setTimeout(() => {
      lockVault();
    }, DEFAULT_AUTO_LOCK_MS);
  }, [lockVault]);

  // Escuchar actividad del usuario para reiniciar el temporizador de inactividad
  useEffect(() => {
    if (!isAuthenticated || isLocked) return;

    const handleUserActivity = () => {
      resetAutoLockTimer();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));
    resetAutoLockTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }
    };
  }, [isAuthenticated, isLocked, resetAutoLockTimer]);

  // Registrar nueva bóveda Cero-Conocimiento
  const registerVault = async (alias, passphrase) => {
    const salt = generateSalt(16);
    const saltBase64 = bufferToBase64(salt);
    const authHash = await deriveAuthHash(passphrase, salt, 100000);
    const key = await deriveMasterKey(passphrase, salt, 100000);

    const meta = {
      alias: alias.trim() || 'Titular de Bóveda',
      salt: saltBase64,
      authHash,
      createdAt: Date.now(),
      v: 1,
    };

    localStorage.setItem(VAULT_META_KEY, JSON.stringify(meta));

    setIsInitialized(true);
    setUserProfile({ alias: meta.alias, createdAt: meta.createdAt });
    setMasterKey(key);
    setIsAuthenticated(true);
    setIsLocked(false);
    rotateSessionToken();
    resetAutoLockTimer();

    return true;
  };

  // Desbloquear bóveda existente
  const unlockVault = async (passphrase) => {
    const metaRaw = localStorage.getItem(VAULT_META_KEY);
    if (!metaRaw) {
      throw new Error('No existe ninguna bóveda inicializada.');
    }

    const meta = JSON.parse(metaRaw);
    const saltBuffer = base64ToBuffer(meta.salt);
    const computedAuthHash = await deriveAuthHash(passphrase, saltBuffer, 100000);

    if (computedAuthHash !== meta.authHash) {
      throw new Error('Frase de paso incorrecta. Acceso denegado.');
    }

    const key = await deriveMasterKey(passphrase, saltBuffer, 100000);

    setMasterKey(key);
    setIsAuthenticated(true);
    setIsLocked(false);
    setUserProfile({ alias: meta.alias, createdAt: meta.createdAt });
    rotateSessionToken();
    resetAutoLockTimer();

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        isInitialized,
        isAuthenticated,
        isLocked,
        masterKey,
        userProfile,
        sessionToken,
        registerVault,
        unlockVault,
        lockVault,
        resetAutoLockTimer,
        rotateSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
