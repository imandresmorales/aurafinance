import { describe, it, expect } from 'vitest';
import {
  bufferToHex,
  hexToBuffer,
  maskSensitiveReference,
  validateCreditorRecord,
  encryptCreditorRecord,
  decryptCreditorRecord,
  encryptCreditorBook,
  decryptCreditorBook,
  filterCreditorsDueSoon
} from '../encryptedCreditorBookEngine.js';

describe('encryptedCreditorBookEngine', () => {
  const masterPassword = 'MasterSecurePassword123!';

  describe('hex utilities and masking', () => {
    it('converts buffer to hex and back accurately', () => {
      const original = new Uint8Array([0, 15, 255, 128, 42]);
      const hex = bufferToHex(original);
      expect(hex).toBe('000fff802a');
      const back = hexToBuffer(hex);
      expect(Array.from(back)).toEqual([0, 15, 255, 128, 42]);
    });

    it('masks sensitive bank references properly', () => {
      expect(maskSensitiveReference('1234567890123456')).toBe('•••• •••• 3456');
      expect(maskSensitiveReference('9876')).toBe('••••');
      expect(maskSensitiveReference('')).toBe('');
    });
  });

  describe('validation', () => {
    it('validates required fields and due day ranges', () => {
      const valid = validateCreditorRecord({ name: 'Banco Santander', dueDay: 15 });
      expect(valid.isValid).toBe(true);

      const invalidName = validateCreditorRecord({ name: '', dueDay: 10 });
      expect(invalidName.isValid).toBe(false);

      const invalidDay = validateCreditorRecord({ name: 'Entidad X', dueDay: 35 });
      expect(invalidDay.isValid).toBe(false);
    });
  });

  describe('encryption and decryption', () => {
    const sampleRecord = {
      id: 'cred-1',
      name: 'Banco BBVA Hipotecario',
      accountNumber: 'ES91 2100 0418 4502 0005 1332',
      paymentReference: 'REF-HIPO-9941',
      dueDay: 5,
      notes: 'Pagar antes de las 12:00 PM para evitar recargos'
    };

    it('encrypts record and produces valid ciphertext without plaintext leakage', async () => {
      const encrypted = await encryptCreditorRecord(sampleRecord, masterPassword);

      expect(encrypted.isEncrypted).toBe(true);
      expect(encrypted.ciphertextHex).toBeDefined();
      expect(encrypted.saltHex).toBeDefined();
      expect(encrypted.ivHex).toBeDefined();
      expect(encrypted.last4Reference).toBe('1332');

      // Check that sensitive fields are not in the top-level encrypted object
      expect(encrypted.accountNumber).toBeUndefined();
      expect(encrypted.paymentReference).toBeUndefined();
      expect(encrypted.notes).toBeUndefined();
    });

    it('decrypts encrypted record accurately with correct password', async () => {
      const encrypted = await encryptCreditorRecord(sampleRecord, masterPassword);
      const decrypted = await decryptCreditorRecord(encrypted, masterPassword);

      expect(decrypted.name).toBe(sampleRecord.name);
      expect(decrypted.accountNumber).toBe(sampleRecord.accountNumber);
      expect(decrypted.paymentReference).toBe(sampleRecord.paymentReference);
      expect(decrypted.notes).toBe(sampleRecord.notes);
      expect(decrypted.dueDay).toBe(5);
    });

    it('fails to decrypt when password is wrong', async () => {
      const encrypted = await encryptCreditorRecord(sampleRecord, masterPassword);
      await expect(decryptCreditorRecord(encrypted, 'WrongPassword123!')).rejects.toThrow(
        'Error al descifrar el acreedor'
      );
    });

    it('batch encrypts and decrypts creditor list', async () => {
      const records = [
        sampleRecord,
        { id: 'cred-2', name: 'Tarjeta American Express', accountNumber: '378282246310005', dueDay: 20 }
      ];

      const encryptedBatch = await encryptCreditorBook(records, masterPassword);
      expect(encryptedBatch).toHaveLength(2);

      const decryptedBatch = await decryptCreditorBook(encryptedBatch, masterPassword);
      expect(decryptedBatch.failedCount).toBe(0);
      expect(decryptedBatch.decrypted).toHaveLength(2);
      expect(decryptedBatch.decrypted[1].name).toBe('Tarjeta American Express');
    });
  });

  describe('filterCreditorsDueSoon', () => {
    it('identifies upcoming due dates and urgency', () => {
      const creditors = [
        { id: '1', name: 'Luz/Servicios', dueDay: 12 }, // In 2 days (from day 10) -> urgent
        { id: '2', name: 'Tarjeta Oro', dueDay: 16 },   // In 6 days (from day 10) -> soon
        { id: '3', name: 'Hipoteca', dueDay: 28 },      // In 18 days -> not in 7-day lookahead
        { id: '4', name: 'Auto', dueDay: 2 }            // Passed day 10 -> next month (22 days away)
      ];

      const soon = filterCreditorsDueSoon(creditors, 10, 7);
      expect(soon).toHaveLength(2);
      expect(soon[0].name).toBe('Luz/Servicios');
      expect(soon[0].daysUntilDue).toBe(2);
      expect(soon[0].isUrgent).toBe(true);

      expect(soon[1].name).toBe('Tarjeta Oro');
      expect(soon[1].daysUntilDue).toBe(6);
      expect(soon[1].isUrgent).toBe(false);
    });
  });
});
