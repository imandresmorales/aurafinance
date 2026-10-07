import React, { useState, useMemo } from 'react';
import { useAccounts } from '../../hooks';
import { formatCurrency } from '../../utils';
import { calculateCompoundGrowth } from '../../services/compoundInterestEngine';
import './InvestmentVsPassiveSavingsCard.css';

export function InvestmentVsPassiveSavingsCard({
  defaultPrincipal = 1000,
  defaultMonthly = 300,
  defaultYears = 15,
  defaultRate = 0.08,
}) {
  const { baseCurrency = 'USD' } = useAccounts();

  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [monthlySavings, setMonthlySavings] = useState(defaultMonthly);
  const [years, setYears] = useState(defaultYears);
  const [annualRate, setAnnualRate] = useState(defaultRate);
  const [inflationRate, setInflationRate] = useState(0.03); // 3% default inflation
  const [adjustInflation, setAdjustInflation] = useState(false);

  // Calculate Active Investment Trajectory
  const investmentGrowth = useMemo(() => {
    return calculateCompoundGrowth({
      principal: Number(principal) || 0,
      annualRate: Number(annualRate) || 0,
      years: Number(years) || 10,
      monthlyContribution: Number(monthlySavings) || 0,
      annualInflationRate: adjustInflation ? Number(inflationRate) : 0,
    });
  }, [principal, annualRate, years, monthlySavings, adjustInflation, inflationRate]);

  // Calculate Passive 0% Savings Trajectory
  const passiveSavings = useMemo(() => {
    return calculateCompoundGrowth({
      principal: Number(principal) || 0,
      annualRate: 0.0,
      years: Number(years) || 10,
      monthlyContribution: Number(monthlySavings) || 0,
      annualInflationRate: adjustInflation ? Number(inflationRate) : 0,
    });
  }, [principal, years, monthlySavings, adjustInflation, inflationRate]);

  // The Opportunity Gap (Difference in wealth)
  const finalInvested = adjustInflation ? investmentGrowth.futureValueReal : investmentGrowth.futureValueNominal;
  const finalPassive = adjustInflation ? passiveSavings.futureValueReal : passiveSavings.futureValueNominal;
  const opportunityGap = Math.max(0, finalInvested - finalPassive);
  const wealthMultiplier = finalPassive > 0 ? (finalInvested / finalPassive).toFixed(2) : '1.00';

  // SVG Chart path calculation
  const svgData = useMemo(() => {
    const width = 580;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 35, left: 55 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(
      investmentGrowth.schedule[investmentGrowth.schedule.length - 1]?.endingBalance || 1000,
      1000
    ) * 1.1;

    const totalPoints = investmentGrowth.schedule.length;

    const getX = (yearIdx) => padding.left + (yearIdx / totalPoints) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

    // Invested Path
    let investPath = `M ${getX(0)} ${getY(principal)}`;
    let passivePath = `M ${getX(0)} ${getY(principal)}`;
    let areaPath = `M ${getX(0)} ${getY(principal)}`;

    investmentGrowth.schedule.forEach((pt) => {
      const x = getX(pt.year);
      const y = getY(pt.endingBalance);
      investPath += ` L ${x} ${y}`;
    });

    passiveSavings.schedule.forEach((pt) => {
      const x = getX(pt.year);
      const y = getY(pt.endingBalance);
      passivePath += ` L ${x} ${y}`;
    });

    // Area between curves
    areaPath = investPath;
    for (let i = passiveSavings.schedule.length - 1; i >= 0; i--) {
      const pt = passiveSavings.schedule[i];
      areaPath += ` L ${getX(pt.year)} ${getY(pt.endingBalance)}`;
    }
    areaPath += ` Z`;

    return {
      width,
      height,
      padding,
      chartW,
      chartH,
      maxVal,
      investPath,
      passivePath,
      areaPath,
      getX,
      getY,
    };
  }, [investmentGrowth, passiveSavings, principal]);

  const yearPresets = [5, 10, 15, 20, 30];
  const ratePresets = [
    { label: '5% Prudente (Renta Fija / HYSA)', rate: 0.05 },
    { label: '8% Equilibrado (S&P 500 / Indexados)', rate: 0.08 },
    { label: '10% Crecimiento (Acciones Globales)', rate: 0.10 },
  ];

  return (
    <div className="investment-comparator-card glass-card" data-testid="investment-comparator-card">
      {/* Header */}
      <div className="comparator-header">
        <div className="comparator-title-group">
          <span className="comparator-icon">🚀</span>
          <div>
            <h3 className="comparator-title">Interés Compuesto vs Ahorro Pasivo</h3>
            <p className="comparator-subtitle">
              Visualiza la brecha de riqueza generada al poner tu dinero a trabajar en lugar de acumularlo estancado.
            </p>
          </div>
        </div>

        <div className="gap-highlight-pill">
          <span className="gap-label">Multiplicador de Riqueza</span>
          <span className="gap-val text-gradient-emerald">{wealthMultiplier}x</span>
        </div>
      </div>

      {/* Inputs & Controls Grid */}
      <div className="comparator-controls-grid">
        <div className="control-group">
          <label className="control-label" htmlFor="comp-principal">
            Depósito Inicial ({baseCurrency})
          </label>
          <input
            id="comp-principal"
            type="number"
            min="0"
            step="100"
            className="control-input"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label className="control-label" htmlFor="comp-monthly">
            Aporte Mensual ({baseCurrency}/mes)
          </label>
          <input
            id="comp-monthly"
            type="number"
            min="10"
            step="50"
            className="control-input"
            value={monthlySavings}
            onChange={(e) => setMonthlySavings(Number(e.target.value))}
          />
        </div>

        <div className="control-group span-2">
          <label className="control-label">Horizonte Temporal: {years} años</label>
          <div className="preset-pills-row" role="group" aria-label="Años de horizonte">
            {yearPresets.map((y) => (
              <button
                key={y}
                type="button"
                className={`preset-pill ${years === y ? 'active' : ''}`}
                onClick={() => setYears(y)}
              >
                {y} Años
              </button>
            ))}
          </div>
        </div>

        <div className="control-group span-2">
          <label className="control-label">Tasa de Rendimiento Anual Estimada</label>
          <div className="preset-pills-row" role="group" aria-label="Tasa de rendimiento">
            {ratePresets.map((preset) => (
              <button
                key={preset.rate}
                type="button"
                className={`preset-pill ${annualRate === preset.rate ? 'active' : ''}`}
                onClick={() => setAnnualRate(preset.rate)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group span-2 inflation-toggle-row">
          <input
            type="checkbox"
            id="toggle-inflation"
            checked={adjustInflation}
            onChange={(e) => setAdjustInflation(e.target.checked)}
            style={{ accentColor: '#10b981', cursor: 'pointer' }}
          />
          <label htmlFor="toggle-inflation" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
            Descontar Inflación estimada del {(inflationRate * 100).toFixed(0)}% anual (Poder adquisitivo real)
          </label>
        </div>
      </div>

      {/* Key Metric Comparison Banner */}
      <div className="comparison-banner-grid">
        <div className="metric-box passive">
          <span className="metric-tag">Ahorro Pasivo (0% Rendimiento)</span>
          <span className="metric-amount">{formatCurrency(finalPassive, baseCurrency)}</span>
          <span className="metric-sub">
            Capital puro aportado: {formatCurrency(passiveSavings.totalDeposited, baseCurrency)}
          </span>
        </div>

        <div className="metric-box invested">
          <span className="metric-tag">Inversión Compuesta ({(annualRate * 100).toFixed(0)}% Rendimiento)</span>
          <span className="metric-amount text-gradient-emerald">{formatCurrency(finalInvested, baseCurrency)}</span>
          <span className="metric-sub">
            Intereses generados: +{formatCurrency(investmentGrowth.totalInterestEarned, baseCurrency)}
          </span>
        </div>

        <div className="metric-box gap-box span-all">
          <div className="gap-info">
            <span className="gap-header">🌟 La Brecha de Oportunidad (Dinero Generado por Rendimiento)</span>
            <span className="gap-big-val">+{formatCurrency(opportunityGap, baseCurrency)}</span>
            <p className="gap-desc">
              Al invertir de forma periódica con interés compuesto, generas{' '}
              <strong>+{formatCurrency(opportunityGap, baseCurrency)}</strong> adicionales sobre tu propio dinero ahorrado.
            </p>
          </div>
        </div>
      </div>

      {/* Visual SVG Trajectory Curves */}
      <div className="comparator-chart-container" role="img" aria-label="Gráfico de evolución del interés compuesto vs ahorro pasivo">
        <svg viewBox={`0 0 ${svgData.width} ${svgData.height}`} className="comparator-svg">
          <defs>
            <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={svgData.padding.left}
            y1={svgData.padding.top + svgData.chartH}
            x2={svgData.width - svgData.padding.right}
            y2={svgData.padding.top + svgData.chartH}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />

          {/* Area between curves */}
          <path d={svgData.areaPath} fill="url(#growthAreaGradient)" />

          {/* Passive Curve (Gray) */}
          <path
            d={svgData.passivePath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />

          {/* Compound Invested Curve (Emerald Glow) */}
          <path
            d={svgData.investPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
          />

          {/* Axis Labels */}
          <text x={svgData.padding.left} y={svgData.height - 10} fill="#64748b" fontSize="11" textAnchor="middle">
            Año 0
          </text>
          <text x={svgData.width - svgData.padding.right} y={svgData.height - 10} fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
            Año {years}
          </text>
        </svg>

        {/* Legend */}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot invested" />
            <span>Patrimonio Invertido ({(annualRate * 100).toFixed(0)}%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot passive" />
            <span>Ahorro Pasivo Estancado (0%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot area" />
            <span>Ganancia por Interés Compuesto</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvestmentVsPassiveSavingsCard;
