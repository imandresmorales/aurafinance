/**
 * Device & Browser Anomaly Detector
 * Almacena de forma pseudo-anónima una huella no invasiva del entorno
 * de ejecución (navegador, resolución, timezone) y alerta al usuario si
 * detecta un acceso desde un entorno o navegador no habitual.
 */

const STORAGE_KEY = 'aura_known_devices';

const generateEnvironmentFingerprint = () => {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent || 'unknown';
  const language = navigator.language || 'unknown';
  const timezone = Intl?.DateTimeFormat?.().resolvedOptions?.()?.timeZone || 'unknown';
  const screenDimensions = `${window.screen?.width || 0}x${window.screen?.height || 0}`;

  return `${userAgent}|${language}|${timezone}|${screenDimensions}`;
};

export const checkDeviceAccessAnomaly = () => {
  if (typeof window === 'undefined') return { isNewDevice: false };

  const currentFingerprint = generateEnvironmentFingerprint();
  const rawDevices = localStorage.getItem(STORAGE_KEY);
  let knownDevices = [];

  try {
    if (rawDevices) {
      knownDevices = JSON.parse(rawDevices);
    }
  } catch (e) {
    knownDevices = [];
  }

  const isKnown = knownDevices.some((dev) => dev.fingerprint === currentFingerprint);

  if (!isKnown) {
    const newEntry = {
      fingerprint: currentFingerprint,
      firstSeen: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    knownDevices.push(newEntry);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(knownDevices));
    } catch (e) {
      // Storage quota fallback
    }

    // Si ya había dispositivos conocidos y este no figuraba, es anómalo / no habitual
    const isAnomaly = knownDevices.length > 1;

    return {
      isNewDevice: true,
      isAnomaly,
      message: isAnomaly
        ? 'Se ha detectado acceso desde un navegador o dispositivo no habitual.'
        : 'Dispositivo registrado como entorno de confianza.',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    isNewDevice: false,
    isAnomaly: false,
    timestamp: new Date().toISOString(),
  };
};

export default checkDeviceAccessAnomaly;
