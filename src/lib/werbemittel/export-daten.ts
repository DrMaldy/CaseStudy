import "server-only";
import { db } from "@/lib/db";
import { TYPEN, type WerbemittelTyp } from "./config";
import { buildRenderModel, parseAusgeblendet } from "./render-model";
import { pruefe } from "./checks";
import { faktenKontext } from "./fakten-guard";

/** Lädt ein Werbemittel samt Stammdaten für Prüfung und Export – filialeId = null nur für Superuser (alle Banken). */
export async function ladeExportDaten(id: string, filialeId: string | null, formatKey: string | undefined, asset?: (p: string) => Promise<string>) {
  const wm = await db.werbemittel.findFirst({
    where: filialeId ? { id, filialeId } : { id },
    include: { bildAsset: true, bezugFiliale: { include: { bank: { include: { filialen: true } } } } },
  });
  if (!wm) return null;
  const angebot = await db.angebot.findFirstOrThrow();
  const typ = wm.typ as WerbemittelTyp;
  const bank = wm.bezugFiliale.bank;

  const pfade = asset ? { logo: await asset(bank.logoPfad), bild: wm.bildAsset ? await asset(wm.bildAsset.datei) : null } : null;
  const model = buildRenderModel({
    wm: { ...wm, ausgeblendet: parseAusgeblendet(wm.ausgeblendet), bildAsset: wm.bildAsset && { datei: pfade?.bild ?? wm.bildAsset.datei } },
    formatKey,
    bank: { ...bank, logoPfad: pfade?.logo ?? bank.logoPfad },
    filiale: wm.bezugFiliale,
    angebot,
  });
  const pruefungen = pruefe({ typ, roh: { headline: wm.headline, subline: wm.subline, cta: wm.cta }, model, angebotStand: angebot.stand, kontext: faktenKontext({ angebot, bank, filialen: bank.filialen }) });
  return { wm, typ, def: TYPEN[typ], model, pruefungen };
}
