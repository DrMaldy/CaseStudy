-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kurzname" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "logoPfad" TEXT NOT NULL,
    "quelle" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Filiale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strasse" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "ort" TEXT NOT NULL,
    "oeffnungszeiten" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "regionalPrompt" TEXT,
    "regionalPromptAktualisiertAm" DATETIME,
    CONSTRAINT "Filiale_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Angebot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "datenvolumenGb" INTEGER NOT NULL,
    "netz" TEXT NOT NULL,
    "roaming" TEXT NOT NULL,
    "preisMonat" REAL NOT NULL,
    "mitgliederBonusGb" INTEGER NOT NULL,
    "laufzeit" TEXT NOT NULL,
    "abschluss" TEXT NOT NULL,
    "pflichtangaben" TEXT NOT NULL,
    "stand" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BildAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankId" TEXT,
    "datei" TEXT NOT NULL,
    "beschreibung" TEXT NOT NULL,
    "zielgruppen" TEXT NOT NULL,
    "herkunft" TEXT NOT NULL,
    "platzhalter" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BildAsset_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Werbemittel" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Werbemittel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Werbemittel_filialeId_fkey" FOREIGN KEY ("filialeId") REFERENCES "Filiale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Werbemittel_bildAssetId_fkey" FOREIGN KEY ("bildAssetId") REFERENCES "BildAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Werbemittel_bezugFilialeId_fkey" FOREIGN KEY ("bezugFilialeId") REFERENCES "Filiale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KiGenerierung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "werbemittelId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modell" TEXT NOT NULL,
    "anfrage" TEXT NOT NULL,
    "rohantwort" TEXT NOT NULL,
    "gueltig" BOOLEAN NOT NULL,
    "versuch" INTEGER NOT NULL,
    "fehler" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KiGenerierung_werbemittelId_fkey" FOREIGN KEY ("werbemittelId") REFERENCES "Werbemittel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "werbemittelId" TEXT NOT NULL,
    "dateiformat" TEXT NOT NULL,
    "variante" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Export_werbemittelId_fkey" FOREIGN KEY ("werbemittelId") REFERENCES "Werbemittel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "filialeId" TEXT NOT NULL,
    "funktion" TEXT NOT NULL DEFAULT 'Marketing',
    CONSTRAINT "user_filialeId_fkey" FOREIGN KEY ("filialeId") REFERENCES "Filiale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Werbemittel_filialeId_idx" ON "Werbemittel"("filialeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
