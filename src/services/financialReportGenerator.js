/**
 * financialReportGenerator.js
 * Comprehensive Local Financial Diagnostic & Advisory Report Generator for AuraFinance.
 * Generates structured Markdown, JSON and self-contained print-ready HTML reports.
 * Zero-Knowledge client-side processing.
 */

/**
 * Generates a full diagnostic and advisory financial report.
 * @param {Object} data
 * @param {Object} [data.userProfile]
 * @param {Object} [data.healthScore]
 * @param {Object} [data.netWorth]
 * @param {Object} [data.budgetSummary]
 * @param {Object} [data.goalsSummary]
 * @param {Object} [data.fireMetrics]
 * @param {Array<Object>} [data.recommendations]
 * @param {Object} [options]
 * @param {string} [options.asOfDate]
 * @returns {Object} Report in multiple formats (structured, markdown, html)
 */
export function generateFinancialReport(data = {}, options = {}) {
  const dateStr = options.asOfDate || new Date().toISOString().split('T')[0];
  const userName = data.userProfile?.name || 'Usuario';
  const currency = data.userProfile?.baseCurrency || 'USD';

  const healthScore = data.healthScore?.totalScore ?? 75;
  const healthTier = data.healthScore?.tierLabel || 'Saludable & Solvente';
  const netWorthTotal = data.netWorth?.netWorth ?? 0;
  const totalAssets = data.netWorth?.totalAssets ?? 0;
  const totalLiabilities = data.netWorth?.totalLiabilities ?? 0;

  const totalGoals = data.goalsSummary?.totalGoalsCount ?? 0;
  const goalsSaved = data.goalsSummary?.totalSaved ?? 0;
  const goalsTarget = data.goalsSummary?.totalTarget ?? 0;

  const fireYears = data.fireMetrics?.yearsToFire ?? 'N/A';
  const fireTarget = data.fireMetrics?.targets?.standardFire?.number ?? 0;

  const recommendations = data.recommendations || [
    { title: 'Mantener Fondo de Emergencia', text: 'Preserva al menos 6 meses de gastos fijos en liquidez inmediata.' },
    { title: 'Automatización de Aportes', text: 'Automatiza transferencias a inversión a principio de mes (Págate a ti primero).' },
  ];

  // 1. Markdown Format
  const markdown = [
    `# 🏛️ Informe de Diagnóstico y Plan Financiero — AuraFinance`,
    `**Generado para:** ${userName}`,
    `**Fecha de emisión:** ${dateStr}`,
    `**Moneda Base:** ${currency}`,
    `---`,
    `## 🛡️ 1. Índice de Salud Financiera (Health Score)`,
    `- **Puntuación Global:** ${healthScore} / 100`,
    `- **Nivel de Solvencia:** ${healthTier}`,
    ``,
    `## 💰 2. Resumen Patrimonial (Net Worth)`,
    `- **Patrimonio Neto:** $${Number(netWorthTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `- **Total Activos:** $${Number(totalAssets).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `- **Total Pasivos (Deuda):** $${Number(totalLiabilities).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ``,
    `## 🎯 3. Metas de Ahorro e Inversión`,
    `- **Metas Activas:** ${totalGoals}`,
    `- **Capital Acumulado:** $${Number(goalsSaved).toLocaleString('en-US', { minimumFractionDigits: 2 })} de $${Number(goalsTarget).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `- **Progreso Global:** ${goalsTarget > 0 ? Math.round((goalsSaved / goalsTarget) * 100) : 100}%`,
    ``,
    `## 🌴 4. Proyección de Independencia Financiera (FIRE)`,
    `- **Objetivo Standard FIRE (Regla del 4%):** $${Number(fireTarget).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `- **Tiempo Estimado hacia Libertad Financiera:** ${fireYears} años`,
    ``,
    `## 💡 5. Recomendaciones Heurísticas Personalizadas`,
    ...recommendations.map((r, i) => `${i + 1}. **${r.title || 'Recomendación'}**: ${r.text || r.description || ''}`),
    ``,
    `---`,
    `*Informe generado localmente en tu dispositivo con Cero-Conocimiento (Zero-Knowledge). Tus datos nunca abandonan tu navegador.*`,
  ].join('\n');

  // 2. Self-Contained HTML Print Format
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AuraFinance — Informe Financiero (${dateStr})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: #041a14; border-bottom: 3px solid #10b981; padding-bottom: 0.5rem; font-size: 1.6rem; }
    h2 { color: #082e23; margin-top: 1.5rem; font-size: 1.2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3rem; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0; }
    .kpi-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.85rem; }
    .kpi-label { font-size: 0.75rem; color: #166534; text-transform: uppercase; font-weight: 600; }
    .kpi-val { font-size: 1.25rem; font-weight: 700; color: #041a14; }
    ul, ol { padding-left: 1.25rem; }
    li { margin-bottom: 0.5rem; }
    .footer-note { margin-top: 2rem; border-top: 1px dashed #cbd5e1; padding-top: 0.75rem; font-size: 0.8rem; color: #64748b; text-align: center; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>🏛️ AuraFinance — Informe de Diagnóstico y Plan Financiero</h1>
  <div class="meta-box">
    <strong>Titular:</strong> ${userName} | <strong>Fecha:</strong> ${dateStr} | <strong>Moneda:</strong> ${currency}
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Health Score</div>
      <div class="kpi-val">${healthScore}/100</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Patrimonio Neto</div>
      <div class="kpi-val">$${Number(netWorthTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Años hacia FIRE</div>
      <div class="kpi-val">${fireYears} años</div>
    </div>
  </div>

  <h2>1. Diagnóstico de Salud Financiera</h2>
  <p><strong>Nivel Dictaminado:</strong> ${healthTier}</p>

  <h2>2. Desglose Patrimonial</h2>
  <ul>
    <li><strong>Total Activos Líquidos e Invertidos:</strong> $${Number(totalAssets).toLocaleString('en-US', { minimumFractionDigits: 2 })}</li>
    <li><strong>Total Pasivos y Obligaciones:</strong> $${Number(totalLiabilities).toLocaleString('en-US', { minimumFractionDigits: 2 })}</li>
    <li><strong>Patrimonio Neto Consolidado:</strong> $${Number(netWorthTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</li>
  </ul>

  <h2>3. Objetivos de Ahorro y Acumulación</h2>
  <p>Progreso actual: <strong>$${Number(goalsSaved).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> de <strong>$${Number(goalsTarget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> fijados.</p>

  <h2>4. Recomendaciones Estratégicas</h2>
  <ol>
    ${recommendations.map((r) => `<li><strong>${r.title || 'Recomendación'}</strong>: ${r.text || r.description || ''}</li>`).join('')}
  </ol>

  <div class="footer-note">
    AuraFinance • Cero-Conocimiento Criptográfico • Tus datos financieros se procesan exclusivamente en tu dispositivo.
  </div>
</body>
</html>`;

  return {
    metadata: {
      generatedAt: dateStr,
      userName,
      currency,
    },
    summary: {
      healthScore,
      healthTier,
      netWorthTotal,
      fireYears,
      totalGoals,
    },
    markdown,
    html,
  };
}

/**
 * Triggers a browser download of the generated report.
 * @param {string} content - Report string content (HTML, Markdown or JSON)
 * @param {string} filename - Target file name
 * @param {string} [mimeType='text/html']
 */
export function triggerReportDownload(content, filename, mimeType = 'text/html') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
