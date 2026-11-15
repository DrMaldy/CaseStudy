import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

// Alle Bank- und Filialdaten sind öffentlich auf vr.de veröffentlicht (abgerufen am 14.11.2026) und dienen nur Testzwecken.
// Wo keine Filial-Durchwahl veröffentlicht ist, steht die zentrale Rufnummer der Bank.
const QUELLE = "vr.de Bank- und Standortseiten, abgerufen am 14.11.2026";

const banken = [
  {
    // Ersetzt die fiktive Mockup-Bank „Volksbank Am Hasetal eG“ – reale Bank in derselben Region (Fürstenau, Hasetal).
    id: "vr-osnordland",
    name: "VR-Bank eG Osnabrücker Nordland",
    kurzname: "VR-Bank Osnabrücker Nordland",
    region: "Fürstenau · Menslage · Nortrup",
    website: "https://www.vrbank-osnordland.de",
    telefon: "05901 9303-0",
    quelle: QUELLE,
    filialen: [
      { id: "osnordland-fuerstenau", name: "Hauptgeschäftsstelle Fürstenau", strasse: "Große Straße 31/33", plz: "49584", ort: "Fürstenau", oeffnungszeiten: "Mo, Mi, Fr 9:00–12:00 · Di 9:00–12:00 und 14:00–16:30 · Do 9:00–12:00 und 14:00–17:30", telefon: "05901 9303-0" },
      { id: "osnordland-menslage", name: "Filiale Menslage", strasse: "Quakenbrücker Straße 1", plz: "49637", ort: "Menslage", oeffnungszeiten: "Mo 14:00–16:30 · Di, Do 9:00–12:00", telefon: "05437 9420-0" },
      { id: "osnordland-nortrup", name: "Filiale Nortrup", strasse: "Farwickstr. 21", plz: "49638", ort: "Nortrup", oeffnungszeiten: "Mo, Mi 9:00–12:00 · Di 14:00–16:30 · Do 14:00–17:30", telefon: "05436 9526-0" },
    ],
  },
  {
    id: "vb-kraichgau",
    name: "Volksbank Kraichgau eG",
    kurzname: "Volksbank Kraichgau",
    region: "Kraichgau & Kurpfalz",
    website: "https://www.vbkraichgau.de",
    telefon: "06222 589-0",
    quelle: QUELLE,
    filialen: [
      { id: "kraichgau-wiesloch", name: "Hauptstelle Wiesloch", strasse: "Hauptstr. 139", plz: "69168", ort: "Wiesloch", oeffnungszeiten: "Mo, Di, Fr 9:00–12:00 und 14:00–16:30 · Mi 9:00–12:00 · Do 9:00–12:00 und 14:00–18:00", telefon: "06222 589-0" },
      { id: "kraichgau-sinsheim", name: "Filiale Sinsheim", strasse: "Hauptstraße 115", plz: "74889", ort: "Sinsheim", oeffnungszeiten: "Mo, Di, Fr 9:00–12:00 und 14:00–16:30 · Mi 9:00–12:00 · Do 9:00–12:00 und 14:00–18:00", telefon: "06222 589-0" },
      { id: "kraichgau-eppingen", name: "Filiale Eppingen", strasse: "Bahnhofstraße 23", plz: "75031", ort: "Eppingen", oeffnungszeiten: "Mo, Di, Fr 9:00–12:00 und 14:00–16:30 · Mi 9:00–12:00 · Do 9:00–12:00 und 14:00–18:00", telefon: "06222 589-0" },
    ],
  },
  {
    id: "vb-mittelhessen",
    name: "Volksbank Mittelhessen eG",
    kurzname: "Volksbank Mittelhessen",
    region: "Mittelhessen",
    website: "https://www.vb-mittelhessen.de",
    telefon: "0641 7005-0",
    quelle: QUELLE,
    filialen: [
      { id: "mittelhessen-giessen-schiffenberger", name: "Filiale Gießen Schiffenberger Weg", strasse: "Schiffenberger Weg 110", plz: "35394", ort: "Gießen", oeffnungszeiten: "Mo, Di, Do 9:00–12:00 und 13:00–18:00 · Mi, Fr 9:00–12:00 und 13:00–16:00", telefon: "0641 7005-0" },
      { id: "mittelhessen-giessen-goethe", name: "Filiale Gießen Goethestraße", strasse: "Goethestraße 7", plz: "35390", ort: "Gießen", oeffnungszeiten: "Mo–Do 9:00–18:00 · Fr 9:00–16:00", telefon: "0641 7005 999011" },
      // Marburg-Mitte ersetzt: dort waren auf vr.de keine Öffnungszeiten veröffentlicht.
      { id: "mittelhessen-bad-hersfeld", name: "Filiale Bad Hersfeld", strasse: "Am Markt 30-31", plz: "36251", ort: "Bad Hersfeld", oeffnungszeiten: "Mo, Di, Fr 9:00–12:00 und 14:00–17:00 · Mi 9:00–12:00 · Do 9:00–12:00 und 14:00–17:30", telefon: "0641 7005-0" },
    ],
  },
];

// Neutrale Funktionskonten (keine Namen realer Personen). Der Superuser hat Zugriff auf alle Banken.
const nutzer = [
  { name: "Marketing Fürstenau", email: "marketing.fuerstenau@osnordland.test", filialeId: "osnordland-fuerstenau", rolle: "FILIALE", funktion: "Marketing" },
  { name: "Marketing Menslage", email: "marketing.menslage@osnordland.test", filialeId: "osnordland-menslage", rolle: "FILIALE", funktion: "Marketing" },
  { name: "Marketing Wiesloch", email: "marketing@kraichgau.test", filialeId: "kraichgau-wiesloch", rolle: "FILIALE", funktion: "Marketing" },
  { name: "Marketing Gießen", email: "marketing@mittelhessen.test", filialeId: "mittelhessen-giessen-schiffenberger", rolle: "FILIALE", funktion: "Marketing" },
  { name: "Partnerhub Superuser", email: "superuser@partnerhub.test", filialeId: "osnordland-fuerstenau", rolle: "SUPERUSER", funktion: "Superuser · alle Banken" },
];

const bilder = [
  { id: "bild-studierende", datei: "/bildmaterial/studierende.svg", beschreibung: "Studierende & Azubis", zielgruppen: ["studierende"] },
  { id: "bild-familien", datei: "/bildmaterial/familien.svg", beschreibung: "Familie im Alltag", zielgruppen: ["familien", "jugendliche"] },
  { id: "bild-pendler", datei: "/bildmaterial/pendler.svg", beschreibung: "Unterwegs zur Arbeit", zielgruppen: ["pendler"] },
  { id: "bild-mitglieder", datei: "/bildmaterial/mitglieder.svg", beschreibung: "Mitglieder vor Ort", zielgruppen: ["mitglieder"] },
  { id: "bild-jugendliche", datei: "/bildmaterial/jugendliche.svg", beschreibung: "Erstes eigenes Handy", zielgruppen: ["jugendliche"] },
  { id: "bild-generation50", datei: "/bildmaterial/generation50.svg", beschreibung: "Persönliche Beratung", zielgruppen: ["generation50"] },
];

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("SEED_PASSWORD fehlt in .env");

  await db.$transaction([
    db.export.deleteMany(),
    db.kiGenerierung.deleteMany(),
    db.werbemittel.deleteMany(),
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.user.deleteMany(),
    db.bildAsset.deleteMany(),
    db.filiale.deleteMany(),
    db.bank.deleteMany(),
    db.angebot.deleteMany(),
  ]);

  for (const { filialen, ...bank } of banken) {
    await db.bank.create({
      data: { ...bank, logoPfad: "/brand/vr-signet.svg", filialen: { create: filialen } },
    });
  }

  // Tarif exakt laut Aufgabenstellung („Anforderungen“), fiktiv.
  await db.angebot.create({
    data: {
      id: "vr-mobilfunk-m",
      name: "VR Mobilfunk M",
      datenvolumenGb: 35,
      netz: "5G",
      roaming: "EU-Roaming",
      preisMonat: 19.99,
      mitgliederBonusGb: 15,
      laufzeit: "monatlich kündbar",
      abschluss: "online oder in der Filiale",
      pflichtangaben: "[PLATZHALTER Pflichtangaben/Rechtstext – Anbieter, Preisangaben, Vertragsdetails; Freigabe durch amberra]",
      stand: "Fiktives Angebot laut Aufgabenstellung",
    },
  });

  for (const b of bilder) {
    await db.bildAsset.create({
      data: { ...b, zielgruppen: JSON.stringify(b.zielgruppen), herkunft: "BIBLIOTHEK", platzhalter: true },
    });
  }

  const hash = await hashPassword(password);
  for (const n of nutzer) {
    const id = `user-${n.email.replace(/[^a-z0-9]+/g, "-")}`;
    await db.user.create({
      data: {
        id,
        name: n.name,
        email: n.email,
        emailVerified: true,
        filialeId: n.filialeId,
        rolle: n.rolle,
        funktion: n.funktion,
        accounts: { create: { id: `acc-${id}`, accountId: id, providerId: "credential", password: hash } },
      },
    });
  }

  console.log(`Seed: ${banken.length} Banken, ${nutzer.length} Nutzer, ${bilder.length} Bilder.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
