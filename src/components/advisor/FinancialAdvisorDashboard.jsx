import React, { useState } from 'react';
import {
  calculateFinancialHealthScore,
  evaluateGoalProgress,
  getSavingsGoalsSummary,
  calculateFireMetrics,
  getGamifiedChallengesSummary,
  getDailyFinancialWisdom,
  generateFinancialReport,
  triggerReportDownload,
} from '../../services';
import GoalProgressCard from './GoalProgressCard';
import GoalConfigModal from './GoalConfigModal';
import InvestmentVsPassiveSavingsCard from './InvestmentVsPassiveSavingsCard';
import './FinancialAdvisorDashboard.css';

/**
 * FinancialAdvisorDashboard Component
 * Master unified hub for Financial Health Score, Goals Portfolio,
 * Gamified Challenges, FIRE Planner and Actionable Heuristic Insights.
 */
export default function FinancialAdvisorDashboard({
  initialGoals = [],
  healthData = {},
  userProfile = { name: 'Alex Morales', baseCurrency: 'USD' },
  onUpdateGoal = () => {},
  onCreateGoal = () => {},
}) {
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, GOALS, CHALLENGES, FIRE, COMPOUND
  const [goals, setGoals] = useState(
    initialGoals.length > 0
      ? initialGoals
      : [
          {
            id: 'g-1',
            name: 'Fondo de Emergencia (6 Meses)',
            targetAmount: 12000,
            currentAmount: 7500,
            monthlyContribution: 500,
            targetDate: '2027-06-30',
            category: 'EMERGENCY',
            priority: 'CRITICAL',
          },
          {
            id: 'g-2',
            name: 'Entrada Departamento',
            targetAmount: 30000,
            currentAmount: 12000,
            monthlyContribution: 800,
            targetDate: '2028-12-31',
            category: 'HOME',
            priority: 'HIGH',
          },
          {
            id: 'g-3',
            name: 'Viaje a Japón',
            targetAmount: 5000,
            currentAmount: 5000, // completed
            monthlyContribution: 300,
            targetDate: '2026-12-01',
            category: 'TRAVEL',
            priority: 'MEDIUM',
          },
        ]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Health Score Calculation
  const healthScore = calculateFinancialHealthScore({
    liquidBalance: healthData.liquidBalance || 15000,
    monthlyIncome: healthData.monthlyIncome || 4500,
    monthlyExpenses: healthData.monthlyExpenses || 2800,
    monthlyFixedExpenses: healthData.monthlyFixedExpenses || 1600,
    monthlyDebtServicing: healthData.monthlyDebtServicing || 300,
    incomeVolatilityPct: healthData.incomeVolatilityPct || 8,
  });

  // Goals Summary
  const goalsSummary = getSavingsGoalsSummary(goals);

  // Gamified Challenges
  const challengesSummary = getGamifiedChallengesSummary();

  // Daily Wisdom
  const wisdom = getDailyFinancialWisdom();

  // FIRE Metrics
  const fireMetrics = calculateFireMetrics({
    currentNetWorth: healthData.liquidBalance || 15000,
    annualExpenses: (healthData.monthlyExpenses || 2800) * 12,
    annualSavings: ((healthData.monthlyIncome || 4500) - (healthData.monthlyExpenses || 2800)) * 12,
  });

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleSaveGoal = (goalData) => {
    if (editingGoal) {
      const updated = goals.map((g) => (g.id === goalData.id ? goalData : g));
      setGoals(updated);
      onUpdateGoal(goalData);
    } else {
      const newGoal = {
        ...goalData,
        id: `goal-${Date.now()}`,
      };
      const updated = [...goals, newGoal];
      setGoals(updated);
      onCreateGoal(newGoal);
    }
    setIsModalOpen(false);
  };

  const handleDownloadReport = () => {
    const report = generateFinancialReport({
      userProfile,
      healthScore,
      goalsSummary,
      fireMetrics,
    });
    triggerReportDownload(report.html, `AuraFinance_Report_${new Date().toISOString().split('T')[0]}.html`, 'text/html');
  };

  return (
    <div className="advisor-dashboard-container" data-testid="financial-advisor-dashboard">
      {/* Top Header */}
      <header className="advisor-header">
        <div className="advisor-header-left">
          <div className="advisor-spark-badge">
            <span className="spark-icon">💎</span>
            <span className="spark-text">Asesoría e Inteligencia Financiera</span>
          </div>
          <h1 className="advisor-main-title">Centro de Salud & Metas Patrimoniales</h1>
          <p className="advisor-main-subtitle">
            Optimización algorítmica de objetivos, independencia financiera y hábitos de acumulación
          </p>
        </div>

        <div className="advisor-header-right">
          <button
            type="button"
            className="advisor-btn-download"
            onClick={handleDownloadReport}
            data-testid="download-report-btn"
          >
            📥 Exportar Informe Completo
          </button>
          <button
            type="button"
            className="advisor-btn-primary"
            onClick={handleOpenCreate}
            data-testid="create-goal-btn"
          >
            + Nueva Meta de Ahorro
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="advisor-nav-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'OVERVIEW'}
          className={`advisor-tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          🛡️ Diagnóstico & Salud
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'GOALS'}
          className={`advisor-tab-btn ${activeTab === 'GOALS' ? 'active' : ''}`}
          onClick={() => setActiveTab('GOALS')}
        >
          🎯 Metas de Ahorro ({goalsSummary.activeCount} activas)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'CHALLENGES'}
          className={`advisor-tab-btn ${activeTab === 'CHALLENGES' ? 'active' : ''}`}
          onClick={() => setActiveTab('CHALLENGES')}
        >
          🏆 Desafíos & Medallas ({challengesSummary.earnedBadgesCount} logros)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'FIRE'}
          className={`advisor-tab-btn ${activeTab === 'FIRE' ? 'active' : ''}`}
          onClick={() => setActiveTab('FIRE')}
        >
          🌴 FIRE & Regla del 4%
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'COMPOUND'}
          className={`advisor-tab-btn ${activeTab === 'COMPOUND' ? 'active' : ''}`}
          onClick={() => setActiveTab('COMPOUND')}
        >
          📈 Interés Compuesto vs Pasivo
        </button>
      </nav>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <section className="advisor-tab-pane" data-testid="tab-overview">
          <div className="advisor-overview-grid">
            {/* Health Score Main Card */}
            <div className="advisor-health-card">
              <div className="health-card-header">
                <span className="health-card-tag">Índice Global de Solvencia</span>
                <span className={`health-tier-badge ${healthScore.badgeClass}`}>
                  {healthScore.tierLabel}
                </span>
              </div>

              <div className="health-score-large-display">
                <div className="health-score-number">{healthScore.totalScore}</div>
                <div className="health-score-scale">/ 100 pts</div>
              </div>

              <p className="health-tier-desc">{healthScore.tierDescription}</p>

              {/* 5 Pillars Breakdown */}
              <div className="health-pillars-list">
                {Object.values(healthScore.pillars).map((pillar, idx) => (
                  <div key={idx} className="pillar-row">
                    <div className="pillar-info">
                      <span className="pillar-name">{pillar.name}</span>
                      <span className="pillar-score-text font-mono">
                        {pillar.score} / {pillar.maxScore} pts ({pillar.currentValue})
                      </span>
                    </div>
                    <div className="pillar-bar-track">
                      <div
                        className="pillar-bar-fill"
                        style={{
                          width: `${pillar.percentage}%`,
                          backgroundColor:
                            pillar.status === 'EXCELLENT'
                              ? '#10b981'
                              : pillar.status === 'GOOD'
                              ? '#3b82f6'
                              : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Wisdom & Quick Stats */}
            <div className="advisor-side-panel">
              <div className="advisor-wisdom-card">
                <div className="wisdom-header">
                  <span className="wisdom-icon">💡</span>
                  <span className="wisdom-badge">{wisdom.tag || wisdom.category || 'Principio'}</span>
                </div>
                <p className="wisdom-quote">"{wisdom.principle || wisdom.quote}"</p>
                <div className="wisdom-author">— {wisdom.author}</div>
              </div>

              <div className="advisor-quick-kpi-card">
                <h3 className="quick-kpi-heading">Resumen de Objetivos</h3>
                <div className="quick-kpi-row">
                  <span>Metas en Curso:</span>
                  <strong className="font-mono">{goalsSummary.activeCount} activas</strong>
                </div>
                <div className="quick-kpi-row">
                  <span>Monto Total Acumulado:</span>
                  <strong className="font-mono text-emerald">
                    ${goalsSummary.totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="quick-kpi-row">
                  <span>Progreso Global:</span>
                  <strong className="font-mono">{goalsSummary.overallPercentage}%</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: GOALS */}
      {activeTab === 'GOALS' && (
        <section className="advisor-tab-pane" data-testid="tab-goals">
          <div className="advisor-goals-header-bar">
            <div>
              <h2 className="tab-section-title">Portafolio de Metas Activas</h2>
              <p className="tab-section-sub">
                Seguimiento de ritmo mensual, aportaciones extraordinarias y fechas proyectadas
              </p>
            </div>
            <button
              type="button"
              className="advisor-btn-primary"
              onClick={handleOpenCreate}
            >
              + Agregar Meta
            </button>
          </div>

          <div className="advisor-goals-grid">
            {goals.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                onEdit={handleOpenEdit}
                onAddFunds={(g) => handleOpenEdit(g)}
              />
            ))}
          </div>
        </section>
      )}

      {/* TAB CONTENT: CHALLENGES */}
      {activeTab === 'CHALLENGES' && (
        <section className="advisor-tab-pane" data-testid="tab-challenges">
          <div className="challenges-hub-header">
            <h2 className="tab-section-title">Desafíos de Ahorro & Gamificación</h2>
            <p className="tab-section-sub">
              Desbloquea medallas de constancia y supera retos semanales para forjar disciplina
            </p>
          </div>

          <div className="challenges-grid">
            <div className="challenge-card">
              <div className="challenge-icon">📅</div>
              <h3 className="challenge-title">Reto de las 52 Semanas</h3>
              <p className="challenge-desc">
                Ahorra $1 la semana 1, $2 la semana 2... acumulando $1,378 en un año.
              </p>
              <div className="challenge-badge font-mono">Semana 14 / 52 • $105 ahorrados</div>
            </div>

            <div className="challenge-card">
              <div className="challenge-icon">🔥</div>
              <h3 className="challenge-title">Racha Sin Compras Impulsivas</h3>
              <p className="challenge-desc">
                Aplica la regla de las 72 horas para todas las compras mayores a $100.
              </p>
              <div className="challenge-badge font-mono">Racha actual: 18 días</div>
            </div>

            <div className="challenge-card">
              <div className="challenge-icon">☕</div>
              <h3 className="challenge-title">Desafío Café en Casa</h3>
              <p className="challenge-desc">
                Prepara tu café en casa durante 30 días y transfiere $4 diarios a tu meta.
              </p>
              <div className="challenge-badge font-mono">$72 ahorrados este mes</div>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: FIRE */}
      {activeTab === 'FIRE' && (
        <section className="advisor-tab-pane" data-testid="tab-fire">
          <div className="fire-hub-card">
            <div className="fire-hub-header">
              <div>
                <h2 className="tab-section-title">Calculadora de Independencia Financiera (FIRE)</h2>
                <p className="tab-section-sub">
                  Basado en la Regla del 4% y tu tasa de acumulación actual
                </p>
              </div>
              <div className="fire-years-pill">
                {fireMetrics.yearsToFire} años para Libertad Financiera
              </div>
            </div>

            <div className="fire-targets-grid">
              <div className="fire-target-box">
                <span className="fire-box-label">Lean FIRE (Básico)</span>
                <span className="fire-box-number font-mono">
                  ${fireMetrics.targets.leanFire.number.toLocaleString('en-US')}
                </span>
                <span className="fire-box-desc">Gastos mínimos de supervivencia</span>
              </div>

              <div className="fire-target-box highlight">
                <span className="fire-box-label">Standard FIRE</span>
                <span className="fire-box-number font-mono">
                  ${fireMetrics.targets.standardFire.number.toLocaleString('en-US')}
                </span>
                <span className="fire-box-desc">100% de tu estilo de vida actual</span>
              </div>

              <div className="fire-target-box">
                <span className="fire-box-label">Fat FIRE (Holgado)</span>
                <span className="fire-box-number font-mono">
                  ${fireMetrics.targets.fatFire.number.toLocaleString('en-US')}
                </span>
                <span className="fire-box-desc">Margen para viajes y lujos</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: COMPOUND INTEREST */}
      {activeTab === 'COMPOUND' && (
        <section className="advisor-tab-pane" data-testid="tab-compound">
          <InvestmentVsPassiveSavingsCard
            initialPrincipal={10000}
            initialMonthly={500}
            initialYears={15}
          />
        </section>
      )}

      {/* Goal Config Modal */}
      <GoalConfigModal
        isOpen={isModalOpen}
        goalToEdit={editingGoal}
        onSave={handleSaveGoal}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
