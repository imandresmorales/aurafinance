/**
 * totpEngine.js
 *
 * Motor TOTP (RFC 6238) para Doble Factor de Autenticación (2FA) en AuraFinance.
 * Implementado íntegramente con Web Crypto API — sin dependencias externas.
 *
 * SEGURIDAD:
 *  - El secreto TOTP se almacena cifrado en localStorage (via vaultCryptoEngine).
 *  - La ventana de tiempo aceptada es ±1 período (30 s) para tolerar desfase de reloj.
 *  - Se expone sólo el hash HMAC-SHA1 nativo del navegador para máxima compatibilidad.
 */

const TOTP_STORAGE_KEY = 'aura_totp_config';
const TOTP_PERIOD = 30;       // segundos por intervalo
const TOTP_DIGITS = 6;        // dígitos del OTP
const TOTP_WINDOW = 1;        // períodos de tolerancia (±)

// ─── Codificación Base32 ──────────────────────────────────────────────────────

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const bits = [];
  for (const char of clean) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx < 0) throw new Error(`Carácter Base32 inválido: ${char}`);
    for (let i = 4; i >= 0; i--) bits.push((idx >> i) & 1);
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i * 8 + j] ?? 0);
    bytes[i] = byte;
  }
  return bytes;
}

function base32Encode(bytes) {
  const bits = [];
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    let val = 0;
    for (let j = 0; j < 5; j++) val = (val << 1) | (bits[i + j] ?? 0);
    result += BASE32_CHARS[val];
  }
  return result;
}

// ─── HMAC-SHA1 via Web Crypto ─────────────────────────────────────────────────

async function hmacSha1(keyBytes, messageBytes) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
  return new Uint8Array(signature);
}

// ─── Cálculo TOTP ─────────────────────────────────────────────────────────────

/**
 * Calcula el código TOTP para un secreto y timestamp dados.
 *
 * @param {string} secretBase32 - Secreto en formato Base32
 * @param {number} [timestamp]  - Epoch en milisegundos (default: Date.now())
 * @returns {Promise<string>}   - Código de 6 dígitos con cero a la izquierda
 */
export async function generateTOTP(secretBase32, timestamp = Date.now()) {
  const secretBytes = base32Decode(secretBase32);
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD);

  // Convertir counter a big-endian de 8 bytes
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = c & 0xff;
    c = Math.floor(c / 256);
  }

  const hmac = await hmacSha1(secretBytes, counterBytes);

  // Dynamic truncation (RFC 4226 §5.4)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % Math.pow(10, TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
}

/**
 * Verifica si un código TOTP proporcionado es válido dentro de la ventana de tolerancia.
 *
 * @param {string} secretBase32
 * @param {string} inputCode
 * @param {number} [timestamp]
 * @returns {Promise<boolean>}
 */
export async function verifyTOTP(secretBase32, inputCode, timestamp = Date.now()) {
  if (!inputCode || inputCode.length !== TOTP_DIGITS) return false;
  const periodMs = TOTP_PERIOD * 1000;

  for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
    const t = timestamp + delta * periodMs;
    const expected = await generateTOTP(secretBase32, t);
    if (expected === inputCode.trim()) return true;
  }

  return false;
}

// ─── Generación de Secreto ────────────────────────────────────────────────────

/**
 * Genera un nuevo secreto TOTP de 20 bytes aleatorios codificado en Base32.
 * @returns {string} Secreto Base32 (formato compatible con Google Authenticator, Authy, etc.)
 */
export function generateTOTPSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

// ─── URI otpauth:// ───────────────────────────────────────────────────────────

/**
 * Genera la URI otpauth:// estándar para código QR en apps autenticadoras.
 *
 * @param {string} secret      - Secreto Base32
 * @param {string} accountName - Nombre de la cuenta o correo del usuario
 * @param {string} [issuer]    - Nombre del emisor (default: "AuraFinance")
 * @returns {string}
 */
export function buildOtpAuthUri(secret, accountName, issuer = 'AuraFinance') {
  const encoded = encodeURIComponent(accountName);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedIssuer}:${encoded}?secret=${secret}&issuer=${encodedIssuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

// ─── Persistencia (sin cifrado aquí, delegar a useEncryptedStorage) ───────────

/**
 * Carga la configuración TOTP sin descifrar (solo marca si está habilitado).
 * La clave real DEBE almacenarse cifrada externamente.
 */
export function loadTOTPStatus() {
  try {
    const raw = localStorage.getItem(TOTP_STORAGE_KEY);
    if (!raw) return { enabled: false };
    const cfg = JSON.parse(raw);
    return { enabled: Boolean(cfg.enabled), createdAt: cfg.createdAt };
  } catch {
    return { enabled: false };
  }
}

export function saveTOTPStatus(enabled, createdAt = new Date().toISOString()) {
  localStorage.setItem(TOTP_STORAGE_KEY, JSON.stringify({ enabled, createdAt }));
}

export function disableTOTP() {
  localStorage.removeItem(TOTP_STORAGE_KEY);
}

export { TOTP_PERIOD, TOTP_DIGITS };
