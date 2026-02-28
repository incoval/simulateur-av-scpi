import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatNumber } from "@/lib/calculations";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SCPIChartData {
  annee: number;
  versementsCumules: number;
  revenusCumules: number;
  capital: number;
  revenuAnnuel?: number;
  revenuMensuel?: number;
}

interface SCPIChartProps {
  data: SCPIChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-background border border-border/50 rounded-lg shadow-xl px-3 py-2 text-xs space-y-1">
      <p className="font-medium text-foreground">Année {label}</p>
      <p className="text-muted-foreground">Versements cumulés : <span className="font-medium text-foreground">{formatNumber(d.versementsCumules)} €</span></p>
      <p className="text-muted-foreground">Revenus cumulés : <span className="font-medium text-foreground">{formatNumber(d.revenusCumules)} €</span></p>
      <p className="text-muted-foreground">Capital total : <span className="font-semibold text-foreground">{formatNumber(d.capital)} €</span></p>
      {d.revenuAnnuel != null && (
        <p className="text-muted-foreground">Revenu annuel : <span className="font-medium text-foreground">{formatNumber(d.revenuAnnuel)} €</span></p>
      )}
      {d.revenuMensuel != null && (
        <p className="text-muted-foreground">Revenu mensuel : <span className="font-medium text-foreground">{formatNumber(d.revenuMensuel)} €</span></p>
      )}
    </div>
  );
};

export default function SCPIChart({ data }: SCPIChartProps) {
  const [showLine, setShowLine] = useState(false);

  const tickInterval = data.length > 35 ? (data.length > 45 ? 4 : 1) : 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-foreground">Projection</h3>
        <div className="flex items-center gap-2" data-html2canvas-ignore="true">
          <Switch id="show-line" checked={showLine} onCheckedChange={setShowLine} />
          <Label htmlFor="show-line" className="text-xs text-muted-foreground cursor-pointer">
            Courbe Revenus cumulés
          </Label>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
          <XAxis
            dataKey="annee"
            tick={{ fontSize: 11 }}
            interval={tickInterval}
            label={{ value: "Années", position: "insideBottom", offset: -2, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${formatNumber(v)} €`}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="versementsCumules"
            name="Versements cumulés"
            stackId="a"
            fill="hsl(220 55% 45%)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="revenusCumules"
            name="Revenus cumulés"
            stackId="a"
            fill="hsl(38 70% 52%)"
            radius={[2, 2, 0, 0]}
          />
          {showLine && (
            <Line
              type="monotone"
              dataKey="revenusCumules"
              name="Revenus cumulés"
              stroke="hsl(38 85% 45%)"
              strokeWidth={2}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <p className="text-[11px] text-muted-foreground mt-3 text-center">
        Les barres montrent la composition du capital : votre épargne investie (versements) + ce qu'elle a généré (revenus).
      </p>
    </div>
  );
}
