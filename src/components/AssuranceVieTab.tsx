import { useState, useMemo } from "react";
import { calculateAV, AVParams, formatEuro } from "@/lib/calculations";
import { exportPDF } from "@/lib/pdf-export";
import ParamSlider from "@/components/ParamSlider";
import KPICards from "@/components/KPICards";
import SimChart from "@/components/SimChart";
import SimTable, { YEARS_TO_SHOW } from "@/components/SimTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

const PRESETS = [2, 3, 4, 5];

const DEFAULTS: AVParams = {
  capitalInitial: 10000,
  versementMensuel: 500,
  dureeVersements: 25,
  dureeTotale: 30,
  rendement: 3,
  frais: 0.6,
  fraisActifs: false,
};

interface AVTabProps {
  clientInfo: { nom: string; prenom: string; age: string };
}

export default function AssuranceVieTab({ clientInfo }: AVTabProps) {
  const [params, setParams] = useState<AVParams>({ ...DEFAULTS });
  const [customRate, setCustomRate] = useState(false);
  const [exportError, setExportError] = useState("");

  const update = <K extends keyof AVParams>(key: K, v: AVParams[K]) => setParams(p => ({ ...p, [key]: v }));

  const rows = useMemo(() => calculateAV(params), [params]);
  const last = rows[rows.length - 1];

  const handleExport = () => {
    if (!clientInfo.nom || !clientInfo.prenom || !clientInfo.age) {
      setExportError("Remplissez Nom, Prénom et Âge");
      return;
    }
    setExportError("");
    exportPDF({
      title: "Simulation Assurance Vie",
      client: { nom: clientInfo.nom, prenom: clientInfo.prenom, age: Number(clientInfo.age) },
      params: {
        "Rendement annuel": `${params.rendement} %`,
        "Capital initial": formatEuro(params.capitalInitial),
        "Versement mensuel": formatEuro(params.versementMensuel),
        "Durée versements": `${params.dureeVersements} ans`,
        "Durée totale": `${params.dureeTotale} ans`,
        ...(params.fraisActifs ? { "Frais annuels": `${params.frais} %` } : {}),
      },
      headers: ["Année", "Vers. cumulés", "Vers. annuel", "Intérêts ann.", "Intérêts cum.", "Capital"],
      rows: rows.filter(r => YEARS_TO_SHOW.includes(r.annee)).map(r => [r.annee, r.versementsCumules, r.versementAnnuel, r.interetsAnnuels, r.interetsCumules, r.capital]),
    });
  };

  const ratio = last && last.versementsCumules > 0 ? (last.capital / last.versementsCumules).toFixed(2) : "—";

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <KPICards kpis={[
          { label: "Capital final", value: formatEuro(last?.capital ?? 0) },
          { label: "Versements cumulés", value: formatEuro(last?.versementsCumules ?? 0) },
          { label: "Intérêts cumulés", value: formatEuro(last?.interetsCumules ?? 0), tooltip: "Total des intérêts générés" },
          { label: "Capital / Versements", value: `× ${ratio}`, tooltip: "Effet de levier de vos versements" },
        ]} />
        <SimChart data={rows.map(r => ({ annee: r.annee, capital: r.capital, versementsCumules: r.versementsCumules, interetsCumules: r.interetsCumules }))} interetsLabel="Intérêts cumulés" />
        <SimTable
          headers={["Année", "Vers. cumulés (€)", "Vers. annuel (€)", "Intérêts ann. (€)", "Intérêts cum. (€)", "Capital (€)"]}
          rows={rows.map(r => [r.annee, r.versementsCumules, r.versementAnnuel, r.interetsAnnuels, r.interetsCumules, r.capital])}
          onExport={handleExport}
          exportError={exportError}
        />
      </div>

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
                  customRate ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
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

          <ParamSlider label="Capital initial" value={params.capitalInitial} onChange={v => update("capitalInitial", v)} min={0} max={500000} step={1000} suffix="€" />
          <ParamSlider label="Versement mensuel" value={params.versementMensuel} onChange={v => update("versementMensuel", v)} min={0} max={10000} step={50} suffix="€" />
          <ParamSlider label="Durée versements" value={params.dureeVersements} onChange={v => update("dureeVersements", v)} min={1} max={50} suffix="ans" />
          <ParamSlider label="Durée totale" value={params.dureeTotale} onChange={v => update("dureeTotale", v)} min={1} max={60} suffix="ans" />

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="param-label text-xs">Frais annuels</Label>
              <Switch checked={params.fraisActifs} onCheckedChange={v => update("fraisActifs", v)} />
            </div>
            {params.fraisActifs && (
              <ParamSlider label="Frais" value={params.frais} onChange={v => update("frais", v)} min={0} max={3} step={0.1} suffix="%" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
