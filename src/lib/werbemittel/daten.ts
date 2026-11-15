import "server-only";
import { db } from "@/lib/db";
import { requireWerbemittel } from "@/lib/session";
import type { KiVorschlag } from "@/lib/ai/schema";
import { hintergrund } from "./config";
import { parseAusgeblendet } from "./render-model";

/** Alles, was der Wizard (Client) braucht – serialisierbar und auf die eigene Bank beschränkt. */
export async function ladeWizardDaten(id: string) {
  const { user, wm } = await requireWerbemittel(id);
  const [angebot, bilder] = await Promise.all([
    db.angebot.findFirstOrThrow(),
    db.bildAsset.findMany({ where: { OR: [{ bankId: null }, { bankId: user.filiale.bankId }] }, orderBy: { createdAt: "asc" } }),
  ]);
  const bank = user.filiale.bank;

  return {
    wm: {
      id: wm.id,
      name: wm.name,
      typ: wm.typ as "social" | "flyer",
      format: wm.format,
      storyVariante: wm.storyVariante,
      vorlage: wm.vorlage,
      zielgruppe: wm.zielgruppe,
      argumente: JSON.parse(wm.argumente) as string[],
      anrede: (wm.anrede === "SIE" ? "SIE" : "DU") as "DU" | "SIE",
      schritt: wm.schritt,
      status: wm.status,
      vorschlaege: (wm.vorschlaege ? JSON.parse(wm.vorschlaege) : null) as KiVorschlag[] | null,
      gewaehlterVorschlag: wm.gewaehlterVorschlag,
      headline: wm.headline,
      subline: wm.subline,
      cta: wm.cta,
      bildidee: wm.bildidee,
      bildAssetId: wm.bildAssetId,
      bezugFilialeId: wm.bezugFilialeId,
      ortImMotiv: wm.ortImMotiv,
      ausgeblendet: parseAusgeblendet(wm.ausgeblendet),
      hintergrund: hintergrund(wm.hintergrund).key,
      updatedAt: wm.updatedAt.toISOString(),
    },
    eigeneFilialeId: user.filialeId,
    istSuperuser: user.istSuperuser,
    bank: { id: bank.id, name: bank.name, kurzname: bank.kurzname, logoPfad: bank.logoPfad, website: bank.website, telefon: bank.telefon },
    filialen: bank.filialen.map((f) => ({
      id: f.id, name: f.name, strasse: f.strasse, plz: f.plz, ort: f.ort,
      oeffnungszeiten: f.oeffnungszeiten, telefon: f.telefon, regionalPrompt: f.regionalPrompt,
    })),
    angebot: {
      name: angebot.name, preisMonat: angebot.preisMonat, datenvolumenGb: angebot.datenvolumenGb, netz: angebot.netz,
      roaming: angebot.roaming, mitgliederBonusGb: angebot.mitgliederBonusGb, laufzeit: angebot.laufzeit,
      pflichtangaben: angebot.pflichtangaben, stand: angebot.stand,
    },
    bilder: bilder.map((b) => ({ id: b.id, datei: b.datei, beschreibung: b.beschreibung, herkunft: b.herkunft, zielgruppen: JSON.parse(b.zielgruppen) as string[] })),
  };
}

export type WizardDaten = Awaited<ReturnType<typeof ladeWizardDaten>>;
