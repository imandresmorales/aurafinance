/**
 * Financial PDF / Printable Report Generator
 * Genera informes financieros mensuales imprimibles con maquetación ejecutiva,
 * desglose de balances, tablas de transacciones y resumen de salud financiera.
 */

export const generatePrintableReport = ({
  periodName = 'Mes en Curso',
  totalIncome = 0,
  totalExpense = 0,
  netSavings = 0,
  savingsRate = 0,
  transactions = [],
  accounts = [],
}) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para generar el informe imprimible.');
    return;
  }

  const txRows = transactions.slice(0, 30).map((t) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${t.date || ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${t.description || ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${t.category || 'General'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; font-weight: 600; color: ${t.type === 'INCOME' ? '#10b981' : '#ef4444'};">
        ${t.type === 'INCOME' ? '+' : '-'}$${Number(t.amount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Informe Financiero AuraFinance — ${periodName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #041a14; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 800; color: #041a14; margin: 0; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
          .kpi-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .kpi-value { font-size: 20px; font-weight: 700; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; padding: 10px 8px; background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #475569; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">AuraFinance</h1>
            <div class="subtitle">Informe de Balance y Rendimiento Patrimonial — ${periodName}</div>
          </div>
          <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ Imprimir / Guardar como PDF
          </button>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Ingresos Totales</div>
            <div class="kpi-value" style="color: #10b981;">+$${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Gastos Totales</div>
            <div class="kpi-value" style="color: #ef4444;">-$${totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ahorro Neto</div>
            <div class="kpi-value" style="color: #0284c7;">$${netSavings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Tasa de Ahorro</div>
            <div class="kpi-value" style="color: #8b5cf6;">${savingsRate.toFixed(1)}%</div>
          </div>
        </div>

        <h3 style="margin-bottom: 8px; color: #0f172a;">Detalle de Transacciones Recientes</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th style="text-align: right;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${txRows || '<tr><td colspan="4" style="text-align:center;padding:16px;">Sin transacciones</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generado localmente por AuraFinance en modo Cero-Conocimiento. Ningún dato financiero salió de este dispositivo.
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export default generatePrintableReport;
