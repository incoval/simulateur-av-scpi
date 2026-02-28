import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { formatNumber } from './calculations';

interface ClientInfo {
  nom: string;
  prenom: string;
  age: number;
}

interface KPI {
  label: string;
  value: string;
}

// Normalize narrow no-break spaces (U+202F) and no-break spaces (U+00A0) to regular spaces
// jsPDF renders these Unicode spaces as "/" or garbled characters
function sanitize(text: string): string {
  return text.replace(/[\u202F\u00A0]/g, ' ');
}

// Legacy table-based export (used by AV and PER)
interface PDFExportOptions {
  title: string;
  client: ClientInfo;
  params: Record<string, string>;
  headers: string[];
  rows: (string | number)[][];
}

// New chart-based export (used by SCPI)
interface PDFChartExportOptions {
  title: string;
  client: ClientInfo;
  params: Record<string, string>;
  kpis: KPI[];
  chartElement: HTMLElement;
  tableHeaders?: string[];
  tableRows?: (string | number)[][];
}

export function exportPDF(options: PDFExportOptions) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { title, client, params, headers, rows } = options;
  const now = new Date().toLocaleDateString('fr-FR');

  doc.setFontSize(20);
  doc.setTextColor(30, 45, 80);
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Date d'édition : ${now}`, 14, 30);

  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Client : ${client.prenom} ${client.nom} — ${client.age} ans`, 14, 38);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  let y = 48;
  doc.text('Hypothèses :', 14, y);
  y += 6;
  Object.entries(params).forEach(([key, value]) => {
    doc.text(sanitize(`• ${key} : ${value}`), 18, y);
    y += 5;
  });

  y += 4;

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows.map(row => row.map(cell => typeof cell === 'number' ? sanitize(formatNumber(cell)) : sanitize(String(cell)))),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 45, 80], textColor: 255, fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${client.nom}_${now}.pdf`);
}

export async function exportPDFWithChart(options: PDFChartExportOptions) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { title, client, params, kpis, chartElement, tableHeaders, tableRows } = options;
  const now = new Date().toLocaleDateString('fr-FR');
  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const navy: [number, number, number] = [30, 45, 80];
  const gold: [number, number, number] = [180, 140, 60];

  // ── Header bar (compact) ──
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin, 12);

  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text(`${now}`, margin, 18);

  // Client info inline with date
  doc.text(`${client.prenom} ${client.nom} — ${client.age} ans`, pageWidth - margin - doc.getTextWidth(`${client.prenom} ${client.nom} — ${client.age} ans`), 18);

  // ── Hypothèses + KPIs side by side ──
  let y = 28;
  const paramEntries = Object.entries(params);
  const leftColWidth = contentWidth * 0.42;
  const rightColWidth = contentWidth - leftColWidth - 4;

  // Left: Hypothèses
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  const paramBoxH = 6 + paramEntries.length * 4.5;
  doc.roundedRect(margin, y, leftColWidth, paramBoxH, 1.5, 1.5, 'S');

  doc.setFontSize(8);
  doc.setTextColor(...navy);
  doc.text('Hypotheses', margin + 3, y + 4.5);
  let py = y + 9;
  doc.setFontSize(7.5);
  paramEntries.forEach(([key, value]) => {
    doc.setTextColor(100, 100, 110);
    doc.text(sanitize(key), margin + 3, py);
    doc.setTextColor(...navy);
    doc.text(sanitize(value), margin + leftColWidth - 3, py, { align: 'right' });
    py += 4.5;
  });

  // Right: KPI cards (2x2 grid)
  const kpiX = margin + leftColWidth + 4;
  const kpiW = (rightColWidth - 3) / 2;
  const kpiH = (paramBoxH - 3) / 2;

  kpis.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = kpiX + col * (kpiW + 3);
    const yPos = y + row * (kpiH + 3);

    doc.setFillColor(245, 246, 250);
    doc.roundedRect(xPos, yPos, kpiW, kpiH, 1.5, 1.5, 'F');

    doc.setFillColor(...gold);
    doc.rect(xPos, yPos + 1.5, 1, kpiH - 3, 'F');

    doc.setFontSize(6.5);
    doc.setTextColor(110, 115, 130);
    doc.text(sanitize(kpi.label), xPos + 4, yPos + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text(sanitize(kpi.value), xPos + 4, yPos + kpiH - 3);
  });

  y += paramBoxH + 5;

  // ── Chart capture (reduced height) ──
  let chartImgHeight = 0;
  // Hide elements marked for exclusion
  const hiddenEls = chartElement.querySelectorAll<HTMLElement>('[data-html2canvas-ignore]');
  hiddenEls.forEach(el => el.style.display = 'none');
  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    chartImgHeight = Math.min((canvas.height / canvas.width) * imgWidth, 85);

    doc.addImage(imgData, 'PNG', margin, y, imgWidth, chartImgHeight);
  } catch (e) {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('(Graphique non disponible)', margin, y + 10);
    chartImgHeight = 15;
  } finally {
    hiddenEls.forEach(el => el.style.display = '');
  }

  // ── Table below chart ──
  if (tableHeaders && tableRows && tableRows.length > 0) {
    const currentY = y + chartImgHeight + 4;

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows.map(row => row.map((cell, ci) => ci === 0 ? String(cell) : (typeof cell === 'number' ? sanitize(formatNumber(cell)) : sanitize(String(cell))))),
      styles: { fontSize: 6, cellPadding: 1.2 },
      headStyles: { fillColor: navy, textColor: 255, fontSize: 6, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      margin: { left: margin, right: margin },
    });
  }

  // ── Footer ──
  doc.setFontSize(6.5);
  doc.setTextColor(170, 170, 180);
  doc.text('Document de simulation - les performances passees ne prejugent pas des performances futures.', margin, 290);

  doc.save(`${title.replace(/\s+/g, '_')}_${client.nom}_${now}.pdf`);
}
