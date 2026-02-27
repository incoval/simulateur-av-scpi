import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatNumber } from "@/lib/calculations";

export const YEARS_TO_SHOW = [1, 2, 3, 4, 5, 10, 15, 20, 30, 40];

interface SimTableProps {
  headers: string[];
  rows: (string | number)[][];
  onExport: () => void;
  exportDisabled?: boolean;
  exportError?: string;
}

export default function SimTable({ headers, rows, onExport, exportDisabled, exportError }: SimTableProps) {
  const filteredRows = rows.filter(r => {
    const year = typeof r[0] === 'number' ? r[0] : Number(r[0]);
    return YEARS_TO_SHOW.includes(year);
  });

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-serif text-foreground">Détail annuel</h3>
        <div className="relative">
          <Button size="sm" variant="outline" onClick={onExport} disabled={exportDisabled} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Exporter PDF
          </Button>
          {exportError && <p className="absolute top-full right-0 mt-1 text-xs text-destructive whitespace-nowrap">{exportError}</p>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i} className="text-xs font-semibold whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row, ri) => (
              <TableRow key={ri}>
                {row.map((cell, ci) => (
                  <TableCell key={ci} className="text-xs whitespace-nowrap">
                    {ci === 0 ? cell : (typeof cell === 'number' ? `${formatNumber(cell)} €` : cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
