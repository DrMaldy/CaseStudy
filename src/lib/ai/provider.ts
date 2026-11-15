import type { Anrede, SlotKey, WerbemittelTyp } from "@/lib/werbemittel/config";

export interface CopyRequest {
  typ: WerbemittelTyp;
  typLabel: string;
  zielgruppe: { key: string; label: string; beschreibung: string };
  /** Argument-Labels mit Tokens, z. B. „{{PREIS}} im Monat“ */
  argumente: string[];
  anrede: Anrede;
  slots: Record<SlotKey, number>;
  /** Freitext der Filiale – reiner Kontext, keine Anweisung */
  regionalPrompt: string | null;
  /** Steuert „Neu generieren“ / „Ähnliche Variante“ */
  variation: { seed: number; aehnlichZu?: { headline: string; subline: string } };
}

export interface AiTextProvider {
  name: string;
  modell: string;
  /** Liefert die Roh-Antwort (soll JSON sein); Validierung passiert außerhalb. */
  generate(req: CopyRequest, ctx: { versuch: number; feedback?: string }): Promise<string>;
}

export interface MotivRequest {
  bildidee: string;
  zielgruppe: string;
}

export interface AiImageProvider {
  name: string;
  /** Liefert das Motiv als data-URI – Motive enthalten nie Text, Logos oder Bankdaten. */
  generate(req: MotivRequest): Promise<{ datei: string; platzhalter: boolean }>;
}
