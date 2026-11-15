import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { SCHRITTE, type SchrittKey } from "@/lib/werbemittel/config";
import { cn } from "@/lib/utils";
import { HilfeButton } from "./hilfe-button";

export function WizardKopf({ id, aktiv, erreicht }: { id: string; aktiv: SchrittKey; erreicht: number }) {
  const aktivIndex = SCHRITTE.findIndex((s) => s.key === aktiv);
  return (
    <div className="border-b bg-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-7 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/marketing/werbemittel" className="inline-flex items-center gap-1.5 text-sm font-bold text-vr-blue">
              <ArrowLeft className="size-4" /> Zur Übersicht
            </Link>
            <h1 className="mt-2 text-[28px]">Neues Werbemittel erstellen</h1>
          </div>
          <HilfeButton schritt={aktiv} />
        </div>
        <ol className="mt-6 flex items-center gap-4">
          {SCHRITTE.map((s, i) => {
            const fertig = i < aktivIndex;
            const klickbar = i + 1 <= erreicht && i !== aktivIndex;
            const inhalt = (
              <>
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                  i === aktivIndex ? "border-vr-ultramarine bg-vr-ultramarine text-white" : fertig ? "border-vr-blue bg-vr-blue text-white" : "border-vr-border-blue text-vr-ultramarine")}>
                  {fertig ? <Check className="size-4" /> : i + 1}
                </span>
                <span className="leading-tight">
                  <span className={cn("block text-[15px] text-vr-ultramarine", (i === aktivIndex || fertig) && "font-bold")}>{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.sub}</span>
                </span>
              </>
            );
            return (
              <li key={s.key} className="flex flex-1 items-center gap-3 last:flex-none">
                {klickbar ? (
                  <Link href={`/marketing/werbemittel/${id}/${s.key}`} className="flex items-center gap-3">{inhalt}</Link>
                ) : (
                  <span className="flex items-center gap-3" aria-current={i === aktivIndex ? "step" : undefined}>{inhalt}</span>
                )}
                {i < SCHRITTE.length - 1 && <span className="h-px flex-1 bg-vr-border-blue" />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
