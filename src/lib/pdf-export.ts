import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber } from './calculations';

interface ClientInfo {
  nom: string;
  prenom: string;
  age: number;
}

interface PDFExportOptions {
  title: string;
  client: ClientInfo;
  params: Record<string, string>;
  headers: string[];
  rows: (string | number)[][];
}

export function exportPDF(options: PDFExportOptions) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { title, client, params, headers, rows } = options;
  const now = new Date().toLocaleDateString('fr-FR');

  // Title
  doc.setFontSize(20);
  doc.setTextColor(30, 45, 80);
  doc.text(title, 14, 22);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Date d'édition : ${now}`, 14, 30);

  // Client info
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Client : ${client.prenom} ${client.nom} — ${client.age} ans`, 14, 38);

  // Params
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  let y = 48;
  doc.text('Hypothèses :', 14, y);
  y += 6;
  Object.entries(params).forEach(([key, value]) => {
    doc.text(`• ${key} : ${value}`, 18, y);
    y += 5;
  });

  y += 4;

  // Table
  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows.map(row => row.map(cell => typeof cell === 'number' ? formatNumber(cell) : cell)),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 45, 80], textColor: 255, fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${client.nom}_${now}.pdf`);
}
