/**
 * Exportador de transacciones contables a formato CSV estándar (RFC 4180)
 */
export function exportTransactionsToCSV(transactions, accounts = [], filename = 'aurafinance_transacciones.csv') {
  if (!transactions || transactions.length === 0) return false;

  const accountMap = new Map((accounts || []).map((a) => [a.id, a.name]));

  const headers = [
    'ID',
    'Fecha',
    'Tipo',
    'Concepto',
    'Monto',
    'Categoría',
    'Subcategoría',
    'Cuenta Origen',
    'Cuenta Destino',
    'Etiquetas',
    'Ubicación',
    'Tiene Comprobante',
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = transactions.map((tx) => [
    escapeCSV(tx.id),
    escapeCSV(tx.date),
    escapeCSV(tx.type),
    escapeCSV(tx.concept),
    escapeCSV(tx.amount),
    escapeCSV(tx.category || ''),
    escapeCSV(tx.subCategory || ''),
    escapeCSV(tx.sourceAccountId ? accountMap.get(tx.sourceAccountId) || tx.sourceAccountId : ''),
    escapeCSV(tx.destinationAccountId ? accountMap.get(tx.destinationAccountId) || tx.destinationAccountId : ''),
    escapeCSV((tx.tags || []).join(', ')),
    escapeCSV(tx.location?.label || ''),
    escapeCSV(tx.receipt ? 'SÍ' : 'NO'),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
