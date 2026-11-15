/** Platzhalter-Tokens: Die KI schreibt nur Tokens, die echten Werte setzt die App aus den Stammdaten ein. */
export const TOKENS = ["PREIS", "DATENVOLUMEN", "NETZ", "MITGLIEDERBONUS", "TARIF", "ORT", "BANK", "FILIALE"] as const;
export type Token = (typeof TOKENS)[number];
export type Fakten = Record<Token, string>;

const TOKEN_RE = /\{\{([A-Z_]+)\}\}/g;

interface Quellen {
  angebot: { name: string; preisMonat: number; datenvolumenGb: number; netz: string; mitgliederBonusGb: number };
  bank: { kurzname: string };
  filiale: { name: string; ort: string };
}

export const formatEuro = (betrag: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(betrag);

export function fakten({ angebot, bank, filiale }: Quellen): Fakten {
  return {
    PREIS: formatEuro(angebot.preisMonat),
    DATENVOLUMEN: `${angebot.datenvolumenGb} GB`,
    NETZ: angebot.netz,
    MITGLIEDERBONUS: `${angebot.mitgliederBonusGb} GB`,
    TARIF: angebot.name,
    ORT: filiale.ort,
    BANK: bank.kurzname,
    FILIALE: filiale.name,
  };
}

export function resolveTokens(text: string, f: Fakten) {
  return text.replace(TOKEN_RE, (match, key: string) => (key in f ? f[key as Token] : match));
}

/** Alle Tokens im Text, die nicht zur erlaubten Liste gehören. */
export function unbekannteTokens(text: string) {
  return [...text.matchAll(TOKEN_RE)].map((m) => m[1]).filter((k) => !TOKENS.includes(k as Token));
}
