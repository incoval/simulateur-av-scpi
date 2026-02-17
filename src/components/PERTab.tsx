import { useState, useMemo } from "react";
import { calculatePER, PERParams, formatEuro } from "@/lib/calculations";
import { exportPDF } from "@/lib/pdf-export";
import ParamSlider from "@/components/ParamSlider";
import KPICards from "@/components/KPICards";
import SimChart from "@/components/SimChart";
import SimTable from "@/components/SimTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

const PRESETS = [3, 4, 5, 6];

const DEFAULTS: PERParams = {
  capitalInitial: 5000,
  versementMensuel: 400,
  dureeVersements: 25,
  dureeTotale: 30,
  rendement: 4,
  renteActive: false,
  tauxConversion: 4,
};

interface PERTabProps {
  clientInfo: { nom: string; prenom: string; age: string };
}

export default function PERTab({ clientInfo }: PERTabProps) {
  const [params, setParams] = useState<PERParams>({ ...DEFAULTS });
  const [customRate, setCustomRate] = useState(false);
  const [exportError, setExportError] = useState("");

  const update = <K extends keyof PERParams>(key: K, v: PERParams[K]) => setParams(p => ({ ...p, [key]: v }));

  const rows = useMemo(() => calculatePER(params), [params]);
  const last = rows[rows.length - 1];

  const renteMensuelle = params.renteActive && last ? (last.capital * (params.tauxConversion / 100)) / 12 : null;

  const handleExport = () => {
    if (!clientInfo.nom || !clientInfo.prenom || !clientInfo.age) {
      setExportError("Remplissez Nom, Prénom et Âge");
      return;
    }
    setExportError("");
    const headers = ["Année", "Vers. cumulés", "Vers. annuel", "Gains ann.", "Gains cum.", "Capital"];
    if (params.renteActive) headers.push("Rente mens.");
    exportPDF({
      title: "Simulation PER",
      client: { nom: clientInfo.nom, prenom: clientInfo.prenom, age: Number(clientInfo.age) },
      params: {
        "Rendement annuel": `${params.rendement} %`,
        "Capital initial": formatEuro(params.capitalInitial),
        "Versement mensuel": formatEuro(params.versementMensuel),
        "Durée versements": `${params.dureeVersements} ans`,
        "Durée totale": `${params.dureeTotale} ans`,
        ...(params.renteActive ? { "Taux de conversion": `${params.tauxConversion} %` } : {}),
      },
      headers,
      rows: rows.map(r => {
        const base: (string | number)[] = [r.annee, r.versementsCumules, r.versementAnnuel, r.gainsAnnuels, r.gainsCumules, r.capital];
        if (params.renteActive) base.push(r.renteMensuelle ?? 0);
        return base;
      }),
    });
  };

  const tableHeaders = ["Année", "Vers. cumulés (€)", "Vers. annuel (€)", "Gains ann. (€)", "Gains cum. (€)", "Capital (€)"];
  if (params.renteActive) tableHeaders.push("Rente mens. (€)");

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <KPICards kpis={[
          { label: "Capital final", value: formatEuro(last?.capital ?? 0) },
          { label: "Versements cumulés", value: formatEuro(last?.versementsCumules ?? 0) },
          { label: "Gains cumulés", value: formatEuro(last?.gainsCumules ?? 0), tooltip: "Total des plus-values générées" },
          ...(renteMensuelle != null
            ? [{ label: "Rente mensuelle estimée", value: formatEuro(renteMensuelle), tooltip: "Estimation basée sur le taux de conversion" }]
            : [{ label: `Gains an ${params.dureeTotale}`, value: formatEuro(last?.gainsAnnuels ?? 0) }]),
        ]} />
        <SimChart data={rows.map(r => ({ annee: r.annee, capital: r.capital, versementsCumules: r.versementsCumules }))} />
        <SimTable
          headers={tableHeaders}
          rows={rows.map(r => {
            const base: (string | number)[] = [r.annee, r.versementsCumules, r.versementAnnuel, r.gainsAnnuels, r.gainsCumules, r.capital];
            if (params.renteActive) base.push(r.renteMensuelle ?? 0);
            return base;
          })}
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
              <Label className="param-label text-xs">Sortie en rente</Label>
              <Switch checked={params.renteActive} onCheckedChange={v => update("renteActive", v)} />
            </div>
            {params.renteActive && (
              <ParamSlider
                label="Taux de conversion"
                value={params.tauxConversion}
                onChange={v => update("tauxConversion", v)}
                min={1}
                max={10}
                step={0.1}
                suffix="%"
                tooltip="Hypothèse simplifiée de conversion en rente"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
