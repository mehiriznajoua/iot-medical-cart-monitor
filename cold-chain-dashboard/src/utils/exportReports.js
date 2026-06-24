import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTimestamp } from './formatters.js';

export function exportReportCsv({ alerts, tempStats }) {
  const alertRows = alerts.map((a) => [
    a.timestampLabel,
    a.trolleyName,
    a.type,
    a.severity,
    a.title,
  ]);

  const statRows = tempStats.map((s) => [
    s.name,
    s.current ?? '—',
    s.min ?? '—',
    s.max ?? '—',
    s.average ?? '—',
  ]);

  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const toCsv = (headers, rows) =>
    [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');

  const csv = [
    '=== Alert Events ===',
    toCsv(['Timestamp', 'Trolley', 'Type', 'Severity', 'Title'], alertRows),
    '',
    '=== Temperature Statistics ===',
    toCsv(['Trolley', 'Current', 'Min', 'Max', 'Average'], statRows),
  ].join('\n');

  downloadBlob(csv, `cold-chain-report-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportReportPdf({ alerts, tempStats, stats }) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Cold Chain Monitor — Report', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 28);

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text('Summary', 14, 40);
  doc.setFontSize(10);
  doc.text(`Total Events: ${stats.total}`, 14, 48);
  doc.text(`Active Alerts: ${stats.active}`, 14, 54);
  doc.text(`Resolved: ${stats.resolved}`, 14, 60);

  autoTable(doc, {
    startY: 68,
    head: [['Timestamp', 'Trolley', 'Type', 'Severity']],
    body: alerts.slice(0, 30).map((a) => [
      a.timestampLabel,
      a.trolleyName,
      a.type,
      a.severity,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [13, 148, 136] },
  });

  const finalY = doc.lastAutoTable?.finalY ?? 68;
  autoTable(doc, {
    startY: finalY + 10,
    head: [['Trolley', 'Current', 'Min', 'Max', 'Average']],
    body: tempStats.map((s) => [
      s.name,
      s.current != null ? `${s.current}°C` : '—',
      s.min != null ? `${s.min}°C` : '—',
      s.max != null ? `${s.max}°C` : '—',
      s.average != null ? `${s.average}°C` : '—',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [13, 148, 136] },
  });

  doc.save(`cold-chain-report-${Date.now()}.pdf`);
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildTempStats(trolleys, tempHistory) {
  return trolleys
    .filter((t) => t.online)
    .map((trolley) => {
      const history = tempHistory[trolley.id] || [];
      const values = history.map((p) => p.temperature).filter((v) => !Number.isNaN(v));

      if (!values.length) {
        return {
          id: trolley.id,
          name: trolley.name,
          current: trolley.temperature != null ? Number(trolley.temperature).toFixed(1) : null,
          min: null,
          max: null,
          average: null,
        };
      }

      const min = Math.min(...values);
      const max = Math.max(...values);
      const average = values.reduce((a, b) => a + b, 0) / values.length;

      return {
        id: trolley.id,
        name: trolley.name,
        current: Number(trolley.temperature ?? values[values.length - 1]).toFixed(1),
        min: min.toFixed(1),
        max: max.toFixed(1),
        average: average.toFixed(1),
      };
    });
}
