const RATE_LIMIT_STORAGE_KEY = 'aura_auth_rate_limit';

/**
 * Gestor de protección contra ataques de fuerza bruta en cliente con retraso exponencial
 */
export const RateLimiter = {
  getRecord() {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (!raw) return { attempts: 0, lockUntil: 0 };
      return JSON.parse(raw);
    } catch {
      return { attempts: 0, lockUntil: 0 };
    }
  },

  saveRecord(record) {
    try {
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      console.warn('Error al guardar rate limit:', e);
    }
  },

  checkStatus() {
    const record = this.getRecord();
    const now = Date.now();

    if (record.lockUntil > now) {
      const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
      return {
        isLockedOut: true,
        remainingSeconds,
        failedAttempts: record.attempts,
      };
    }

    return {
      isLockedOut: false,
      remainingSeconds: 0,
      failedAttempts: record.attempts,
    };
  },

  recordFailure() {
    const record = this.getRecord();
    const newAttempts = (record.attempts || 0) + 1;
    let lockoutDurationMs = 0;

    if (newAttempts >= 7) {
      lockoutDurationMs = 5 * 60 * 1000; // 5 minutos de bloqueo estricto
    } else if (newAttempts >= 5) {
      lockoutDurationMs = 60 * 1000; // 1 minuto
    } else if (newAttempts >= 3) {
      lockoutDurationMs = 15 * 1000; // 15 segundos
    }

    const newRecord = {
      attempts: newAttempts,
      lockUntil: lockoutDurationMs > 0 ? Date.now() + lockoutDurationMs : 0,
    };

    this.saveRecord(newRecord);

    return {
      isLockedOut: lockoutDurationMs > 0,
      remainingSeconds: Math.ceil(lockoutDurationMs / 1000),
      failedAttempts: newAttempts,
    };
  },

  reset() {
    try {
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    } catch (e) {
      console.warn('Error al reiniciar rate limit:', e);
    }
  },
};
