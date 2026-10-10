import { describe, it, expect } from 'vitest';
import {
  bufferToHex,
  hexToBuffer,
  secureWipeBuffer,
  computeSha256,
  generateVaultFingerprint,
  packAndEncryptVault,
  unpackAndDecryptVault,
  verifyVaultPassword
} from '../vaultCryptoEngine.js';

describe('Commit 141: Vault End-to-End Cryptography Engine (Web Crypto API)', () => {
  const masterPassword = 'MasterAuraPassword2026!#$';
  const sampleVault = {
    accounts: [
      { id: 'acc-1', name: 'Bóveda Suiza', balance: 54000, currency: 'USD' }
    ],
    transactions: [
      { id: 'tx-1', amount: 1500, type: 'INCOME', description: 'Consultoría' }
    ],
    debts: [
      { id: 'd-1', name: 'Hipoteca', principalBalance: 120000 }
    ],
    settings: {
      theme: 'emerald-glass',
      baseCurrency: 'USD'
    }
  };

  describe('Byte & Hex Conversions and Memory Scrubbing', () => {
    it('converts buffer to hex and back losslessly', () => {
      const original = new Uint8Array([1, 15, 128, 255, 64]);
      const hex = bufferToHex(original);
      expect(hex).toBe('010f80ff40');

      const restored = hexToBuffer(hex);
      expect(Array.from(restored)).toEqual([1, 15, 128, 255, 64]);
    });

    it('zeros out sensitive buffers with secureWipeBuffer', () => {
      const secret = new Uint8Array([99, 100, 101, 102]);
      secureWipeBuffer(secret);
      expect(Array.from(secret)).toEqual([0, 0, 0, 0]);
    });

    it('computes consistent SHA-256 digests', async () => {
      const hash1 = await computeSha256('AuraFinance');
      const hash2 = await computeSha256('AuraFinance');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // 256 bits = 64 hex chars
    });
  });

  describe('Vault Packaging, Encryption and Decryption', () => {
    it('packs and encrypts the full vault into a sealed envelope', async () => {
      const envelope = await packAndEncryptVault(sampleVault, masterPassword);

      expect(envelope.format).toBe('AURA_VAULT_ENVELOPE');
      expect(envelope.version).toBe(1);
      expect(envelope.cipher).toBe('AES-256-GCM');
      expect(envelope.kdf.algorithm).toBe('PBKDF2');
      expect(envelope.kdf.iterations).toBe(100000);
      expect(envelope.kdf.saltHex).toBeDefined();
      expect(envelope.ivHex).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(envelope.ciphertextHex).toBeDefined();
      expect(envelope.checksumSha256).toBeDefined();

      // Ensure no raw account names or balances leak in the envelope
      const serialized = JSON.stringify(envelope);
      expect(serialized).not.toContain('Bóveda Suiza');
      expect(serialized).not.toContain('Consultoría');
    });

    it('unpacks and decrypts the vault perfectly with correct password', async () => {
      const envelope = await packAndEncryptVault(sampleVault, masterPassword);
      const decrypted = await unpackAndDecryptVault(envelope, masterPassword);

      expect(decrypted.accounts).toHaveLength(1);
      expect(decrypted.accounts[0].name).toBe('Bóveda Suiza');
      expect(decrypted.accounts[0].balance).toBe(54000);
      expect(decrypted.debts[0].name).toBe('Hipoteca');
      expect(decrypted.settings.theme).toBe('emerald-glass');
    });

    it('rejects decryption when given an incorrect master password', async () => {
      const envelope = await packAndEncryptVault(sampleVault, masterPassword);
      await expect(
        unpackAndDecryptVault(envelope, 'WrongPassword999!')
      ).rejects.toThrow('Acceso denegado: Contraseña maestra incorrecta');
    });

    it('detects tampering and rejects modified ciphertext', async () => {
      const envelope = await packAndEncryptVault(sampleVault, masterPassword);
      
      // Corrupt one character in the ciphertext
      const tamperedHex = envelope.ciphertextHex.slice(0, -2) + 'aa';
      const tamperedEnvelope = {
        ...envelope,
        ciphertextHex: tamperedHex
      };

      await expect(
        unpackAndDecryptVault(tamperedEnvelope, masterPassword)
      ).rejects.toThrow();
    });

    it('verifies password quickly using verifyVaultPassword', async () => {
      const envelope = await packAndEncryptVault(sampleVault, masterPassword);

      const isValid = await verifyVaultPassword(envelope, masterPassword);
      expect(isValid).toBe(true);

      const isInvalid = await verifyVaultPassword(envelope, 'BadPassword');
      expect(isInvalid).toBe(false);
    });

    it('generates deterministic vault fingerprints for change detection', async () => {
      const fp1 = await generateVaultFingerprint(sampleVault);
      const fp2 = await generateVaultFingerprint(sampleVault);
      expect(fp1).toBe(fp2);

      const modifiedVault = { ...sampleVault, accounts: [] };
      const fp3 = await generateVaultFingerprint(modifiedVault);
      expect(fp1).not.toBe(fp3);
    });
  });
});
