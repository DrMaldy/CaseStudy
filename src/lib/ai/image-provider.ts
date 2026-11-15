import OpenAI from "openai";
import type { AiImageProvider, MotivRequest } from "./provider";

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Abstraktes, textfreies Motiv in VR-Farben – deterministisch aus der Bildidee. */
export class MockImageProvider implements AiImageProvider {
  name = "mock";

  async generate({ bildidee }: MotivRequest) {
    const h = hash(bildidee);
    const farben = ["#0066B3", "#002D67", "#7FA8D0", "#BFD9EC", "#FF6200"];
    const kreise = Array.from({ length: 6 }, (_, i) => {
      const x = (h >>> (i * 3)) % 1200;
      const y = (h >>> (i * 2 + 1)) % 900;
      const r = 120 + ((h >>> i) % 220);
      const fill = farben[i === 5 ? 4 : (h >>> i) % 4];
      return `<circle cx="${x}" cy="${y}" r="${i === 5 ? 60 : r}" fill="${fill}" opacity="${i === 5 ? 1 : 0.55}"/>`;
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#F2F7FB"/>${kreise}</svg>`;
    return { datei: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, platzhalter: true };
  }
}

/** Antwort von OpenRouters `POST /images` – wie OpenAI, aber mit `media_type` pro Bild. */
interface OpenRouterBildAntwort {
  data?: { b64_json?: string; media_type?: string }[];
}

/**
 * OpenAI-kompatible Bildgenerierung. Leere AI_IMAGE_*-Werte übernehmen die Text-Einstellungen (AI_BASE_URL, AI_API_KEY).
 * OpenRouter weicht vom OpenAI-Standard ab: Endpunkt `/images` statt `/images/generations`, Seitenverhältnis statt Pixelmaß.
 */
export class OpenAiCompatibleImageProvider implements AiImageProvider {
  name = "openai-compatible";
  private client: OpenAI;
  private openRouter: boolean;

  constructor() {
    const { AI_IMAGE_BASE_URL, AI_IMAGE_API_KEY, AI_BASE_URL, AI_API_KEY, AI_APP_URL, AI_APP_NAME } = process.env;
    const baseURL = AI_IMAGE_BASE_URL || AI_BASE_URL || undefined;
    this.openRouter = /(^|\.)openrouter\.ai$/.test(baseURL ? new URL(baseURL).hostname : "");
    this.client = new OpenAI({
      baseURL,
      apiKey: AI_IMAGE_API_KEY || AI_API_KEY || "nicht-gesetzt",
      defaultHeaders: { ...(AI_APP_URL && { "HTTP-Referer": AI_APP_URL }), ...(AI_APP_NAME && { "X-Title": AI_APP_NAME }) },
      timeout: 120_000,
    });
  }

  async generate({ bildidee, zielgruppe }: MotivRequest) {
    const model = process.env.AI_IMAGE_MODEL;
    if (!model) throw new Error("AI_IMAGE_MODEL ist nicht gesetzt.");
    const prompt =
      `Dokumentarisches, warmes Foto mit echten Menschen im Alltag, natürliches Licht. Motiv: ${bildidee}. Zielgruppe: ${zielgruppe}. ` +
      "Streng verboten: Text, Schrift, Buchstaben, Zahlen, Logos, Markenzeichen, Bankdaten.";

    const bild = this.openRouter
      ? (await this.client.post<OpenRouterBildAntwort>("/images", { body: { model, prompt, aspect_ratio: "3:2", n: 1 } })).data?.[0]
      : (await this.client.images.generate({ model, prompt, size: "1536x1024", n: 1 })).data?.[0];

    if (!bild?.b64_json) throw new Error("Bildanbieter lieferte kein Bild.");
    const mediaType = (bild && "media_type" in bild && bild.media_type) || "image/png";
    return { datei: `data:${mediaType};base64,${bild.b64_json}`, platzhalter: false };
  }
}

export function imageProvider(): AiImageProvider | null {
  const wert = process.env.AI_IMAGE_PROVIDER;
  switch (wert) {
    case "off":
      return null;
    case "openai-compatible":
      return new OpenAiCompatibleImageProvider();
    default:
      // Tippfehler fielen bisher still auf den Mock zurück – jetzt sichtbar im Server-Log.
      if (wert && wert !== "mock") console.warn(`AI_IMAGE_PROVIDER="${wert}" ist unbekannt (mock | openai-compatible | off) – verwende Mock.`);
      return new MockImageProvider();
  }
}
