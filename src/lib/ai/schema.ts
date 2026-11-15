import { z } from "zod";
import type { SlotKey } from "@/lib/werbemittel/config";
import { unbekannteTokens } from "@/lib/werbemittel/tokens";
import { findeFalscheFachdaten, type FaktenKontext } from "@/lib/werbemittel/fakten-guard";

function werbetext(max: number, kontext: FaktenKontext) {
  return z
    .string()
    .trim()
    .min(3)
    .max(max)
    .superRefine((text, ctx) => {
      const fremd = unbekannteTokens(text);
      if (fremd.length) ctx.addIssue({ code: "custom", message: `Unbekannte Platzhalter: ${fremd.join(", ")}` });
      const fund = findeFalscheFachdaten(text, kontext);
      if (fund) ctx.addIssue({ code: "custom", message: `${fund} – bitte Platzhalter wie {{PREIS}} verwenden.` });
    });
}

/** Schema ohne Refinements – wird als JSON-Schema an das Modell übergeben. */
export function antwortSchemaBasis(slots: Record<SlotKey, number>) {
  return z.object({
    vorschlaege: z
      .array(
        z.object({
          ansatz: z.string().max(40),
          headline: z.string().max(slots.headline),
          subline: z.string().max(slots.subline),
          cta: z.string().max(slots.cta),
          bildidee: z.string().max(160),
        }),
      )
      .length(3),
  });
}

/** Validierungsschema für jede KI-Antwort (inkl. Token- und Fakten-Prüfung gegen die Stammdaten). */
export function antwortSchema(slots: Record<SlotKey, number>, kontext: FaktenKontext) {
  return z.object({
    vorschlaege: z
      .array(
        z.object({
          ansatz: z.string().trim().min(2).max(40),
          headline: werbetext(slots.headline, kontext),
          subline: werbetext(slots.subline, kontext),
          cta: werbetext(slots.cta, kontext),
          bildidee: werbetext(160, kontext),
        }),
      )
      .length(3),
  });
}

export type KiVorschlaege = z.infer<ReturnType<typeof antwortSchema>>;
export type KiVorschlag = KiVorschlaege["vorschlaege"][number];
