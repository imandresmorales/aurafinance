import React, { useState } from 'react';
import { Modal, Button, Input } from '../common';
import { useToast } from '../../hooks';
import './OnboardingWizard.css';

const ONBOARDING_STORAGE_KEY = 'aura_onboarding_completed';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP)' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina (GBP)' },
];

export default function OnboardingWizard({ isOpen, onClose, onComplete }) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2 State: Preferences
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [monthlyIncome, setMonthlyIncome] = useState('4500');

  // Step 3 State: 50/30/20 Split
  const [needsPercent, setNeedsPercent] = useState(50);
  const [wantsPercent, setWantsPercent] = useState(30);
  const [savingsPercent, setSavingsPercent] = useState(20);

  // Step 4 State: First Account
  const [firstAccountName, setFirstAccountName] = useState('Cuenta Corriente Principal');
  const [initialBalance, setInitialBalance] = useState('2500');

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Ignorar si storage no disponible
    }
    toast?.success('Bóveda configurada y lista para operar.', '¡Inducción Completada!');
    onComplete?.({
      currency: selectedCurrency,
      income: parseFloat(monthlyIncome) || 0,
      budgetRule: { needs: needsPercent, wants: wantsPercent, savings: savingsPercent },
      initialAccount: { name: firstAccountName, balance: parseFloat(initialBalance) || 0 },
    });
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de tu Bóveda Financiera"
      subtitle={`Paso ${currentStep} de 4 • Personalización Inicial`}
      maxWidth="620px"
    >
      <div className="onboarding-wizard">
        {/* Step Progress Bar */}
        <div className="wizard-progress-bar" role="progressbar" aria-valuenow={currentStep} aria-valuemin="1" aria-valuemax="4">
          <div
            className="wizard-progress-fill"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Step 1: Welcome & Zero-Knowledge Architecture */}
        {currentStep === 1 && (
          <div className="wizard-step-content">
            <div className="step-badge-diamond">💎</div>
            <h4 className="step-title">Bienvenido al Ecosistema AuraFinance</h4>
            <p className="step-desc">
              Has iniciado en una plataforma financiera de alta fidelidad con <strong>cifrado Cero-Conocimiento</strong>. Tus números, cuentas y transacciones nunca viajan sin cifrar.
            </p>
            <div className="features-checklist">
              <div className="feature-item">
                <span className="check-bullet">✓</span>
                <span>Control de flujo de caja y proyecciones a 90 días.</span>
              </div>
              <div className="feature-item">
                <span className="check-bullet">✓</span>
                <span>Presupuestos por sobres inteligentes y regla 50/30/20.</span>
              </div>
              <div className="feature-item">
                <span className="check-bullet">✓</span>
                <span>Base de datos offline local con sincronización determinista.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Currency & Income Baseline */}
        {currentStep === 2 && (
          <div className="wizard-step-content">
            <h4 className="step-title">Divisa Base & Perfil de Ingresos</h4>
            <p className="step-desc">
              Elige tu moneda principal para los balances consolidados e introduce un ingreso mensual estimado para calcular tus sobres.
            </p>

            <div className="form-group-spaced">
              <label className="input-label" htmlFor="currency-select">Moneda Principal de la Bóveda:</label>
              <select
                id="currency-select"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="wizard-select-control"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Ingreso Mensual Promedio Estimado:"
              type="number"
              prefix={CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || '$'}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              helperText="Servirá de base para sugerirte la distribución presupuestaria óptima."
            />
          </div>
        )}

        {/* Step 3: Budgeting Rule 50/30/20 */}
        {currentStep === 3 && (
          <div className="wizard-step-content">
            <h4 className="step-title">Estrategia Presupuestaria Inicial</h4>
            <p className="step-desc">
              Recomendamos la distribución clásica <strong>50/30/20</strong> para optimizar ahorro y libertad financiera.
            </p>

            <div className="budget-preview-grid">
              <div className="budget-pill-box">
                <span className="pill-title">Necesidades Básicas (50%)</span>
                <span className="pill-amount num-mono">
                  ${Math.round((parseFloat(monthlyIncome || '0') * needsPercent) / 100)}
                </span>
                <span className="pill-note">Vivienda, comida, salud</span>
              </div>
              <div className="budget-pill-box">
                <span className="pill-title">Deseos & Ocio (30%)</span>
                <span className="pill-amount num-mono">
                  ${Math.round((parseFloat(monthlyIncome || '0') * wantsPercent) / 100)}
                </span>
                <span className="pill-note">Restaurantes, viajes, ocio</span>
              </div>
              <div className="budget-pill-box gold">
                <span className="pill-title">Ahorro & Inversión (20%)</span>
                <span className="pill-amount num-mono">
                  ${Math.round((parseFloat(monthlyIncome || '0') * savingsPercent) / 100)}
                </span>
                <span className="pill-note">Fondo de emergencia, FIRE</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: First Account Creation */}
        {currentStep === 4 && (
          <div className="wizard-step-content">
            <h4 className="step-title">Tu Primera Cuenta Financiera</h4>
            <p className="step-desc">
              Configura tu cuenta o billetera principal para empezar a registrar balances de partida doble.
            </p>

            <Input
              label="Nombre de la Cuenta:"
              value={firstAccountName}
              onChange={(e) => setFirstAccountName(e.target.value)}
              placeholder="Ej. Banco Santander / Bóveda Efectivo"
            />

            <div style={{ marginTop: '1rem' }}>
              <Input
                label="Saldo Inicial Disponible:"
                type="number"
                prefix={CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || '$'}
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                helperText="Este monto se registrará como asiento de apertura patrimonial."
              />
            </div>
          </div>
        )}

        {/* Wizard Action Footer */}
        <div className="wizard-footer-actions">
          {currentStep > 1 ? (
            <Button variant="ghost" onClick={handlePrev}>
              ← Anterior
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              Saltar Inducción
            </Button>
          )}

          <Button variant="primary" onClick={handleNext}>
            {currentStep === 4 ? 'Completar Configuración ✨' : 'Siguiente Paso →'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
