import { describe, it, expect } from 'vitest';
import { calculatePasswordEntropy } from '../passwordEntropy';

describe('AuraFinance Password Entropy Calculator', () => {
  it('debe clasificar contraseñas débiles', () => {
    const weak = calculatePasswordEntropy('123456');
    expect(weak.score).toBeLessThanOrEqual(1);
    expect(weak.isStrong).toBe(false);
  });

  it('debe clasificar contraseñas de grado bancario', () => {
    const strong = calculatePasswordEntropy('Vault-Cipher-2026!#Omega');
    expect(strong.score).toBe(4);
    expect(strong.isStrong).toBe(true);
    expect(strong.entropyBits).toBeGreaterThanOrEqual(80);
  });

  it('debe manejar contraseñas vacías', () => {
    const empty = calculatePasswordEntropy('');
    expect(empty.score).toBe(0);
    expect(empty.entropyBits).toBe(0);
  });
});
