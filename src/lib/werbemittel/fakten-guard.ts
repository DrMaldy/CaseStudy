/**
 * Fakten-Guard: blockiert nur fachlich FALSCHE Angaben. Korrekte Werte (z. B. der eigene Bankname
 * oder der echte Tarifpreis) sind erlaubt – bevorzugt bleiben trotzdem Tokens wie {{PREIS}}.
 */

export interface FaktenKontext {
  preise: number[];
  gb: number[];
  netz: string;
  telefon: string[];
  domains: string[];
  bankname: string;
}

export function faktenKontext(input: {
  angebot: { preisMonat: number; datenvolumenGb: number; mitgliederBonusGb: number; netz: string };
  bank: { name: string; kurzname: string; website: string; telefon: string };
  filialen: { telefon: string }[];
}): FaktenKontext {
  const { angebot, bank } = input;
  const domain = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  return {
    preise: [angebot.preisMonat],
    gb: [angebot.datenvolumenGb, angebot.mitgliederBonusGb, angebot.datenvolumenGb + angebot.mitgliederBonusGb],
    netz: angebot.netz.toUpperCase(),
    telefon: [bank.telefon, ...input.filialen.map((f) => f.telefon)].map(nurZiffern).filter(Boolean),
    domains: bank.website.startsWith("http") ? [domain(bank.website)] : [],
    bankname: `${bank.name} ${bank.kurzname}`.toLowerCase(),
  };
}

const nurZiffern = (s: string) => s.replace(/\D/g, "");
const zahl = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
// Pronomen nach „Volksbank“ sind keine Banknamen („Volksbank Ihres Vertrauens“).
const KEIN_NAME = /^(Ihr|Ihre|Ihres|Ihrer|Ihren|Dein|Deine|Deiner|Unser|Unsere|Vor)$/;

/** Gibt eine kurze Begründung zurück, wenn der Text fachlich falsche Daten enthält – sonst null. */
export function findeFalscheFachdaten(text: string, k: FaktenKontext): string | null {
  const t = text.replace(/\{\{[A-Z_]+\}\}/g, " "); // Tokens sind immer korrekt

  for (const m of t.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|Euro\b|EUR\b)/gi)) {
    if (!k.preise.some((p) => Math.abs(p - zahl(m[1])) < 0.005)) return `Preis „${m[0].trim()}“ passt nicht zum Tarif`;
  }
  for (const m of t.matchAll(/(\d{1,4})\s*GB\b/gi)) {
    if (!k.gb.includes(zahl(m[1]))) return `Datenvolumen „${m[0]}“ passt nicht zum Tarif`;
  }
  for (const m of t.matchAll(/\b([2-6])\s?G\b/g)) {
    if (`${m[1]}G` !== k.netz) return `Netz „${m[0]}“ passt nicht zum Tarif`;
  }
  if (/\d\s*(%|Prozent)/i.test(t)) return "Prozent-/Rabattangabe gibt es im Tarif nicht";
  if (/Mindestlaufzeit|\b\d+\s*Monate?\s*(Lauf|Vertrag)/i.test(t)) return "Laufzeitangabe widerspricht „monatlich kündbar“";

  for (const m of t.matchAll(/(?:\+49|\b0)\d[\d\s/-]{5,}\d/g)) {
    const nr = nurZiffern(m[0]).replace(/^49/, "0");
    if (!k.telefon.includes(nr)) return `Telefonnummer „${m[0].trim()}“ ist nicht hinterlegt`;
  }
  for (const m of t.matchAll(/\b(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]+\.)+(?:de|com|net|org|info|bank))\b/gi)) {
    const host = m[1].toLowerCase();
    if (!k.domains.some((d) => host === d || host.endsWith(`.${d}`))) return `Webadresse „${m[0]}“ gehört nicht zur Bank`;
  }
  for (const m of t.matchAll(/[\w.+-]+@((?:[\w-]+\.)+\w+)/g)) {
    if (!k.domains.some((d) => m[1].toLowerCase().endsWith(d))) return `E-Mail-Adresse „${m[0]}“ gehört nicht zur Bank`;
  }

  if (/\bSparkasse\b/i.test(t)) return "Fremde Bank genannt";
  for (const m of t.matchAll(/\b(Volksbank|Raiffeisenbank|VR-Bank|VR Bank)\s+([A-ZÄÖÜ][\wäöüß-]+)/g)) {
    if (!KEIN_NAME.test(m[2]) && !k.bankname.includes(`${m[1]} ${m[2]}`.toLowerCase())) return `Fremde Bank „${m[0]}“ genannt`;
  }
  return null;
}
