import type { Fakten } from "./tokens";
import { resolveTokens } from "./tokens";

/** Beitragstext für Social Media – deterministisch aus Subline, festem Faktensatz und Hashtags (kein zusätzlicher KI-Text). */
export function beitragstext(input: { subline: string; fakten: Fakten }) {
  const { fakten: f } = input;
  const fakt = resolveTokens(
    "{{TARIF}}: {{DATENVOLUMEN}}, {{NETZ}} und EU-Roaming für {{PREIS}} im Monat – monatlich kündbar. Jetzt online oder in unserer Filiale in {{ORT}} abschließen.",
    f,
  );
  const tag = (s: string) => "#" + s.replace(/[^\p{L}\p{N}]/gu, "");
  return [resolveTokens(input.subline, f), fakt, [tag(f.BANK), tag(f.ORT), "#VRMobilfunk"].join(" ")].filter(Boolean).join("\n");
}
