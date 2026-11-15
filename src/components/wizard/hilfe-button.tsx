"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SchrittKey } from "@/lib/werbemittel/config";

const HILFE: Record<SchrittKey, string> = {
  format: "Wählen Sie die Werbemittelart und das Ausgabeformat. Logo, Name und Ort Ihrer Bank werden automatisch eingesetzt.",
  zielgruppe: "Die Zielgruppe bestimmt Tonalität und Argumente. Der regionale Prompt Ihrer Filiale fließt als Anregung in die Texte ein.",
  vorschlag: "Die KI formuliert drei Vorschläge. Preise und Tarifdaten setzt das Partnerhub selbst ein – die KI schreibt dafür nur Platzhalter.",
  gestalten: "Passen Sie Texte, Bild und Layout an. Logo, Farben, Tarifdaten und Pflichtangaben sind fixiert.",
  export: "Prüfen Sie das Ergebnis und laden Sie es herunter – als Bild für Social Media oder als druckfertiges PDF.",
};

export function HilfeButton({ schritt }: { schritt: SchrittKey }) {
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-3 text-sm text-foreground/80">
        Hilfe zu diesem Schritt
        <span className="flex size-11 items-center justify-center rounded-full border-2 border-vr-blue text-lg font-bold text-vr-blue">?</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 text-sm leading-relaxed">{HILFE[schritt]}</PopoverContent>
    </Popover>
  );
}
