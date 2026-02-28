import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatNumber } from "@/lib/calculations";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChartData {
  annee: number;
  capital: number;
  versementsCumules: number;
  interetsCumules?: number;
}

interface SimChartProps {
  data: ChartData[];
  capitalLabel?: string;
  interetsLabel?: string;
}

export default function SimChart({ data, capitalLabel = "Capital", interetsLabel = "Intérêts cumulés" }: SimChartProps) {
  const [showLine, setShowLine] = useState(false);

  const chartData = data.map(d => ({
    ...d,
    interetsCumules: d.interetsCumules ?? (d.capital - d.versementsCumules),
  }));

  const maxAnnee = Math.max(...data.map(d => d.annee));
  const interval = maxAnnee > 35 ? 4 : maxAnnee > 20 ? 2 : 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-foreground">Projection</h3>
        <div className="flex items-center gap-2" data-html2canvas-ignore="true">
          <Switch id="show-line" checked={showLine} onCheckedChange={setShowLine} />
          <Label htmlFor="show-line" className="text-xs text-muted-foreground cursor-pointer">Courbe Capital total</Label>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
          <XAxis dataKey="annee" tick={{ fontSize: 11 }} interval={interval} label={{ value: "Années", position: "insideBottom", offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${formatNumber(v)} €`} width={90} />
          <Tooltip formatter={(v: number) => `${formatNumber(v)} €`} labelFormatter={l => `Année ${l}`} />
          <Legend />
          <Bar dataKey="versementsCumules" name="Versements cumulés" stackId="a" fill="hsl(220 55% 18%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="interetsCumules" name={interetsLabel} stackId="a" fill="hsl(38 70% 52%)" radius={[4, 4, 0, 0]} />
          {showLine && (
            <Line type="monotone" dataKey="capital" name="Capital total" stroke="hsl(150 60% 40%)" strokeWidth={2} dot={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
