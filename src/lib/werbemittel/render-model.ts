import { ELEMENT_KEYS, TYPEN, formatDef, hintergrund, pixelMass, istPlatzhalter, type ElementKey, type HintergrundKey, type WerbemittelTyp } from "./config";
import { fakten, formatEuro, resolveTokens } from "./tokens";

/** Alles, was eine Vorlage zum Rendern braucht – Texte bereits mit aufgelösten Tokens. */
export interface RenderModel {
  typ: WerbemittelTyp;
  vorlage: string;
  breite: number;
  hoehe: number;
  headline: string;
  subline: string;
  cta: string;
  bankName: string;
  logoSrc: string;
  bildSrc: string | null;
  ortZeile: string | null;
  preis: string;
  tarifZeile: string;
  fakten: string[];
  mitgliederVorteil: string;
  filiale: { name: string; adresse: string; oeffnungszeiten: string; telefon: string };
  pflichtangaben: string;
  /** Welche Bausteine die Vorlage zeigt – ausgeblendete Elemente bleiben im Model, werden aber nicht gerendert. */
  sichtbar: Record<ElementKey, boolean>;
  hintergrund: HintergrundKey;
}

/** Liest das JSON-Feld `ausgeblendet` aus der Datenbank; unbekannte Keys werden verworfen. */
export function parseAusgeblendet(json: string | null | undefined): ElementKey[] {
  try {
    const roh: unknown = JSON.parse(json ?? "[]");
    return Array.isArray(roh) ? ELEMENT_KEYS.filter((k) => roh.includes(k)) : [];
  } catch {
    return [];
  }
}

export interface RenderInput {
  wm: {
    typ: string;
    format: string;
    vorlage: string;
    headline: string;
    subline: string;
    cta: string;
    ortImMotiv: boolean;
    bildAsset: { datei: string } | null;
    ausgeblendet?: readonly string[];
    hintergrund?: string;
  };
  formatKey?: string;
  bank: { kurzname: string; logoPfad: string };
  filiale: { name: string; strasse: string; plz: string; ort: string; oeffnungszeiten: string; telefon: string };
  angebot: {
    name: string; preisMonat: number; datenvolumenGb: number; netz: string; roaming: string;
    mitgliederBonusGb: number; laufzeit: string; pflichtangaben: string;
  };
  /** Wandelt öffentliche Pfade in ladbare URLs (Vorschau) bzw. data-URIs (Export) um. */
  asset?: (pfad: string) => string;
}

export function buildRenderModel({ wm, formatKey, bank, filiale, angebot, asset = (p) => p }: RenderInput): RenderModel {
  const typ = wm.typ as WerbemittelTyp;
  const { w, h } = pixelMass(formatDef(typ, formatKey ?? wm.format));
  const f = fakten({ angebot, bank, filiale });
  const aus = new Set(wm.ausgeblendet ?? []);
  const sichtbar = Object.fromEntries(ELEMENT_KEYS.map((k) => [k, !aus.has(k)])) as Record<ElementKey, boolean>;
  const adresse = istPlatzhalter(filiale.strasse) ? filiale.strasse : `${filiale.strasse}, ${filiale.plz} ${filiale.ort}`;

  return {
    typ,
    vorlage: TYPEN[typ].vorlagen.includes(wm.vorlage) ? wm.vorlage : TYPEN[typ].vorlagen[0],
    breite: w,
    hoehe: h,
    headline: resolveTokens(wm.headline, f),
    subline: resolveTokens(wm.subline, f),
    cta: resolveTokens(wm.cta, f),
    bankName: bank.kurzname,
    logoSrc: asset(bank.logoPfad),
    bildSrc: wm.bildAsset ? asset(wm.bildAsset.datei) : null,
    ortZeile: wm.ortImMotiv ? `${filiale.name} · ${adresse}` : null,
    preis: `${formatEuro(angebot.preisMonat)}/Monat`,
    tarifZeile: `${angebot.name} · ${angebot.netz} · ${angebot.laufzeit}`,
    fakten: [`${angebot.datenvolumenGb} GB`, angebot.netz, angebot.roaming, angebot.laufzeit],
    mitgliederVorteil: `Mitgliedervorteil: +${angebot.mitgliederBonusGb} GB Datenvolumen – insgesamt ${angebot.datenvolumenGb + angebot.mitgliederBonusGb} GB`,
    filiale: { name: filiale.name, adresse, oeffnungszeiten: filiale.oeffnungszeiten, telefon: filiale.telefon },
    pflichtangaben: angebot.pflichtangaben,
    sichtbar,
    hintergrund: hintergrund(wm.hintergrund).key,
  };
}
