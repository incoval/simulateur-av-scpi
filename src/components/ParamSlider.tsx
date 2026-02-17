import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ParamSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  tooltip?: string;
  disabled?: boolean;
}

export default function ParamSlider({ label, value, onChange, min, max, step = 1, suffix = "", tooltip, disabled }: ParamSliderProps) {
  const handleInput = (raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="param-label text-xs">{label}</Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={e => handleInput(e.target.value)}
            className="w-24 h-7 text-xs text-right"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
          />
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={v => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="cursor-pointer"
      />
    </div>
  );
}
