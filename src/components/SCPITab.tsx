import { useState, useMemo, useRef } from "react";
import { calculateSCPI, SCPIParams, formatEuro } from "@/lib/calculations";
import { exportPDFWithChart } from "@/lib/pdf-export";
import ParamSlider from "@/components/ParamSlider";
import KPICards from "@/components/KPICards";
import SCPIChart from "@/components/SCPIChart";
import SimTable from "@/components/SimTable";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const PRESETS = [3, 4, 5, 6, 7];

const DEFAULTS: SCPIParams = {
  rendement: 5,
  versementInitial: 10000,
  versementMensuel: 750,
  dureeVersements: 25,
  dureeTotale: 50,
};

interface SCPITabProps {
  clientInfo: { nom: string; prenom: string; age: string };
}

export default function SCPITab({ clientInfo }: SCPITabProps) {
  const [params, setParams] = useState<SCPIParams>({ ...DEFAULTS });
  const [customRate, setCustomRate] = useState(false);
  const [exportError, setExportError] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  const update = (key: keyof SCPIParams, v: number) => setParams(p => ({ ...p, [key]: v }));

  const rows = useMemo(() => calculateSCPI(params), [params]);
  const last = rows[rows.length - 1];

  const kpis = [
    { label: "Capital final", value: formatEuro(last?.capital ?? 0) },
    { label: "Versements cumulés", value: formatEuro(last?.versementsCumules ?? 0) },
    { label: "Revenus cumulés", value: formatEuro(last?.revenusCumules ?? 0) },
    { label: `Revenu mensuel (an ${params.dureeTotale})`, value: formatEuro(last?.revenuMensuel ?? 0) },
  ];

  const handleExport = async () => {
    if (!clientInfo.nom || !clientInfo.prenom || !clientInfo.age) {
      setExportError("Remplissez Nom, Prénom et Âge");
      return;
    }
    if (!chartRef.current) {
      setExportError("Graphique non disponible");
      return;
    }
    setExportError("");
    await exportPDFWithChart({
      title: "Simulation SCPI",
      client: { nom: clientInfo.nom, prenom: clientInfo.prenom, age: Number(clientInfo.age) },
      params: {
        "Rendement annuel": `${params.rendement} %`,
        "Versement initial": formatEuro(params.versementInitial),
        "Versement mensuel": formatEuro(params.versementMensuel),
        "Durée versements": `${params.dureeVersements} ans`,
        "Durée totale": `${params.dureeTotale} ans`,
      },
      kpis,
      chartElement: chartRef.current,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left — Results */}
      <div className="flex-1 min-w-0">
        <KPICards kpis={kpis.map((k, i) => i === 2 ? { ...k, tooltip: "Total des revenus perçus sur la durée" } : k)} />
        <div ref={chartRef}>
          <SCPIChart data={rows.map(r => ({ annee: r.annee, capital: r.capital, versementsCumules: r.versementsCumules, revenusCumules: r.revenusCumules, revenuAnnuel: r.revenuAnnuel, revenuMensuel: r.revenuMensuel }))} />
        </div>
        <SimTable
          headers={["Année", "Vers. cumulés (€)", "Vers. annuel (€)", "Rev. mensuel (€)", "Rev. annuel (€)", "Rés. cumulés (€)", "Revenus cum. (€)", "Capital (€)"]}
          rows={rows.map(r => [r.annee, r.versementsCumules, r.versementAnnuel, r.revenuMensuel, r.revenuAnnuel, r.resultatCumules, r.revenusCumules, r.capital])}
          onExport={handleExport}
          exportDisabled={false}
          exportError={exportError}
        />
      </div>

      {/* Right — Parameters */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 lg:sticky lg:top-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-foreground">Hypothèses</h3>
            <Button size="sm" variant="ghost" onClick={() => { setParams({ ...DEFAULTS }); setCustomRate(false); }} className="text-xs gap-1">
              <RotateCcw className="w-3 h-3" /> Réinitialiser
            </Button>
          </div>

          <div>
            <span className="param-label text-xs block mb-2">Taux de rendement</span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => { update("rendement", p); setCustomRate(false); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    !customRate && params.rendement === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {p} %
                </button>
              ))}
              <button
                onClick={() => setCustomRate(true)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  customRate
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                Personnalisé
              </button>
            </div>
            {customRate && (
              <ParamSlider label="Rendement" value={params.rendement} onChange={v => update("rendement", v)} min={0} max={15} step={0.1} suffix="%" />
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Le rendement est une hypothèse, non garanti.</p>
          </div>

          <ParamSlider label="Versement initial" value={params.versementInitial} onChange={v => update("versementInitial", v)} min={0} max={500000} step={1000} suffix="€" />
          <ParamSlider label="Versement mensuel" value={params.versementMensuel} onChange={v => update("versementMensuel", v)} min={0} max={10000} step={50} suffix="€" />

          <div className="flex items-center justify-between">
            <span className="param-label text-xs">Versement annuel</span>
            <span className="param-value text-xs">{formatEuro(params.versementMensuel * 12)}</span>
          </div>

          <ParamSlider label="Durée versements" value={params.dureeVersements} onChange={v => update("dureeVersements", v)} min={1} max={50} suffix="ans" />
          <ParamSlider label="Durée totale" value={params.dureeTotale} onChange={v => update("dureeTotale", v)} min={1} max={60} suffix="ans" />
        </div>
      </div>
    </div>
  );
}
