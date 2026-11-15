import { z } from "zod";
import { antwortSchema, type KiVorschlaege } from "./schema";
import { MockTextProvider } from "./mock-text";
import { OpenAiCompatibleTextProvider } from "./openai-compatible-text";
import type { AiTextProvider, CopyRequest } from "./provider";
import type { FaktenKontext } from "@/lib/werbemittel/fakten-guard";

export const MAX_VERSUCHE = 2; // erster Versuch + genau eine Wiederholung

export class KiAntwortUngueltig extends Error {
  readonly nutzerMeldung =
    "Die Vorschläge konnten gerade nicht erstellt werden. Bitte versuchen Sie es erneut – Ihre Angaben bleiben erhalten.";
}

export interface Protokolleintrag {
  provider: string;
  modell: string;
  versuch: number;
  rohantwort: string;
  gueltig: boolean;
  fehler?: string;
}

export function textProvider(): AiTextProvider {
  return process.env.AI_PROVIDER === "openai-compatible" ? new OpenAiCompatibleTextProvider() : new MockTextProvider();
}

/** Ruft den Provider auf und validiert jede Antwort mit Zod. Bei ungültiger Antwort: genau ein Retry mit Fehler-Feedback. */
export async function generateCopy(
  req: CopyRequest,
  { provider = textProvider(), kontext, protokoll }: { provider?: AiTextProvider; kontext: FaktenKontext; protokoll: (e: Protokolleintrag) => Promise<void> },
): Promise<KiVorschlaege> {
  const schema = antwortSchema(req.slots, kontext);
  let feedback: string | undefined;

  for (let versuch = 1; versuch <= MAX_VERSUCHE; versuch++) {
    let roh = "";
    try {
      roh = await provider.generate(req, { versuch, feedback });
      const ergebnis = schema.safeParse(JSON.parse(roh));
      if (ergebnis.success) {
        await protokoll({ provider: provider.name, modell: provider.modell, versuch, rohantwort: roh, gueltig: true });
        return ergebnis.data;
      }
      feedback = z.prettifyError(ergebnis.error);
    } catch (e) {
      feedback = e instanceof SyntaxError ? "Antwort war kein gültiges JSON." : `Anbieterfehler: ${(e as Error).message}`;
    }
    await protokoll({ provider: provider.name, modell: provider.modell, versuch, rohantwort: roh, gueltig: false, fehler: feedback });
  }
  throw new KiAntwortUngueltig(feedback);
}
