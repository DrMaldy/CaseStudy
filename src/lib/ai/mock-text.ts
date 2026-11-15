import type { ZielgruppeKey } from "@/lib/werbemittel/config";
import type { AiTextProvider, CopyRequest } from "./provider";

type T = string | [du: string, sie: string];
type Satz = { headline: T; subline: T; cta: T; bildidee: string };

const ANSAETZE = ["Preis im Fokus", "Flexibilität", "Region & Nähe"];

// Deterministische Beispieltexte je Zielgruppe – ausschließlich mit Platzhaltern für Fakten.
const TEXTE: Record<ZielgruppeKey, Satz[]> = {
  studierende: [
    { headline: ["{{DATENVOLUMEN}} für dein Semester.", "{{DATENVOLUMEN}} für Ihr Semester."], subline: "{{NETZ}}, EU-Roaming und monatlich kündbar – für {{PREIS}} im Monat.", cta: "Jetzt in der Filiale {{ORT}} abschließen", bildidee: "Studierende auf dem Campus, Smartphone in der Hand" },
    { headline: ["Dein Studium. Dein Netz. {{PREIS}}.", "Ihr Studium. Ihr Netz. {{PREIS}}."], subline: "Monatlich kündbar, {{DATENVOLUMEN}} im {{NETZ}}-Netz und EU-Roaming fürs Auslandssemester.", cta: "Online abschließen – in wenigen Minuten", bildidee: "Bahnfahrt zur Uni mit Kopfhörern und Laptop" },
    { headline: ["Aus {{ORT}}. Für dein Semester.", "Aus {{ORT}}. Für Ihr Semester."], subline: ["Von der Bank, die dich kennt: {{DATENVOLUMEN}} und {{NETZ}} für {{PREIS}}.", "Von der Bank, die Sie kennt: {{DATENVOLUMEN}} und {{NETZ}} für {{PREIS}}."], cta: ["Komm vorbei in {{ORT}}", "Besuchen Sie uns in {{ORT}}"], bildidee: "Freundesgruppe in der Innenstadt" },
  ],
  familien: [
    { headline: "Mobil für die ganze Familie.", subline: "{{DATENVOLUMEN}} im {{NETZ}}-Netz für {{PREIS}} im Monat – monatlich kündbar.", cta: ["Lass dich in der Filiale beraten", "Lassen Sie sich in der Filiale beraten"], bildidee: "Familie am Küchentisch, alle mit dem Smartphone" },
    { headline: "Planbar telefonieren – jeden Monat.", subline: "Feste Kosten, keine Überraschungen: {{TARIF}} ist monatlich kündbar.", cta: "Jetzt online abschließen", bildidee: "Eltern planen gemeinsam das Familienbudget" },
    { headline: "Familien in {{ORT}} sind gut verbunden.", subline: ["Dein Tarif von der Bank vor Ort – mit Beratung in {{ORT}}.", "Ihr Tarif von der Bank vor Ort – mit Beratung in {{ORT}}."], cta: ["Komm vorbei in {{ORT}}", "Besuchen Sie uns in {{ORT}}"], bildidee: "Familienausflug in der Region" },
  ],
  pendler: [
    { headline: "Schnell unterwegs mit {{NETZ}}.", subline: "{{DATENVOLUMEN}} im {{NETZ}}-Netz und EU-Roaming für {{PREIS}} im Monat.", cta: "Jetzt online abschließen", bildidee: "Pendlerin am Bahnsteig mit Smartphone" },
    { headline: ["Dein Netz für jeden Arbeitsweg.", "Ihr Netz für jeden Arbeitsweg."], subline: "Im Zug, im Homeoffice, auf Dienstreise: {{TARIF}} ist monatlich kündbar.", cta: "Tarif in der Filiale sichern", bildidee: "Videocall im Zug auf dem Weg zur Arbeit" },
    { headline: "Von {{ORT}} aus gut vernetzt.", subline: ["Mobilfunk von deiner Bank vor Ort – EU-Roaming inklusive.", "Mobilfunk von Ihrer Bank vor Ort – EU-Roaming inklusive."], cta: ["Komm vorbei in {{ORT}}", "Besuchen Sie uns in {{ORT}}"], bildidee: "Morgendlicher Arbeitsweg durch die Region" },
  ],
  mitglieder: [
    { headline: "+{{MITGLIEDERBONUS}} für Mitglieder.", subline: ["Als Mitglied surfst du mit {{MITGLIEDERBONUS}} extra – für {{PREIS}} im Monat.", "Als Mitglied surfen Sie mit {{MITGLIEDERBONUS}} extra – für {{PREIS}} im Monat."], cta: "Mitgliedervorteil sichern", bildidee: "Mitglieder bei einer Veranstaltung der Bank" },
    { headline: "Mitglied sein lohnt sich – auch mobil.", subline: "Gemeinschaft zahlt sich aus: mehr Datenvolumen, monatlich kündbar.", cta: "Jetzt online abschließen", bildidee: "Gemeinsames Lachen unter Nachbarn" },
    { headline: "Für unsere Mitglieder in {{ORT}}.", subline: ["Dein Mitgliedervorteil – persönlich erklärt in deiner Filiale.", "Ihr Mitgliedervorteil – persönlich erklärt in Ihrer Filiale."], cta: "In der Filiale {{ORT}} beraten lassen", bildidee: "Beratungsgespräch in der Filiale" },
  ],
  jugendliche: [
    { headline: ["Dein erstes Handy? Wir haben den Tarif.", "Das erste Handy? Wir haben den Tarif."], subline: "{{TARIF}}: {{DATENVOLUMEN}}, {{NETZ}} und monatlich kündbar für {{PREIS}}.", cta: "Jetzt Tarif sichern", bildidee: "Jugendliche mit dem ersten eigenen Smartphone" },
    { headline: "Volle Kostenkontrolle ab dem ersten Tag.", subline: "Fester Preis von {{PREIS}} im Monat – ohne lange Vertragsbindung.", cta: "Gemeinsam online abschließen", bildidee: "Eltern und Kind richten das Handy ein" },
    { headline: "Das kriegen wir hin – in {{ORT}}.", subline: "Eltern und Kinder beraten wir gemeinsam in der Filiale.", cta: ["Komm mit deinen Eltern vorbei", "Kommen Sie gemeinsam vorbei"], bildidee: "Familie im Gespräch am Beratungstisch" },
  ],
  generation50: [
    { headline: "Mobilfunk mit persönlicher Beratung.", subline: ["Wir richten {{TARIF}} gemeinsam mit dir ein – in deiner Filiale.", "Wir richten {{TARIF}} gemeinsam mit Ihnen ein – in Ihrer Filiale."], cta: "Beratungstermin vereinbaren", bildidee: "Beraterin erklärt das Smartphone am Tisch" },
    { headline: "Einfach telefonieren. Fair bezahlen.", subline: "{{DATENVOLUMEN}}, EU-Roaming und monatlich kündbar – für {{PREIS}} im Monat.", cta: "In der Filiale abschließen", bildidee: "Paar beim Videocall mit den Enkeln" },
    { headline: ["Deine Bank in {{ORT}} – jetzt auch mobil.", "Ihre Bank in {{ORT}} – jetzt auch mobil."], subline: "Vertraute Ansprechpartner, klare Konditionen und monatlich kündbar.", cta: ["Komm vorbei in {{ORT}}", "Besuchen Sie uns in {{ORT}}"], bildidee: "Spaziergang durch den Ort" },
  ],
};

const waehle = (t: T, du: boolean) => (typeof t === "string" ? t : du ? t[0] : t[1]);

/** Mock ohne Netzwerk. MOCK_AI_FAIL=once|always simuliert ungültige Antworten (Retry/Fehlerpfad). */
export class MockTextProvider implements AiTextProvider {
  name = "mock";
  modell = "mock-v1";

  async generate(req: CopyRequest, { versuch }: { versuch: number }) {
    await new Promise((r) => setTimeout(r, 900));
    const fail = process.env.MOCK_AI_FAIL ?? "never";
    if (fail === "always" || (fail === "once" && versuch === 1)) return '{"vorschlaege": "ungültig"}';

    const du = req.anrede === "DU";
    const saetze = TEXTE[req.zielgruppe.key as ZielgruppeKey] ?? TEXTE.studierende;
    const seed = req.variation.seed;
    const vorschlaege = ANSAETZE.map((ansatz, i) => {
      // Variation: Headlines und Sublines verschiedener Ansätze neu kombinieren.
      const h = saetze[(i + seed) % 3];
      const s = saetze[(i + seed * 2) % 3];
      return {
        ansatz,
        headline: waehle(h.headline, du),
        subline: waehle(s.subline, du),
        cta: waehle(saetze[i].cta, du),
        bildidee: i === 2 && req.regionalPrompt ? `${h.bildidee} – Bezug: ${req.regionalPrompt}`.slice(0, 160) : h.bildidee,
      };
    });
    return JSON.stringify({ vorschlaege });
  }
}
