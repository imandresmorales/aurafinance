import { describe, it, expect } from 'vitest';
import {
  generateSalt,
  deriveMasterKey,
  deriveAuthHash,
  encryptData,
  decryptData,
  bufferToBase64,
  base64ToBuffer,
  hashSHA256,
} from '../index';

describe('AuraFinance Cryptographic Engine (Zero-Knowledge)', () => {
  const passphrase = 'MySuperSecretMasterKey2026!';

  it('debe generar una sal criptográfica segura de 16 bytes', () => {
    const salt = generateSalt(16);
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16);

    const b64 = bufferToBase64(salt);
    const roundtrip = base64ToBuffer(b64);
    expect(roundtrip.length).toBe(16);
  });

  it('debe derivar una clave maestra AES-GCM mediante PBKDF2', async () => {
    const salt = generateSalt(16);
    const key = await deriveMasterKey(passphrase, salt, 1000); // 1000 iteraciones para test rápido

    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.extractable).toBe(false); // Clave bloqueada en memoria
  });

  it('debe derivar un hash de autenticación determinista con la misma sal', async () => {
    const salt = generateSalt(16);
    const hash1 = await deriveAuthHash(passphrase, salt, 1000);
    const hash2 = await deriveAuthHash(passphrase, salt, 1000);

    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('string');
  });

  it('debe cifrar y descifrar datos con integridad AES-256-GCM', async () => {
    const salt = generateSalt(16);
    const key = await deriveMasterKey(passphrase, salt, 1000);

    const sampleFinanceData = {
      account: 'Suiza Offshore',
      balance: 98765.43,
      tags: ['#Ahorro', '#Patrimonio'],
    };

    const encrypted = await encryptData(sampleFinanceData, key);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tagLength).toBe(128);

    const decrypted = await decryptData(encrypted, key);
    expect(decrypted).toEqual(sampleFinanceData);
  });

  it('debe rechazar datos si el ciphertext o IV fueron manipulados', async () => {
    const salt = generateSalt(16);
    const key = await deriveMasterKey(passphrase, salt, 1000);

    const encrypted = await encryptData({ secret: '12345' }, key);

    // Manipular el ciphertext
    const tamperedPayload = {
      ...encrypted,
      ciphertext: 'tamperedCiphertext==',
    };

    await expect(decryptData(tamperedPayload, key)).rejects.toThrow();
  });

  it('debe calcular hash SHA-256 anti-manipulación', async () => {
    const hashA = await hashSHA256('DataString1');
    const hashB = await hashSHA256('DataString1');
    const hashC = await hashSHA256('DataString2');

    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(hashC);
  });
});
