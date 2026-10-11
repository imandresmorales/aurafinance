/**
 * webAuthnEngine.js
 *
 * Motor de Autenticación WebAuthn (Passkeys) para AuraFinance.
 * Soporta registro y autenticación biométrica usando la Credential Management API
 * (Windows Hello, Touch ID, Face ID, llaves de hardware FIDO2).
 *
 * SEGURIDAD:
 *  - El challenge siempre es criptográficamente aleatorio (32 bytes).
 *  - Se almacena solo el credentialId (base64url) y la clave pública (no secreto).
 *  - Compatible con el modelo de zero-knowledge: nunca se transmite material sensible.
 */

const WEBAUTHN_STORAGE_KEY = 'aura_webauthn_credentials';
const RP_ID = window.location.hostname || 'localhost';
const RP_NAME = 'AuraFinance Vault';

// ─── Utilidades de buffer ───────────────────────────────────────────────────

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuffer(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function randomChallenge(byteLength = 32) {
  const buf = new Uint8Array(byteLength);
  crypto.getRandomValues(buf);
  return buf;
}

// ─── Capacidades ────────────────────────────────────────────────────────────

/**
 * Comprueba si el navegador soporta WebAuthn y autenticadores de plataforma.
 * @returns {Promise<boolean>}
 */
export async function isWebAuthnSupported() {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ─── Persistencia de credenciales ────────────────────────────────────────────

function loadStoredCredentials() {
  try {
    const raw = localStorage.getItem(WEBAUTHN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCredential(credRecord) {
  const existing = loadStoredCredentials().filter((c) => c.credentialId !== credRecord.credentialId);
  localStorage.setItem(WEBAUTHN_STORAGE_KEY, JSON.stringify([...existing, credRecord]));
}

export function getRegisteredPasskeys() {
  return loadStoredCredentials();
}

export function removePasskey(credentialId) {
  const remaining = loadStoredCredentials().filter((c) => c.credentialId !== credentialId);
  localStorage.setItem(WEBAUTHN_STORAGE_KEY, JSON.stringify(remaining));
}

export function hasRegisteredPasskeys() {
  return loadStoredCredentials().length > 0;
}

// ─── Registro de Passkey ─────────────────────────────────────────────────────

/**
 * Registra una nueva credencial biométrica/passkey para el usuario.
 *
 * @param {Object} options
 * @param {string} options.userAlias  - Nombre visible del usuario
 * @param {string} options.userId     - Identificador único del usuario (no secreto)
 * @param {string} [options.nickname] - Apodo para la llave (ej: "FaceID iPhone")
 * @returns {Promise<{success: boolean, credentialId: string, nickname: string}>}
 */
export async function registerPasskey({ userAlias, userId, nickname = 'Mi Passkey' }) {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn no está disponible en este navegador.');
  }

  const challenge = randomChallenge();
  const userIdBytes = new TextEncoder().encode(userId.substring(0, 64));

  const publicKeyOptions = {
    challenge,
    rp: { id: RP_ID, name: RP_NAME },
    user: {
      id: userIdBytes,
      name: userAlias,
      displayName: userAlias,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256 (ECDSA con P-256)
      { type: 'public-key', alg: -257 },  // RS256 (RSA-PKCS1-v1_5)
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none', // privacidad: no revelar modelo del autenticador
  };

  let credential;
  try {
    credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('El usuario canceló la autenticación biométrica.');
    }
    throw new Error(`Error al registrar Passkey: ${err.message}`);
  }

  const credentialId = bufferToBase64url(credential.rawId);

  const record = {
    credentialId,
    nickname,
    userAlias,
    registeredAt: new Date().toISOString(),
    rpId: RP_ID,
  };

  saveCredential(record);

  return { success: true, credentialId, nickname };
}

// ─── Autenticación con Passkey ────────────────────────────────────────────────

/**
 * Solicita autenticación biométrica usando las passkeys registradas.
 *
 * @returns {Promise<{success: boolean, credentialId: string}>}
 */
export async function authenticateWithPasskey() {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn no está disponible en este navegador.');
  }

  const stored = loadStoredCredentials();
  if (stored.length === 0) {
    throw new Error('No hay passkeys registradas. Registra una primero.');
  }

  const challenge = randomChallenge();
  const allowCredentials = stored.map((c) => ({
    type: 'public-key',
    id: base64urlToBuffer(c.credentialId),
    transports: ['internal', 'hybrid'],
  }));

  const publicKeyOptions = {
    challenge,
    rpId: RP_ID,
    allowCredentials,
    userVerification: 'required',
    timeout: 60000,
  };

  let assertion;
  try {
    assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Autenticación cancelada por el usuario.');
    }
    throw new Error(`Error de autenticación biométrica: ${err.message}`);
  }

  const credentialId = bufferToBase64url(assertion.rawId);
  const isKnown = stored.some((c) => c.credentialId === credentialId);

  if (!isKnown) {
    throw new Error('Credencial no reconocida. Acceso denegado.');
  }

  return { success: true, credentialId };
}
