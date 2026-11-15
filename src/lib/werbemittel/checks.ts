import { TYPEN, istPlatzhalter, type SlotKey, type WerbemittelTyp } from "./config";
import type { RenderModel } from "./render-model";
import { findeFalscheFachdaten, type FaktenKontext } from "./fakten-guard";

export interface Pruefung {
  label: string;
  status: "ok" | "warnung" | "fehler";
  hinweis?: string;
}

/** Deterministische Prüfungen vor dem Export. „fehler“ blockiert, „warnung“ nicht. */
export function pruefe(input: {
  typ: WerbemittelTyp;
  roh: Record<SlotKey, string>;
  model: RenderModel;
  angebotStand: string;
  kontext: FaktenKontext;
}): Pruefung[] {
  const { typ, roh, model } = input;
  const v = model.sichtbar;
  const slots = TYPEN[typ].slots;
  // Nur sichtbare Texte landen im Motiv – nur sie werden auf Limit, Tokens und Fachdaten geprüft.
  const texte = (Object.keys(slots) as SlotKey[]).filter((k) => v[k]);
  const zuLang = texte.filter((k) => roh[k].length > slots[k]);
  const offeneTokens = texte.some((k) => model[k].includes("{{"));
  const falsch = texte.map((k) => findeFalscheFachdaten(roh[k], input.kontext)).find(Boolean);
  const filialfelder = typ === "flyer"
    ? v.filiale ? [model.filiale.adresse, model.filiale.oeffnungszeiten, model.filiale.telefon] : []
    : model.ortZeile ? [model.filiale.adresse] : [];

  return [
    { label: `Tarifdaten übernommen (${input.angebotStand})`, status: "ok" },
    !v.headline || roh.headline.trim()
      ? { label: v.headline ? "Headline vorhanden" : "Headline bewusst ausgeblendet", status: "ok" }
      : { label: "Headline fehlt", status: "fehler", hinweis: "Bitte im Schritt „Gestalten“ ergänzen." },
    zuLang.length
      ? { label: "Zeichenlimits überschritten", status: "fehler", hinweis: zuLang.join(", ") }
      : { label: "Texte innerhalb der Zeichenlimits", status: "ok" },
    offeneTokens
      ? { label: "Unbekannte Platzhalter im Text", status: "fehler", hinweis: "Bitte Text korrigieren." }
      : { label: "Alle Platzhalter mit aktuellen Werten ersetzt", status: "ok" },
    falsch
      ? { label: "Fachlich falsche Angabe im Text", status: "fehler", hinweis: falsch }
      : { label: "Keine abweichenden Konditionen oder Kontaktdaten", status: "ok" },
    ...(v.pflicht
      ? [istPlatzhalter(model.pflichtangaben)
          ? { label: "Pflichtangaben als Platzhalter markiert", status: "warnung", hinweis: "Vor Veröffentlichung durch freigegebenen Rechtstext ersetzen." } as const
          : { label: "Pflichtangaben vollständig", status: "ok" } as const]
      : []),
    filialfelder.some(istPlatzhalter)
      ? { label: "Filialdaten unvollständig (Platzhalter)", status: "warnung", hinweis: "Fehlende Angaben pflegt amberra in den Stammdaten." }
      : { label: "Filialdaten vollständig", status: "ok" },
    ...(v.logo ? [{ label: "Offizielles Signet mit Schutzzone (durch Vorlage)", status: "ok" } as const] : []),
    { label: "Kontraste barrierearm (durch Vorlage festgelegt)", status: "ok" },
    ...pruefeAusgeblendet(typ, model),
  ];
}

/**
 * Bewertet bewusst ausgeblendete Bausteine (Logo, Preis, Tarifzeile, Pflichtangaben …).
 * Ausgeblendete Texte werden oben schon übersprungen – hier geht es um die Frage,
 * ob das Fehlen eines Bausteins selbst ein Problem für die Veröffentlichung ist.
 */
export function pruefeAusgeblendet(typ: WerbemittelTyp, model: RenderModel): Pruefung[] {
  const v = model.sichtbar;
  const p: Pruefung[] = [];
  // Ein Preis steht im Motiv, wenn das Preis-Element sichtbar ist ODER ein sichtbarer Text einen Euro-Betrag nennt
  // (z. B. Headline „{{PREIS}} im Monat“). \s deckt auch das geschützte Leerzeichen vor „€“ ab.
  const betrag = /\d,\d{2}\s?€|€\s?\d/;
  const preisImMotiv = v.preis || (["headline", "subline", "cta"] as const).some((k) => v[k] && betrag.test(model[k]));

  if (!v.pflicht) {
    p.push(preisImMotiv
      ? { label: "Preis ohne Pflichtangaben", status: "fehler", hinweis: "Bei Preiswerbung müssen die Pflichtangaben sichtbar sein." }
      : { label: "Pflichtangaben ausgeblendet", status: "warnung", hinweis: "Nur zulässig, wenn das Motiv keine Konditionen nennt." });
  }
  // Ohne Tarifzeile bleibt beim Flyer der Tarif über die Fakten erkennbar – beim Social-Post nicht.
  if (!v.tarif && preisImMotiv && (typ === "social" || !v.fakten)) {
    p.push({ label: "Preis ohne Tarifbezeichnung", status: "warnung", hinweis: "Tarifzeile einblenden, damit klar ist, worauf sich der Preis bezieht." });
  }
  if (!v.logo) {
    p.push({ label: "Logo ausgeblendet", status: "warnung", hinweis: "Absender nur noch über Text erkennbar – Markenrichtlinie beachten." });
  }
  if (typ === "flyer" && !v.filiale) {
    p.push({ label: "Filialkontakt ausgeblendet", status: "warnung", hinweis: "Der Flyer nennt keinen Ansprechpartner vor Ort." });
  }
  if (!v.headline && !v.subline && !v.cta && !preisImMotiv) {
    p.push({ label: "Motiv ohne Botschaft", status: "warnung", hinweis: "Alle Texte und der Preis sind ausgeblendet." });
  }
  return p;
}

export const exportBereit = (p: Pruefung[]) => !p.some((x) => x.status === "fehler");
