import { describe, expect, it } from "vitest";
import { faktenKontext, findeFalscheFachdaten } from "./fakten-guard";

const k = faktenKontext({
  angebot: { preisMonat: 19.99, datenvolumenGb: 35, mitgliederBonusGb: 15, netz: "5G" },
  bank: { name: "Volksbank Kraichgau eG", kurzname: "Volksbank Kraichgau", website: "https://www.vbkraichgau.de", telefon: "06222 589-0" },
  filialen: [{ telefon: "06222 589-0" }, { telefon: "[PLATZHALTER Telefon]" }],
});
const pruefe = (t: string) => findeFalscheFachdaten(t, k);

describe("Fakten-Guard: korrekte Angaben bleiben erlaubt", () => {
  it.each([
    "{{DATENVOLUMEN}} für {{PREIS}} im Monat",
    "35 GB für 19,99 € im Monat",
    "Mitglieder surfen mit +15 GB – insgesamt 50 GB",
    "Schnell im 5G-Netz, monatlich kündbar",
    "Deine Volksbank Kraichgau – ganz in deiner Nähe",
    "Die Volksbank Ihres Vertrauens",
    "Ruf uns an: 06222 589-0",
    "Mehr auf www.vbkraichgau.de",
  ])("„%s“", (t) => expect(pruefe(t)).toBeNull());
});

describe("Fakten-Guard: fachlich falsche Angaben werden blockiert", () => {
  it.each([
    ["Nur 14,99 € im Monat", /Preis/],
    ["Jetzt mit 40 GB", /Datenvolumen/],
    ["Surfen mit 4G", /Netz/],
    ["20 % Rabatt für alle", /Prozent/],
    ["Mindestlaufzeit 24 Monate", /Laufzeit/],
    ["Ruf an: 0800 1234567", /Telefonnummer/],
    ["Infos auf www.beispiel.de", /Webadresse/],
    ["Schreib an info@beispiel.de", /Webadresse|E-Mail/],
    ["Wie bei der Volksbank Mittelhessen", /Fremde Bank/],
    ["Besser als die Sparkasse", /Fremde Bank/],
  ])("„%s“", (t, grund) => expect(pruefe(t)).toMatch(grund));
});
