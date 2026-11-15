# VR Mobilfunk Partnerhub – Werbemittel-Generator (Prototyp)

Partnerbanken erstellen in fünf Schritten personalisierte Werbemittel für „VR Mobilfunk M“: einen **Social-Media-Post** (PNG/JPG) oder einen **Filial-Flyer** (PDF, DIN A5). Die KI formuliert zielgruppengerechte Texte. Logo, Bankname, Ort und Konditionen setzt das Partnerhub selbst ein.

Architektur, Annahmen und Entscheidungen: **[docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md)**

## Setup

Voraussetzung: Node.js ≥ 22.

```bash
npm install                   # installiert über postinstall auch den passenden Chromium für den Export
cp .env.example .env          # danach BETTER_AUTH_SECRET setzen (z. B. openssl rand -base64 32)
npm run db:reset              # Migration + Seed
npm run dev
```

Anschließend <http://localhost:3000> öffnen.

## Testzugänge (Seed)

Alle Seed-Nutzer verwenden das Passwort aus `SEED_PASSWORD` in `.env`.

| E-Mail | Rolle · Bank · Filiale |
|---|---|
| `superuser@partnerhub.test` | **Superuser** · alle Banken (Wechsel über den Bankumschalter im Header) |
| `marketing.fuerstenau@osnordland.test` | Filiale · VR-Bank eG Osnabrücker Nordland · Hauptgeschäftsstelle Fürstenau |
| `marketing.menslage@osnordland.test` | Filiale · VR-Bank eG Osnabrücker Nordland · Menslage |
| `marketing@kraichgau.test` | Filiale · Volksbank Kraichgau eG · Hauptstelle Wiesloch |
| `marketing@mittelhessen.test` | Filiale · Volksbank Mittelhessen eG · Gießen Schiffenberger Weg |

Bank- und Filialdaten stammen aus öffentlichen vr.de-Standortseiten (Stand 14.11.2026) und dienen nur zu Testzwecken.

## KI-Anbieter

Standard ist der **Mock** (`AI_PROVIDER=mock`), der ohne Netzwerk auskommt. Für einen echten Anbieter über einen OpenAI-kompatiblen Endpunkt, z. B. OpenRouter:

```env
AI_PROVIDER="openai-compatible"
AI_BASE_URL="https://openrouter.ai/api/v1"
AI_API_KEY="…"
AI_MODEL="<Modell-ID des Anbieters>"
```

Mit `MOCK_AI_FAIL=once|always` lassen sich Retry und Fehlermeldung testen.

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm test` | Unit-Tests (Vitest) |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run db:reset` | Datenbank neu aufsetzen inkl. Seed |

## Struktur

```
prisma/                 Schema, Migration, Seed (Banken, Filialen, Tarif, Bildmaterial, Nutzer)
src/lib/werbemittel/    Baukasten-Registry, Tokens, Render-Model, Checks, Beitragstext
src/lib/ai/             Provider-Interfaces, Mock, OpenAI-kompatibler Adapter, Zod-Schema, Retry
src/lib/export/         Playwright-Rendering (PNG/JPG/PDF)
src/templates/          Vorlagen (Inline-Styles: Vorschau = Export)
src/components/wizard/  Die fünf Wizard-Schritte
src/actions/            Server Actions
```
