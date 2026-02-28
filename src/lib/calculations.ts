// ============ SCPI ============
export interface SCPIParams {
  rendement: number; // %
  versementInitial: number;
  versementMensuel: number;
  dureeVersements: number; // years
  dureeTotale: number; // years
  fraisEntree: number; // %
  reinvestir: boolean;
}

export interface SCPIRow {
  annee: number;
  versementsCumules: number;
  versementAnnuel: number;
  revenuMensuel: number;
  revenuAnnuel: number;
  revenusCumules: number;
  capital: number;
}

export function calculateSCPI(p: SCPIParams): SCPIRow[] {
  const rows: SCPIRow[] = [];
  let versementsCumules = 0;
  let revenusCumules = 0;
  let capital = 0;
  const coefNet = 1 - p.fraisEntree / 100;

  for (let annee = 1; annee <= p.dureeTotale; annee++) {
    const versementBrut = annee <= p.dureeVersements ? p.versementMensuel * 12 : 0;
    const versementAnnuel = versementBrut * coefNet;

    if (annee === 1) {
      versementsCumules = p.versementInitial * coefNet + versementAnnuel;
      capital = versementsCumules;
    } else {
      versementsCumules += versementAnnuel;
      capital += versementAnnuel;
    }

    const revenuAnnuel = capital * (p.rendement / 100);
    const revenuMensuel = revenuAnnuel / 12;
    revenusCumules += revenuAnnuel;

    if (p.reinvestir) {
      capital += revenuAnnuel;
      versementsCumules += revenuAnnuel;
    }

    rows.push({
      annee, versementsCumules, versementAnnuel,
      revenuMensuel, revenuAnnuel,
      revenusCumules, capital,
    });
  }
  return rows;
}

// ============ Assurance Vie ============
export interface AVParams {
  capitalInitial: number;
  versementMensuel: number;
  dureeVersements: number;
  dureeTotale: number;
  rendement: number;
  frais: number; // %
  fraisActifs: boolean;
}

export interface AVRow {
  annee: number;
  versementsCumules: number;
  versementAnnuel: number;
  interetsAnnuels: number;
  interetsCumules: number;
  capital: number;
}

export function calculateAV(p: AVParams): AVRow[] {
  const rows: AVRow[] = [];
  const rendementNet = Math.max(0, p.rendement - (p.fraisActifs ? p.frais : 0));
  let capital = 0;
  let versementsCumules = 0;
  let interetsCumules = 0;

  for (let annee = 1; annee <= p.dureeTotale; annee++) {
    const versementAnnuel = annee <= p.dureeVersements ? p.versementMensuel * 12 : 0;

    if (annee === 1) {
      versementsCumules = p.capitalInitial + versementAnnuel;
      const interetsAnnuels = p.capitalInitial * (rendementNet / 100);
      interetsCumules += interetsAnnuels;
      capital = p.capitalInitial + versementAnnuel + interetsAnnuels;
      rows.push({ annee, versementsCumules, versementAnnuel, interetsAnnuels, interetsCumules, capital });
    } else {
      versementsCumules += versementAnnuel;
      const interetsAnnuels = capital * (rendementNet / 100);
      interetsCumules += interetsAnnuels;
      capital = capital + versementAnnuel + interetsAnnuels;
      rows.push({ annee, versementsCumules, versementAnnuel, interetsAnnuels, interetsCumules, capital });
    }
  }
  return rows;
}

// ============ PER ============
export interface PERParams {
  capitalInitial: number;
  versementMensuel: number;
  dureeVersements: number;
  dureeTotale: number;
  rendement: number;
  renteActive: boolean;
  tauxConversion: number; // %
}

export interface PERRow {
  annee: number;
  versementsCumules: number;
  versementAnnuel: number;
  gainsAnnuels: number;
  gainsCumules: number;
  capital: number;
  renteMensuelle?: number;
}

export function calculatePER(p: PERParams): PERRow[] {
  const rows: PERRow[] = [];
  let capital = 0;
  let versementsCumules = 0;
  let gainsCumules = 0;

  for (let annee = 1; annee <= p.dureeTotale; annee++) {
    const versementAnnuel = annee <= p.dureeVersements ? p.versementMensuel * 12 : 0;

    if (annee === 1) {
      versementsCumules = p.capitalInitial + versementAnnuel;
      const gainsAnnuels = p.capitalInitial * (p.rendement / 100);
      gainsCumules += gainsAnnuels;
      capital = p.capitalInitial + versementAnnuel + gainsAnnuels;
      rows.push({ annee, versementsCumules, versementAnnuel, gainsAnnuels, gainsCumules, capital });
    } else {
      versementsCumules += versementAnnuel;
      const gainsAnnuels = capital * (p.rendement / 100);
      gainsCumules += gainsAnnuels;
      capital = capital + versementAnnuel + gainsAnnuels;
      const isLast = annee === p.dureeTotale;
      const renteMensuelle = (p.renteActive && isLast) ? (capital * (p.tauxConversion / 100)) / 12 : undefined;
      rows.push({ annee, versementsCumules, versementAnnuel, gainsAnnuels, gainsCumules, capital, renteMensuelle });
    }
  }
  return rows;
}

// ============ Formatting ============
export function formatEuro(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n));
}
