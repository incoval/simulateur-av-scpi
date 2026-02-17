import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatNumber } from "@/lib/calculations";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChartData {
  annee: number;
  capital: number;
  versementsCumules: number;
}

interface SimChartProps {
  data: ChartData[];
  capitalLabel?: string;
}

export default function SimChart({ data, capitalLabel = "Capital" }: SimChartProps) {
  const [showVersements, setShowVersements] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-foreground">Projection</h3>
        <div className="flex items-center gap-2">
          <Switch id="show-v" checked={showVersements} onCheckedChange={setShowVersements} />
          <Label htmlFor="show-v" className="text-xs text-muted-foreground cursor-pointer">Versements cumulés</Label>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
          <XAxis dataKey="annee" tick={{ fontSize: 11 }} label={{ value: "Années", position: "insideBottom", offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${formatNumber(v)} €`} width={90} />
          <Tooltip formatter={(v: number) => `${formatNumber(v)} €`} labelFormatter={l => `Année ${l}`} />
          <Legend />
          <Line type="monotone" dataKey="capital" name={capitalLabel} stroke="hsl(220 55% 18%)" strokeWidth={2.5} dot={false} />
          {showVersements && (
            <Line type="monotone" dataKey="versementsCumules" name="Versements cumulés" stroke="hsl(38 70% 52%)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
