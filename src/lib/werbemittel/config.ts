/**
 * Baukasten-Registry: Werbemittel-Arten, Formate, Vorlagen, Zielgruppen und Argumente.
 * Fest vorgegeben und versioniert im Code. Ein neues Format = ein neuer Eintrag in `formate`.
 */

export type WerbemittelTyp = "social" | "flyer";
export type Dateiformat = "png" | "jpg" | "pdf";
export type SlotKey = "headline" | "subline" | "cta";
export type Anrede = "DU" | "SIE";

/** Einzeln ausblendbare Bausteine eines Motivs. */
export type ElementKey = "logo" | "headline" | "subline" | "cta" | "preis" | "fakten" | "mitglieder" | "filiale" | "tarif" | "pflicht";

export const ELEMENTE: Record<ElementKey, string> = {
  logo: "Logo",
  headline: "Headline",
  subline: "Subline",
  cta: "Call-to-Action",
  preis: "Preis",
  fakten: "Tarif-Fakten",
  mitglieder: "Mitgliedervorteil",
  filiale: "Filialkontakt",
  tarif: "Tarifzeile",
  pflicht: "Pflichtangaben",
};
export const ELEMENT_KEYS = Object.keys(ELEMENTE) as ElementKey[];

export type HintergrundKey = "bild" | "ultramarin" | "blau" | "hellblau" | "weiss";

/** Hintergründe für Vorlagen mit `hintergrundWaehlbar`. `hell` = helle Schrift nötig. */
export const HINTERGRUENDE: { key: HintergrundKey; label: string; farbe: string; hell: boolean }[] = [
  { key: "bild", label: "Foto vollflächig", farbe: "#002D67", hell: true },
  { key: "ultramarin", label: "Ultramarin", farbe: "#002D67", hell: true },
  { key: "blau", label: "VR-Blau", farbe: "#0066B3", hell: true },
  { key: "hellblau", label: "Hellblau", farbe: "#F2F7FB", hell: false },
  { key: "weiss", label: "Weiß", farbe: "#FFFFFF", hell: false },
];
export const hintergrund = (key: string | null | undefined) => HINTERGRUENDE.find((h) => h.key === key) ?? HINTERGRUENDE[1];

export interface FormatDef {
  key: string;
  label: string;
  verhaeltnis: string;
  /** Pixelmaß für Bildexporte */
  px?: { w: number; h: number };
  /** Druckmaß in Millimetern für PDF-Exporte */
  mm?: { w: number; h: number };
}

export interface TypDef {
  key: WerbemittelTyp;
  label: string;
  beschreibung: string;
  icon: "image" | "file-text";
  formate: FormatDef[];
  /** Zusatzformat, das optional mitexportiert wird (z. B. Story) */
  zusatzformat?: string;
  export: Dateiformat[];
  vorlagen: string[];
  standardAnrede: Anrede;
  /** Zeichenlimits der Text-Bausteine – Grundlage für KI-Schema und Editor-Zähler */
  slots: Record<SlotKey, number>;
  /** Bausteine, die im Editor ein- und ausgeblendet werden können */
  elemente: ElementKey[];
}

export const TYPEN: Record<WerbemittelTyp, TypDef> = {
  social: {
    key: "social",
    label: "Social-Media-Post",
    beschreibung: "Für Instagram, Facebook und LinkedIn Ihrer Bank.",
    icon: "image",
    formate: [
      { key: "feed-1x1", label: "Feed quadratisch", verhaeltnis: "1:1", px: { w: 1080, h: 1080 } },
      { key: "feed-4x5", label: "Feed hoch", verhaeltnis: "4:5", px: { w: 1080, h: 1350 } },
      { key: "story-9x16", label: "Story", verhaeltnis: "9:16", px: { w: 1080, h: 1920 } },
    ],
    zusatzformat: "story-9x16",
    export: ["png", "jpg"],
    vorlagen: ["social-klassisch", "social-foto", "social-vollbild"],
    standardAnrede: "DU",
    slots: { headline: 40, subline: 90, cta: 45 },
    elemente: ["logo", "headline", "subline", "preis", "cta", "tarif", "pflicht"],
  },
  flyer: {
    key: "flyer",
    label: "Filial-Flyer",
    beschreibung: "Zum Auslegen und Mitgeben in der Filiale.",
    icon: "file-text",
    formate: [{ key: "a5-hoch", label: "DIN A5 Hochformat", verhaeltnis: "148 × 210 mm", mm: { w: 148, h: 210 } }],
    export: ["pdf"],
    vorlagen: ["flyer-standard"],
    standardAnrede: "SIE",
    slots: { headline: 50, subline: 160, cta: 45 },
    elemente: ["logo", "headline", "subline", "fakten", "preis", "mitglieder", "cta", "filiale", "tarif", "pflicht"],
  },
};

/** In der Übersicht sichtbar, im Prototyp noch nicht umgesetzt. */
export const KOMMENDE_TYPEN = [
  { label: "Newsletter-Absatz", beschreibung: "Textbaustein mit Bild für Ihren Mitglieder-Newsletter.", meta: "HTML · Text · Bild", icon: "mail" },
  { label: "Plakat", beschreibung: "Für Schaufenster, Aufsteller und Veranstaltungen.", meta: "DIN A1 · A2 · PDF", icon: "file" },
  { label: "VR Banking App Banner", beschreibung: "Teaser im Banking Ihrer Kundinnen und Kunden.", meta: "1200 × 400 px · PNG", icon: "smartphone" },
] as const;

export interface VorlageDef {
  key: string;
  typ: WerbemittelTyp;
  name: string;
  beschreibung: string;
  /** Feste Bausteine der Vorlage (Baukasten-Prinzip) */
  bausteine: string[];
  /** Hintergrund im Editor wählbar (Foto oder Markenfarbe) */
  hintergrundWaehlbar?: boolean;
}

export const VORLAGEN: Record<string, VorlageDef> = {
  "social-klassisch": {
    key: "social-klassisch",
    typ: "social",
    name: "Klassisch Ultramarin",
    beschreibung: "Starke Headline auf Ultramarin, Preis als oranger Akzent.",
    bausteine: ["Hintergrund Ultramarin", "Logo oben links", "Headline", "Subline", "Preis-Badge", "Call-to-Action", "Ortszeile"],
  },
  "social-foto": {
    key: "social-foto",
    typ: "social",
    name: "Foto & Headline",
    beschreibung: "Motiv im gerundeten Bildcontainer, darunter Headline und Preis.",
    bausteine: ["Hintergrund Ultramarin", "Logo oben links", "Bild", "Headline", "Preis-Badge", "Call-to-Action", "Ortszeile"],
  },
  "social-vollbild": {
    key: "social-vollbild",
    typ: "social",
    name: "Freier Hintergrund",
    beschreibung: "Hintergrund frei wählbar: Foto vollflächig oder eine Markenfarbe, Text unten.",
    bausteine: ["Hintergrund wählbar", "Logo oben links", "Headline", "Subline", "Preis-Badge", "Call-to-Action", "Ortszeile"],
    hintergrundWaehlbar: true,
  },
  "flyer-standard": {
    key: "flyer-standard",
    typ: "flyer",
    name: "Filial-Flyer Standard",
    beschreibung: "Bild oben, Tarifdetails, Filialkontakt im Fußbereich.",
    bausteine: ["Bild", "Headline", "Subline", "Tarif-Fakten", "Preis", "Mitgliedervorteil", "Call-to-Action", "Filialkontakt mit Logo", "Pflichtangaben"],
  },
};

export type ZielgruppeKey = "studierende" | "familien" | "pendler" | "mitglieder" | "jugendliche" | "generation50";
export type ArgumentKey = "preis" | "datenvolumen" | "mitglieder" | "kuendbar" | "roaming" | "filiale";

export interface ZielgruppeDef {
  key: ZielgruppeKey;
  label: string;
  beschreibung: string;
  icon: "graduation-cap" | "heart" | "briefcase" | "star" | "smile" | "sun";
  empfohleneArgumente: ArgumentKey[];
  standardBild: string;
}

export const ZIELGRUPPEN: ZielgruppeDef[] = [
  { key: "studierende", label: "Studierende & Azubis", beschreibung: "Preis und Datenvolumen zählen", icon: "graduation-cap", empfohleneArgumente: ["preis", "datenvolumen"], standardBild: "bild-studierende" },
  { key: "familien", label: "Familien", beschreibung: "Planbar für alle im Haushalt", icon: "heart", empfohleneArgumente: ["preis", "kuendbar"], standardBild: "bild-familien" },
  { key: "pendler", label: "Berufstätige & Pendler", beschreibung: "5G-Tempo und EU-Roaming", icon: "briefcase", empfohleneArgumente: ["datenvolumen", "roaming"], standardBild: "bild-pendler" },
  { key: "mitglieder", label: "Bestandsmitglieder", beschreibung: "+15 GB Mitgliedervorteil", icon: "star", empfohleneArgumente: ["mitglieder", "filiale"], standardBild: "bild-mitglieder" },
  { key: "jugendliche", label: "Jugendliche & Eltern", beschreibung: "Erstes Handy, volle Kostenkontrolle", icon: "smile", empfohleneArgumente: ["kuendbar", "preis"], standardBild: "bild-jugendliche" },
  { key: "generation50", label: "Generation 50+", beschreibung: "Persönliche Beratung in der Filiale", icon: "sun", empfohleneArgumente: ["filiale", "kuendbar"], standardBild: "bild-generation50" },
];

/** Argumente referenzieren Konditionen nur über Tokens – die Werte kommen aus dem Angebot. */
export const ARGUMENTE: { key: ArgumentKey; label: string }[] = [
  { key: "preis", label: "{{PREIS}} im Monat" },
  { key: "datenvolumen", label: "{{DATENVOLUMEN}} & {{NETZ}}" },
  { key: "mitglieder", label: "+{{MITGLIEDERBONUS}} für Mitglieder" },
  { key: "kuendbar", label: "Monatlich kündbar" },
  { key: "roaming", label: "EU-Roaming inklusive" },
  { key: "filiale", label: "Abschluss in der Filiale" },
];

export const MAX_ARGUMENTE = 2;

export const SCHRITTE = [
  { key: "format", label: "Format", sub: "Werbemittel wählen" },
  { key: "zielgruppe", label: "Zielgruppe", sub: "Ansprache & Botschaft" },
  { key: "vorschlag", label: "Vorschlag", sub: "KI-Entwurf generieren" },
  { key: "gestalten", label: "Gestalten", sub: "Text, Bild, Region" },
  { key: "export", label: "Prüfen & Export", sub: "Freigabe & Download" },
] as const;

export type SchrittKey = (typeof SCHRITTE)[number]["key"];

export const zielgruppe = (key: string | null | undefined) => ZIELGRUPPEN.find((z) => z.key === key);
export const formatDef = (typ: WerbemittelTyp, key: string) =>
  TYPEN[typ].formate.find((f) => f.key === key) ?? TYPEN[typ].formate[0];

/** CSS-Pixelmaß eines Formats (mm bei 96 dpi) – für Vorschau und Rendering. */
export function pixelMass(f: FormatDef) {
  if (f.px) return f.px;
  const mm = f.mm!;
  return { w: Math.round((mm.w * 96) / 25.4), h: Math.round((mm.h * 96) / 25.4) };
}

export const istPlatzhalter = (wert: string) => wert.startsWith("[PLATZHALTER");
