import { describe, expect, it } from "vitest";
import { fakten, resolveTokens, unbekannteTokens } from "./tokens";
import { buildRenderModel } from "./render-model";
import { exportBereit, pruefe } from "./checks";
import { beitragstext } from "./caption";
import { faktenKontext } from "./fakten-guard";

const angebot = {
  name: "VR Mobilfunk M", preisMonat: 19.99, datenvolumenGb: 35, netz: "5G", roaming: "EU-Roaming",
  mitgliederBonusGb: 15, laufzeit: "monatlich kündbar", pflichtangaben: "[PLATZHALTER Pflichtangaben]",
};
const bank = { kurzname: "VR-Bank Osnabrücker Nordland", logoPfad: "/brand/vr-signet.svg" };
const filiale = { name: "Filiale Quakenbrück", strasse: "Lange Straße 12", plz: "49610", ort: "Quakenbrück", oeffnungszeiten: "[PLATZHALTER Öffnungszeiten]", telefon: "[PLATZHALTER Telefon]" };
const f = fakten({ angebot, bank, filiale });
const kontext = faktenKontext({ angebot, bank: { ...bank, name: "VR-Bank eG Osnabrücker Nordland", website: "", telefon: "" }, filialen: [] });
// Intl setzt ein geschütztes Leerzeichen vor „€“ – für den Vergleich normalisieren.
const n = (s: string) => s.replace(/ /g, " ");

describe("Tokens", () => {
  it("setzt Fakten aus den Stammdaten ein", () => {
    expect(n(resolveTokens("{{DATENVOLUMEN}} für {{PREIS}} in {{ORT}}", f))).toBe("35 GB für 19,99 € in Quakenbrück");
  });
  it("lässt unbekannte Tokens stehen und meldet sie", () => {
    expect(resolveTokens("{{RABATT}}", f)).toBe("{{RABATT}}");
    expect(unbekannteTokens("{{PREIS}} {{RABATT}}")).toEqual(["RABATT"]);
  });
});

describe("Render-Model & Prüfungen", () => {
  const wm = { typ: "social", format: "story-9x16", vorlage: "social-klassisch", headline: "{{DATENVOLUMEN}} für dein Semester.", subline: "", cta: "Komm vorbei in {{ORT}}", ortImMotiv: true, bildAsset: null };

  it("nutzt Formatmaße aus der Konfiguration", () => {
    const m = buildRenderModel({ wm, bank, filiale, angebot });
    expect([m.breite, m.hoehe]).toEqual([1080, 1920]);
    expect(m.headline).toBe("35 GB für dein Semester.");
    expect(n(m.preis)).toBe("19,99 €/Monat");
  });

  it("rechnet DIN A5 in CSS-Pixel um", () => {
    const m = buildRenderModel({ wm: { ...wm, typ: "flyer", format: "a5-hoch", vorlage: "flyer-standard" }, bank, filiale, angebot });
    expect([m.breite, m.hoehe]).toEqual([559, 794]);
  });

  it("warnt bei Platzhaltern, blockiert aber nur bei Fehlern", () => {
    const model = buildRenderModel({ wm, bank, filiale, angebot });
    const p = pruefe({ typ: "social", roh: wm, model, angebotStand: "Test", kontext });
    expect(p.find((x) => x.label.startsWith("Pflichtangaben"))?.status).toBe("warnung");
    expect(exportBereit(p)).toBe(true);
    const zuLang = pruefe({ typ: "social", roh: { ...wm, headline: "x".repeat(41) }, model, angebotStand: "Test", kontext });
    expect(exportBereit(zuLang)).toBe(false);
    const falscherPreis = pruefe({ typ: "social", roh: { ...wm, subline: "Nur 9,99 € im Monat" }, model, angebotStand: "Test", kontext });
    expect(exportBereit(falscherPreis)).toBe(false);
  });

  describe("ausgeblendete Elemente", () => {
    const pruefeMit = (ausgeblendet: string[], roh = wm) =>
      pruefe({ typ: "social", roh, model: buildRenderModel({ wm: { ...roh, ausgeblendet }, bank, filiale, angebot }), angebotStand: "Test", kontext });
    const status = (p: ReturnType<typeof pruefe>, label: string) => p.find((x) => x.label === label)?.status;

    it("blockiert Preiswerbung ohne Pflichtangaben", () => {
      const p = pruefeMit(["pflicht"]);
      expect(status(p, "Preis ohne Pflichtangaben")).toBe("fehler");
      expect(exportBereit(p)).toBe(false);
    });

    it("erkennt den Preis auch in der Headline, wenn das Preis-Element aus ist", () => {
      const p = pruefeMit(["pflicht", "preis"], { ...wm, headline: "{{PREIS}} im Monat" });
      expect(status(p, "Preis ohne Pflichtangaben")).toBe("fehler");
    });

    it("warnt nur, wenn ohne Preis auch die Pflichtangaben fehlen", () => {
      const p = pruefeMit(["pflicht", "preis"]);
      expect(status(p, "Pflichtangaben ausgeblendet")).toBe("warnung");
      expect(exportBereit(p)).toBe(true);
    });

    it("lässt eine ausgeblendete, leere Headline zu und warnt beim Logo", () => {
      const p = pruefeMit(["headline", "logo"], { ...wm, headline: "" });
      expect(p.some((x) => x.label === "Headline fehlt")).toBe(false);
      expect(status(p, "Logo ausgeblendet")).toBe("warnung");
      expect(p.some((x) => x.label.startsWith("Offizielles Signet"))).toBe(false);
    });
  });

  it("baut den Beitragstext deterministisch mit Hashtags", () => {
    const text = beitragstext({ subline: "{{NETZ}} für alle.", fakten: f });
    expect(text).toContain("5G für alle.");
    expect(text).toContain("#VRBankOsnabrückerNordland #Quakenbrück #VRMobilfunk");
  });
});
