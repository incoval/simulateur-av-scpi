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

  // Title
  doc.setFontSize(20);
  doc.setTextColor(30, 45, 80);
  doc.text(title, margin, 22);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Date d'édition : ${now}`, margin, 30);

  // Client info
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Client : ${client.prenom} ${client.nom} — ${client.age} ans`, margin, 40);

  // Params
  let y = 50;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Hypothèses :', margin, y);
  y += 6;
  Object.entries(params).forEach(([key, value]) => {
    doc.text(sanitize(`• ${key} : ${value}`), margin + 4, y);
    y += 5;
  });

  y += 6;

  // KPIs as a grid
  doc.setFontSize(10);
  doc.setTextColor(30, 45, 80);
  doc.text('Résultats clés', margin, y);
  y += 6;

  const kpiColWidth = contentWidth / 2;
  kpis.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = margin + col * kpiColWidth;
    const yPos = y + row * 12;

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(sanitize(kpi.label), xPos, yPos);

    doc.setFontSize(12);
    doc.setTextColor(30, 45, 80);
    doc.text(sanitize(kpi.value), xPos, yPos + 5);
  });

  y += Math.ceil(kpis.length / 2) * 12 + 8;

  // Chart capture
  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
  } catch (e) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('(Graphique non disponible)', margin, y + 10);
  }

  // Table below chart
  if (tableHeaders && tableRows && tableRows.length > 0) {
    const lastY = (doc as any).lastAutoTable?.finalY ?? y + 120;
    const tableStartY = Math.min(lastY, (doc as any).internal?.pageSize?.height ?? 280);
    
    // Get current Y position after chart
    let currentY: number;
    try {
      // Estimate position after chart image
      const canvas = await html2canvas(chartElement, { scale: 1, logging: false });
      const imgHeight = (canvas.height / canvas.width) * contentWidth;
      currentY = y + imgHeight + 8;
    } catch {
      currentY = y + 80;
    }

    // Add new page if not enough space
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableRows.map(row => row.map((cell, ci) => ci === 0 ? String(cell) : (typeof cell === 'number' ? sanitize(formatNumber(cell)) : sanitize(String(cell))))),
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 45, 80], textColor: 255, fontSize: 6 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${client.nom}_${now}.pdf`);
}
