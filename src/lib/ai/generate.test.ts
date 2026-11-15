import { afterEach, describe, expect, it } from "vitest";
import { generateCopy, KiAntwortUngueltig, type Protokolleintrag } from "./generate";
import { MockTextProvider } from "./mock-text";
import { antwortSchema } from "./schema";
import type { AiTextProvider, CopyRequest } from "./provider";
import { faktenKontext } from "@/lib/werbemittel/fakten-guard";

const kontext = faktenKontext({
  angebot: { preisMonat: 19.99, datenvolumenGb: 35, mitgliederBonusGb: 15, netz: "5G" },
  bank: { name: "Volksbank Kraichgau eG", kurzname: "Volksbank Kraichgau", website: "https://www.vbkraichgau.de", telefon: "06222 589-0" },
  filialen: [],
});

const req: CopyRequest = {
  typ: "social",
  typLabel: "Social-Media-Post",
  zielgruppe: { key: "studierende", label: "Studierende & Azubis", beschreibung: "" },
  argumente: ["{{PREIS}} im Monat"],
  anrede: "DU",
  slots: { headline: 40, subline: 90, cta: 45 },
  regionalPrompt: "Wochenmarkt in der Altstadt",
  variation: { seed: 0 },
};

function protokollierer() {
  const eintraege: Protokolleintrag[] = [];
  return { eintraege, protokoll: async (e: Protokolleintrag) => void eintraege.push(e) };
}

const fester = (antworten: string[]): AiTextProvider => ({
  name: "test",
  modell: "test",
  generate: async (_r, { versuch }) => antworten[versuch - 1],
});

afterEach(() => {
  delete process.env.MOCK_AI_FAIL;
});

describe("generateCopy", () => {
  it("liefert drei gültige Vorschläge vom Mock", async () => {
    const p = protokollierer();
    const res = await generateCopy(req, { provider: new MockTextProvider(), kontext, protokoll: p.protokoll });
    expect(res.vorschlaege).toHaveLength(3);
    expect(p.eintraege).toMatchObject([{ versuch: 1, gueltig: true }]);
    expect(res.vorschlaege[2].bildidee).toContain("Wochenmarkt");
  });

  it("wiederholt genau einmal nach ungültiger Antwort (MOCK_AI_FAIL=once)", async () => {
    process.env.MOCK_AI_FAIL = "once";
    const p = protokollierer();
    const res = await generateCopy(req, { provider: new MockTextProvider(), kontext, protokoll: p.protokoll });
    expect(res.vorschlaege).toHaveLength(3);
    expect(p.eintraege.map((e) => e.gueltig)).toEqual([false, true]);
  });

  it("wirft nach zwei ungültigen Antworten eine verständliche Meldung (MOCK_AI_FAIL=always)", async () => {
    process.env.MOCK_AI_FAIL = "always";
    const p = protokollierer();
    const fehler = await generateCopy(req, { provider: new MockTextProvider(), kontext, protokoll: p.protokoll }).catch((e) => e);
    expect(fehler).toBeInstanceOf(KiAntwortUngueltig);
    expect(fehler.nutzerMeldung).toMatch(/erneut/);
    expect(p.eintraege).toHaveLength(2);
  });

  it("behandelt Nicht-JSON und unbekannte Platzhalter als ungültig", async () => {
    const gueltig = JSON.parse(await new MockTextProvider().generate(req, { versuch: 1 }));
    const kaputt = structuredClone(gueltig);
    kaputt.vorschlaege[0].headline = "Nur {{RABATT}} heute";
    const p = protokollierer();
    const fehler = await generateCopy(req, { provider: fester(["kein json", JSON.stringify(kaputt)]), kontext, protokoll: p.protokoll }).catch((e) => e);
    expect(fehler).toBeInstanceOf(KiAntwortUngueltig);
    expect(p.eintraege[0].fehler).toMatch(/kein gültiges JSON/);
    expect(p.eintraege[1].fehler).toMatch(/Unbekannte Platzhalter: RABATT/);
  });

  it("lehnt zu lange Headlines ab", () => {
    const schema = antwortSchema(req.slots, kontext);
    const v = { ansatz: "A", headline: "x".repeat(41), subline: "Text ok", cta: "Los geht's", bildidee: "Menschen im Alltag" };
    expect(schema.safeParse({ vorschlaege: [v, v, v] }).success).toBe(false);
  });
});
