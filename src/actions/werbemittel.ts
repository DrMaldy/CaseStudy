"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, requireWerbemittel } from "@/lib/session";
import { ARGUMENTE, ELEMENT_KEYS, HINTERGRUENDE, MAX_ARGUMENTE, TYPEN, ZIELGRUPPEN, zielgruppe as findeZielgruppe, type WerbemittelTyp } from "@/lib/werbemittel/config";
import { generateCopy, KiAntwortUngueltig } from "@/lib/ai/generate";
import { imageProvider } from "@/lib/ai/image-provider";
import type { KiVorschlaege } from "@/lib/ai/schema";
import { faktenKontext } from "@/lib/werbemittel/fakten-guard";

const pfad = (id: string, schritt: string) => `/marketing/werbemittel/${id}/${schritt}`;
const typSchema = z.enum(["social", "flyer"]);

export async function erstelleWerbemittel(formData: FormData) {
  const user = await requireUser();
  const typ = typSchema.catch("social").parse(formData.get("typ"));
  const def = TYPEN[typ];
  const wm = await db.werbemittel.create({
    data: {
      userId: user.id,
      filialeId: user.filialeId,
      bezugFilialeId: user.filialeId,
      name: `Neuer ${def.label}`,
      typ,
      format: def.formate[0].key,
      vorlage: def.vorlagen[0],
      anrede: def.standardAnrede,
      storyVariante: Boolean(def.zusatzformat),
    },
  });
  redirect(pfad(wm.id, "format"));
}

export async function speichereFormat(input: { id: string; typ: WerbemittelTyp; format: string; storyVariante: boolean }) {
  const { wm } = await requireWerbemittel(input.id);
  const typ = typSchema.parse(input.typ);
  const def = TYPEN[typ];
  const format = def.formate.some((f) => f.key === input.format) ? input.format : def.formate[0].key;
  const typGeaendert = typ !== wm.typ;
  await db.werbemittel.update({
    where: { id: wm.id },
    data: {
      typ,
      format,
      storyVariante: Boolean(def.zusatzformat) && input.storyVariante && format !== def.zusatzformat,
      ...(typGeaendert && { vorlage: def.vorlagen[0], anrede: def.standardAnrede, name: `Neuer ${def.label}`, vorschlaege: null, gewaehlterVorschlag: null }),
      schritt: Math.max(wm.schritt, 2),
    },
  });
  return { ok: true };
}

const zielgruppeSchema = z.object({
  id: z.string(),
  zielgruppe: z.enum(ZIELGRUPPEN.map((z) => z.key) as [string, ...string[]]),
  argumente: z.array(z.enum(ARGUMENTE.map((a) => a.key) as [string, ...string[]])).max(MAX_ARGUMENTE),
  anrede: z.enum(["DU", "SIE"]),
});

export async function speichereZielgruppe(input: z.infer<typeof zielgruppeSchema>) {
  const data = zielgruppeSchema.parse(input);
  const { wm } = await requireWerbemittel(data.id);
  const geaendert = wm.zielgruppe !== data.zielgruppe || wm.argumente !== JSON.stringify(data.argumente) || wm.anrede !== data.anrede;
  await db.werbemittel.update({
    where: { id: wm.id },
    data: {
      zielgruppe: data.zielgruppe,
      argumente: JSON.stringify(data.argumente),
      anrede: data.anrede,
      // Geänderte Grundlage → alte Vorschläge verwerfen, damit neu generiert wird.
      ...(geaendert && { vorschlaege: null, gewaehlterVorschlag: null }),
      schritt: Math.max(wm.schritt, 3),
    },
  });
  return { ok: true };
}

export type GenerierungsErgebnis = { ok: true; vorschlaege: KiVorschlaege["vorschlaege"]; gewaehlt: number } | { ok: false; fehler: string };

export async function generiereVorschlaege(input: { id: string; seed: number; aehnlichZu?: number }): Promise<GenerierungsErgebnis> {
  const { wm, user } = await requireWerbemittel(input.id);
  const zg = findeZielgruppe(wm.zielgruppe);
  if (!zg) return { ok: false, fehler: "Bitte zuerst eine Zielgruppe wählen." };
  const bank = user.filiale.bank;
  const kontext = faktenKontext({ angebot: await db.angebot.findFirstOrThrow(), bank, filialen: bank.filialen });

  const typ = wm.typ as WerbemittelTyp;
  const argumente: string[] = JSON.parse(wm.argumente);
  const bisher: KiVorschlaege["vorschlaege"] | null = wm.vorschlaege ? JSON.parse(wm.vorschlaege) : null;
  const vorlage = input.aehnlichZu !== undefined ? bisher?.[input.aehnlichZu] : undefined;

  try {
    const ergebnis = await generateCopy(
      {
        typ,
        typLabel: TYPEN[typ].label,
        zielgruppe: { key: zg.key, label: zg.label, beschreibung: zg.beschreibung },
        argumente: ARGUMENTE.filter((a) => argumente.includes(a.key)).map((a) => a.label),
        anrede: wm.anrede === "SIE" ? "SIE" : "DU",
        slots: TYPEN[typ].slots,
        regionalPrompt: wm.bezugFiliale.regionalPrompt,
        variation: { seed: input.seed, aehnlichZu: vorlage && { headline: vorlage.headline, subline: vorlage.subline } },
      },
      {
        kontext,
        protokoll: async (e) => {
          await db.kiGenerierung.create({
            data: { werbemittelId: wm.id, provider: e.provider, modell: e.modell, versuch: e.versuch, rohantwort: e.rohantwort, gueltig: e.gueltig, fehler: e.fehler, anfrage: JSON.stringify({ seed: input.seed, aehnlichZu: input.aehnlichZu ?? null }) },
          });
        },
      },
    );
    // „Ähnliche Variante“ ersetzt nur die eine Karte, „Neu generieren“ alle drei.
    const neu =
      bisher && input.aehnlichZu !== undefined
        ? bisher.map((v, i) => (i === input.aehnlichZu ? { ...ergebnis.vorschlaege[0], ansatz: v.ansatz } : v))
        : ergebnis.vorschlaege;
    const gewaehlt = input.aehnlichZu ?? 0;
    await db.werbemittel.update({
      where: { id: wm.id },
      data: { vorschlaege: JSON.stringify(neu), gewaehlterVorschlag: gewaehlt },
    });
    return { ok: true, vorschlaege: neu, gewaehlt };
  } catch (e) {
    if (e instanceof KiAntwortUngueltig) return { ok: false, fehler: e.nutzerMeldung };
    console.error(e);
    return { ok: false, fehler: "Der KI-Dienst ist gerade nicht erreichbar. Bitte versuchen Sie es später erneut." };
  }
}

export async function uebernehmeVorschlag(input: { id: string; index: number }) {
  const { wm } = await requireWerbemittel(input.id);
  const vorschlaege: KiVorschlaege["vorschlaege"] = wm.vorschlaege ? JSON.parse(wm.vorschlaege) : [];
  const v = vorschlaege[input.index];
  if (!v) return { ok: false };
  const zg = findeZielgruppe(wm.zielgruppe);
  await db.werbemittel.update({
    where: { id: wm.id },
    data: {
      gewaehlterVorschlag: input.index,
      headline: v.headline,
      subline: v.subline,
      cta: v.cta,
      bildidee: v.bildidee,
      bildAssetId: wm.bildAssetId ?? zg?.standardBild ?? null,
      name: wm.name.startsWith("Neuer ") && zg ? `${TYPEN[wm.typ as WerbemittelTyp].label} ${zg.label}` : wm.name,
      schritt: Math.max(wm.schritt, 4),
    },
  });
  return { ok: true };
}

const gestaltungSchema = z.object({
  id: z.string(),
  headline: z.string(),
  subline: z.string(),
  cta: z.string(),
  bezugFilialeId: z.string(),
  ortImMotiv: z.boolean(),
  bildAssetId: z.string().nullable(),
  vorlage: z.string(),
  format: z.string(),
  ausgeblendet: z.array(z.enum(ELEMENT_KEYS)),
  hintergrund: z.enum(HINTERGRUENDE.map((h) => h.key)),
});

/** Autosave aus Schritt 4. Limits werden hart geprüft; fremde Filialen/Bilder werden abgelehnt. */
export async function speichereGestaltung(input: z.infer<typeof gestaltungSchema>) {
  const data = gestaltungSchema.parse(input);
  const { wm, user } = await requireWerbemittel(data.id);
  const def = TYPEN[wm.typ as WerbemittelTyp];
  // Ausgeblendete Textfelder erscheinen nicht im Motiv – ihr Zeichenlimit blockiert daher nicht.
  const ausgeblendet = data.ausgeblendet.filter((k) => def.elemente.includes(k));
  const zuLang = (["headline", "subline", "cta"] as const).find((k) => !ausgeblendet.includes(k) && data[k].length > def.slots[k]);
  if (zuLang) return { ok: false, fehler: `Text zu lang (${zuLang}).` };
  if (!user.filiale.bank.filialen.some((f) => f.id === data.bezugFilialeId)) return { ok: false, fehler: "Filiale nicht verfügbar." };
  if (data.bildAssetId) {
    const bild = await db.bildAsset.findFirst({ where: { id: data.bildAssetId, OR: [{ bankId: null }, { bankId: user.filiale.bankId }] } });
    if (!bild) return { ok: false, fehler: "Bild nicht verfügbar." };
  }
  const updated = await db.werbemittel.update({
    where: { id: wm.id },
    data: {
      headline: data.headline,
      subline: data.subline,
      cta: data.cta,
      bezugFilialeId: data.bezugFilialeId,
      ortImMotiv: data.ortImMotiv,
      bildAssetId: data.bildAssetId,
      ausgeblendet: JSON.stringify(ausgeblendet),
      hintergrund: data.hintergrund,
      vorlage: def.vorlagen.includes(data.vorlage) ? data.vorlage : wm.vorlage,
      format: def.formate.some((f) => f.key === data.format) ? data.format : wm.format,
      schritt: Math.max(wm.schritt, 5),
    },
  });
  return { ok: true, gespeichertAm: updated.updatedAt.toISOString() };
}

export async function generiereKiMotiv(input: { id: string }) {
  const { wm, user } = await requireWerbemittel(input.id);
  const provider = imageProvider();
  if (!provider) return { ok: false as const, fehler: "KI-Bildmotive sind deaktiviert." };
  try {
    const motiv = await provider.generate({ bildidee: wm.bildidee || "Menschen in der Region", zielgruppe: findeZielgruppe(wm.zielgruppe)?.label ?? "" });
    const bild = await db.bildAsset.create({
      data: {
        id: `ki-${crypto.randomUUID()}`,
        bankId: user.filiale.bankId,
        datei: motiv.datei,
        beschreibung: `KI-Motiv: ${wm.bildidee}`.slice(0, 160),
        zielgruppen: JSON.stringify(wm.zielgruppe ? [wm.zielgruppe] : []),
        herkunft: provider.name === "mock" ? "KI_MOCK" : "KI",
        platzhalter: motiv.platzhalter,
      },
    });
    await db.werbemittel.update({ where: { id: wm.id }, data: { bildAssetId: bild.id } });
    return { ok: true as const, bild: { id: bild.id, datei: bild.datei, beschreibung: bild.beschreibung, herkunft: bild.herkunft } };
  } catch (e) {
    console.error(e);
    return { ok: false as const, fehler: "Das Motiv konnte nicht erzeugt werden. Bitte wählen Sie ein Foto aus dem Bildmaterial." };
  }
}

export async function speichereName(input: { id: string; name: string }) {
  const name = z.string().trim().min(1).max(80).parse(input.name);
  const { wm } = await requireWerbemittel(input.id);
  await db.werbemittel.update({ where: { id: wm.id }, data: { name } });
  revalidatePath("/marketing/werbemittel");
  return { ok: true };
}

/** Löscht ein Werbemittel endgültig (inkl. KI-Protokoll und Export-Historie per Cascade). */
export async function loescheWerbemittel(input: { id: string }) {
  const { wm } = await requireWerbemittel(input.id);
  await db.werbemittel.delete({ where: { id: wm.id } });
  revalidatePath("/marketing/werbemittel");
  return { ok: true };
}
