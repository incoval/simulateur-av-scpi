import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface KPI {
  label: string;
  value: string;
  tooltip?: string;
}

interface KPICardsProps {
  kpis: KPI[];
}

export default function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="kpi-card">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="param-label text-xs">{kpi.label}</span>
            {kpi.tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-xs">{kpi.tooltip}</TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-xl font-bold text-foreground font-serif">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
