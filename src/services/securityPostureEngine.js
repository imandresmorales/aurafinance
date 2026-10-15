/**
 * Security Posture Evaluator Engine
 * Evalúa las defensas activas de la bóveda de AuraFinance y otorga
 * una puntuación (0-100) junto con recomendaciones accionables.
 */

export const evaluateSecurityPosture = (options = {}) => {
  const {
    hasPin = false,
    hasPasskey = false,
    hasTotp = false,
    hasSeedBackup = false,
    autoLockEnabled = true,
    stealthModeUsed = false,
  } = options;

  const checks = [
    {
      id: 'pin_protection',
      title: 'Protección por PIN / Clave',
      passed: Boolean(hasPin),
      weight: 20,
      recommendation: 'Configura un PIN criptográfico SHA-256 para bloquear la bóveda.',
    },
    {
      id: 'biometrics_passkey',
      title: 'Autenticación Biométrica / Passkey',
      passed: Boolean(hasPasskey),
      weight: 20,
      recommendation: 'Registra una Passkey WebAuthn (Touch ID, Windows Hello o Face ID).',
    },
    {
      id: 'totp_2fa',
      title: 'Doble Factor TOTP (RFC 6238)',
      passed: Boolean(hasTotp),
      weight: 20,
      recommendation: 'Habilita un autenticador TOTP (Google Authenticator, Aegis, 1Password).',
    },
    {
      id: 'seed_phrase_backup',
      title: 'Frase Semilla BIP-39 Respaldada',
      passed: Boolean(hasSeedBackup),
      weight: 20,
      recommendation: 'Genera y guarda en lugar seguro tu frase de recuperación de 12 palabras.',
    },
    {
      id: 'auto_lock',
      title: 'Bloqueo Automático por Inactividad',
      passed: Boolean(autoLockEnabled),
      weight: 10,
      recommendation: 'Mantén activo el bloqueo automático tras inactividad prolongada.',
    },
    {
      id: 'stealth_mode',
      title: 'Camuflaje / Stealth Mode',
      passed: Boolean(stealthModeUsed),
      weight: 10,
      recommendation: 'Utiliza el atajo H para camuflar saldos en entornos públicos.',
    },
  ];

  const totalScore = checks.reduce((acc, check) => acc + (check.passed ? check.weight : 0), 0);

  let grade = 'D';
  let status = 'Vulnerable';
  let badgeColor = '#ef4444';

  if (totalScore >= 90) {
    grade = 'A+';
    status = 'Fortaleza Máxima';
    badgeColor = '#10b981';
  } else if (totalScore >= 75) {
    grade = 'A';
    status = 'Excelente Blindaje';
    badgeColor = '#34d399';
  } else if (totalScore >= 50) {
    grade = 'B';
    status = 'Seguridad Moderada';
    badgeColor = '#f59e0b';
  } else if (totalScore >= 30) {
    grade = 'C';
    status = 'Protección Básica';
    badgeColor = '#f97316';
  }

  const recommendations = checks.filter((c) => !c.passed).map((c) => c.recommendation);

  return {
    score: totalScore,
    grade,
    status,
    badgeColor,
    checks,
    recommendations,
  };
};

export default evaluateSecurityPosture;
