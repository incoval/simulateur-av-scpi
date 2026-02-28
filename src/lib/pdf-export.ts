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
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const navy: [number, number, number] = [30, 45, 80];
  const gold: [number, number, number] = [180, 140, 60];

  // ── Header bar ──
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin, 18);

  doc.setFontSize(9);
  doc.setTextColor(200, 210, 230);
  doc.text(`Date d'edition : ${now}`, margin, 26);

  // ── Client info line ──
  let y = 42;
  doc.setFillColor(245, 246, 250);
  doc.roundedRect(margin, y - 6, contentWidth, 12, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setTextColor(...navy);
  doc.text(`Client : ${client.prenom} ${client.nom} — ${client.age} ans`, margin + 4, y + 1);

  // ── Hypothèses in a subtle box ──
  y += 16;
  const paramEntries = Object.entries(params);
  const paramBoxHeight = 8 + paramEntries.length * 5.5;
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y - 5, contentWidth, paramBoxHeight, 2, 2, 'S');

  doc.setFontSize(10);
  doc.setTextColor(...navy);
  doc.text('Hypotheses', margin + 4, y + 1);
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  paramEntries.forEach(([key, value]) => {
    doc.setTextColor(100, 100, 110);
    doc.text(sanitize(`${key}`), margin + 6, y);
    const keyWidth = doc.getTextWidth(sanitize(key));
    doc.setTextColor(...navy);
    doc.text(sanitize(value), margin + 8 + keyWidth, y);
    y += 5.5;
  });

  y += 6;

  // ── KPI cards ──
  const kpiCardWidth = (contentWidth - 6) / 2;
  const kpiCardHeight = 18;

  kpis.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = margin + col * (kpiCardWidth + 6);
    const yPos = y + row * (kpiCardHeight + 4);

    // Card background
    doc.setFillColor(245, 246, 250);
    doc.roundedRect(xPos, yPos, kpiCardWidth, kpiCardHeight, 2, 2, 'F');

    // Gold accent bar on left
    doc.setFillColor(...gold);
    doc.rect(xPos, yPos + 2, 1.2, kpiCardHeight - 4, 'F');

    // Label
    doc.setFontSize(8);
    doc.setTextColor(110, 115, 130);
    doc.text(sanitize(kpi.label), xPos + 5, yPos + 6);

    // Value
    doc.setFontSize(13);
    doc.setTextColor(...navy);
    doc.text(sanitize(kpi.value), xPos + 5, yPos + 13.5);
  });

  y += Math.ceil(kpis.length / 2) * (kpiCardHeight + 4) + 6;

  // ── Chart capture ──
  let chartImgHeight = 0;
  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    chartImgHeight = (canvas.height / canvas.width) * imgWidth;

    doc.addImage(imgData, 'PNG', margin, y, imgWidth, chartImgHeight);
  } catch (e) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('(Graphique non disponible)', margin, y + 10);
    chartImgHeight = 20;
  }

  // ── Table below chart ──
  if (tableHeaders && tableRows && tableRows.length > 0) {
    let currentY = y + chartImgHeight + 8;

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows.map(row => row.map((cell, ci) => ci === 0 ? String(cell) : (typeof cell === 'number' ? sanitize(formatNumber(cell)) : sanitize(String(cell))))),
      styles: { fontSize: 6.5, cellPadding: 2 },
      headStyles: { fillColor: navy, textColor: 255, fontSize: 6.5, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      margin: { left: margin, right: margin },
    });
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 180);
    doc.text('Document de simulation - les performances passees ne prejugent pas des performances futures.', margin, 290);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - margin - 15, 290);
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${client.nom}_${now}.pdf`);
}
