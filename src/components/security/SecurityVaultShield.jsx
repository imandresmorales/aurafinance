import React, { useMemo } from 'react';
import { evaluateSecurityPosture } from '../../services/securityPostureEngine';

/**
 * SecurityVaultShield Component
 * Muestra telemetría de blindaje, puntuación de seguridad en vivo (0-100),
 * y estado de cifrado AES-256-GCM / WebAuthn de la bóveda.
 */
export const SecurityVaultShield = ({
  hasPin = true,
  hasPasskey = false,
  hasTotp = false,
  hasSeedBackup = false,
  autoLockEnabled = true,
  stealthModeUsed = false,
}) => {
  const posture = useMemo(
    () =>
      evaluateSecurityPosture({
        hasPin,
        hasPasskey,
        hasTotp,
        hasSeedBackup,
        autoLockEnabled,
        stealthModeUsed,
      }),
    [hasPin, hasPasskey, hasTotp, hasSeedBackup, autoLockEnabled, stealthModeUsed]
  );

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        borderRadius: '12px',
        border: `1px solid ${posture.badgeColor}40`,
        background: 'linear-gradient(135deg, rgba(6, 35, 26, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)',
        boxShadow: `0 10px 30px -10px ${posture.badgeColor}25`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>
            Telemetría de la Bóveda
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', color: '#f8fafc' }}>
            🛡️ Escudo de Seguridad: {posture.status}
          </h3>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${posture.badgeColor}1a`,
            border: `2px solid ${posture.badgeColor}`,
            borderRadius: '50%',
            width: '64px',
            height: '64px',
          }}
        >
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: posture.badgeColor }}>
            {posture.score}%
          </span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
            {posture.grade}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {posture.checks.map((check) => (
          <div
            key={check.id}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: check.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${check.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{check.passed ? '✅' : '⚠️'}</span>
            <span style={{ fontSize: '0.8rem', color: check.passed ? '#34d399' : '#f87171' }}>
              {check.title}
            </span>
          </div>
        ))}
      </div>

      {posture.recommendations.length > 0 && (
        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
          <strong style={{ color: '#fbbf24' }}>💡 Recomendación prioritaria:</strong> {posture.recommendations[0]}
        </div>
      )}
    </div>
  );
};

export default SecurityVaultShield;
