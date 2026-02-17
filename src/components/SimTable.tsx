import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatNumber } from "@/lib/calculations";

interface SimTableProps {
  headers: string[];
  rows: (string | number)[][];
  onExport: () => void;
  exportDisabled?: boolean;
  exportError?: string;
}

export default function SimTable({ headers, rows, onExport, exportDisabled, exportError }: SimTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-serif text-foreground">Détail annuel</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Lignes :</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Button size="sm" variant="outline" onClick={onExport} disabled={exportDisabled} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Exporter PDF
            </Button>
            {exportError && <p className="absolute top-full right-0 mt-1 text-xs text-destructive whitespace-nowrap">{exportError}</p>}
          </div>
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
            {paginatedRows.map((row, ri) => (
              <TableRow key={ri}>
                {row.map((cell, ci) => (
                  <TableCell key={ci} className="text-xs whitespace-nowrap">
                    {typeof cell === 'number' ? `${formatNumber(cell)} €` : cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-xs">
            ← Précédent
          </Button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="text-xs">
            Suivant →
          </Button>
        </div>
      )}
    </div>
  );
}
