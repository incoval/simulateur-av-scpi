import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

interface ClientInfoProps {
  nom: string;
  prenom: string;
  age: string;
  onNomChange: (v: string) => void;
  onPrenomChange: (v: string) => void;
  onAgeChange: (v: string) => void;
}

export default function ClientInfo({ nom, prenom, age, onNomChange, onPrenomChange, onAgeChange }: ClientInfoProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-serif text-foreground">Informations client</h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5" />
          Ces informations apparaîtront sur le PDF
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="prenom" className="param-label">Prénom</Label>
          <Input id="prenom" value={prenom} onChange={e => onPrenomChange(e.target.value)} placeholder="Jean" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="nom" className="param-label">Nom</Label>
          <Input id="nom" value={nom} onChange={e => onNomChange(e.target.value)} placeholder="Dupont" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="age" className="param-label">Âge</Label>
          <Input
            id="age"
            type="number"
            min={18}
            max={100}
            value={age}
            onChange={e => onAgeChange(e.target.value)}
            placeholder="35"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
