import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser } from "playwright";
import type { Dateiformat } from "@/lib/werbemittel/config";

const globalForBrowser = globalThis as unknown as { browser?: Promise<Browser> };

/**
 * Ein Chromium pro Server-Prozess, wiederverwendet über alle Exporte.
 * Schlägt der Start fehl oder stürzt der Browser ab, wird der Cache geleert – sonst bliebe ein
 * abgelehntes Promise hängen und jeder weitere Export scheiterte bis zum Neustart des Servers.
 */
function browser() {
  globalForBrowser.browser ??= chromium.launch().then(
    (b) => {
      b.on("disconnected", () => {
        globalForBrowser.browser = undefined;
      });
      return b;
    },
    (e: unknown) => {
      globalForBrowser.browser = undefined;
      throw e;
    },
  );
  return globalForBrowser.browser;
}

const MIME: Record<string, string> = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff2": "font/woff2" };

/** Öffentliche Pfade → data-URI, damit das Export-HTML ohne Server auskommt. */
export async function alsDataUri(pfad: string) {
  if (pfad.startsWith("data:")) return pfad;
  const datei = path.join(process.cwd(), "public", pfad);
  const buf = await readFile(datei);
  return `data:${MIME[path.extname(datei)] ?? "application/octet-stream"};base64,${buf.toString("base64")}`;
}

async function fontFaces() {
  const dir = path.join(process.cwd(), "node_modules/@fontsource/source-sans-3/files");
  const faces = await Promise.all(
    [400, 700].map(async (w) => {
      const b64 = (await readFile(path.join(dir, `source-sans-3-latin-${w}-normal.woff2`))).toString("base64");
      return `@font-face{font-family:'Source Sans 3';font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    }),
  );
  return faces.join("");
}

/** Rendert statisches Motiv-HTML in Headless-Chromium zu PNG/JPG (exakte Pixel) oder PDF (exakte mm). */
export async function rendereDatei(input: { html: string; breite: number; hoehe: number; datei: Dateiformat; mm?: { w: number; h: number } }) {
  const page = await (await browser()).newPage({ viewport: { width: input.breite, height: input.hoehe }, deviceScaleFactor: 1 });
  try {
    await page.setContent(
      // --font-sans muss definiert sein: Eine undefinierte var() macht die ganze font-family-Deklaration ungültig.
      `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${await fontFaces()}:root{--font-sans:'Source Sans 3'}html,body{margin:0;padding:0}@page{margin:0;size:${input.mm ? `${input.mm.w}mm ${input.mm.h}mm` : "auto"}}</style></head><body>${input.html}</body></html>`,
      { waitUntil: "load" },
    );
    await page.evaluate(() => document.fonts.ready);
    if (input.datei === "pdf") {
      return await page.pdf({ width: `${input.mm!.w}mm`, height: `${input.mm!.h}mm`, printBackground: true, pageRanges: "1" });
    }
    return await page.screenshot({
      type: input.datei === "jpg" ? "jpeg" : "png",
      quality: input.datei === "jpg" ? 90 : undefined,
      clip: { x: 0, y: 0, width: input.breite, height: input.hoehe },
    });
  } finally {
    await page.close();
  }
}
