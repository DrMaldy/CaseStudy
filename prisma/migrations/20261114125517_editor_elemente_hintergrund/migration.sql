-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Werbemittel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "filialeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "storyVariante" BOOLEAN NOT NULL DEFAULT false,
    "vorlage" TEXT NOT NULL,
    "zielgruppe" TEXT,
    "argumente" TEXT NOT NULL DEFAULT '[]',
    "anrede" TEXT NOT NULL DEFAULT 'DU',
    "schritt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ENTWURF',
    "vorschlaege" TEXT,
    "gewaehlterVorschlag" INTEGER,
    "headline" TEXT NOT NULL DEFAULT '',
    "subline" TEXT NOT NULL DEFAULT '',
    "cta" TEXT NOT NULL DEFAULT '',
    "bildidee" TEXT NOT NULL DEFAULT '',
    "bildAssetId" TEXT,
    "bezugFilialeId" TEXT NOT NULL,
    "ortImMotiv" BOOLEAN NOT NULL DEFAULT true,
    "ausgeblendet" TEXT NOT NULL DEFAULT '[]',
    "hintergrund" TEXT NOT NULL DEFAULT 'ultramarin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Werbemittel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Werbemittel_filialeId_fkey" FOREIGN KEY ("filialeId") REFERENCES "Filiale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Werbemittel_bildAssetId_fkey" FOREIGN KEY ("bildAssetId") REFERENCES "BildAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Werbemittel_bezugFilialeId_fkey" FOREIGN KEY ("bezugFilialeId") REFERENCES "Filiale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Werbemittel" ("anrede", "argumente", "bezugFilialeId", "bildAssetId", "bildidee", "createdAt", "cta", "filialeId", "format", "gewaehlterVorschlag", "headline", "id", "name", "ortImMotiv", "schritt", "status", "storyVariante", "subline", "typ", "updatedAt", "userId", "vorlage", "vorschlaege", "zielgruppe") SELECT "anrede", "argumente", "bezugFilialeId", "bildAssetId", "bildidee", "createdAt", "cta", "filialeId", "format", "gewaehlterVorschlag", "headline", "id", "name", "ortImMotiv", "schritt", "status", "storyVariante", "subline", "typ", "updatedAt", "userId", "vorlage", "vorschlaege", "zielgruppe" FROM "Werbemittel";
DROP TABLE "Werbemittel";
ALTER TABLE "new_Werbemittel" RENAME TO "Werbemittel";
CREATE INDEX "Werbemittel_filialeId_idx" ON "Werbemittel"("filialeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
