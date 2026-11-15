"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, FileText, Image as ImageIcon, Info, LayoutTemplate, Mail, File, Smartphone, Square, RectangleVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { KOMMENDE_TYPEN, TYPEN, type WerbemittelTyp } from "@/lib/werbemittel/config";
import type { WizardDaten } from "@/lib/werbemittel/daten";
import { speichereFormat } from "@/actions/werbemittel";
import { cn } from "@/lib/utils";
import { FooterBar } from "./footer-bar";

const ICONS = { image: ImageIcon, "file-text": FileText, mail: Mail, file: File, smartphone: Smartphone };

export function FormatStep({ daten }: { daten: WizardDaten }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [typ, setTyp] = useState<WerbemittelTyp>(daten.wm.typ);
  const [format, setFormat] = useState(daten.wm.format);
  const [story, setStory] = useState(daten.wm.storyVariante);
  const def = TYPEN[typ];

  function waehleTyp(t: WerbemittelTyp) {
    setTyp(t);
    setFormat(TYPEN[t].formate[0].key);
    setStory(Boolean(TYPEN[t].zusatzformat));
  }

  const weiter = () =>
    start(async () => {
      await speichereFormat({ id: daten.wm.id, typ, format, storyVariante: story });
      router.push(`/marketing/werbemittel/${daten.wm.id}/zielgruppe`);
    });

  return (
    <>
      <section className="mx-auto w-full max-w-[1200px] px-4 py-10">
        <h2 className="text-[22px]">Welches Werbemittel möchten Sie erstellen?</h2>
        <p className="mt-1 text-[15px] text-foreground/80">Alle Formate tragen automatisch Logo, Namen und Ort Ihrer Bank.</p>

        <div className="mt-6 grid grid-cols-5 gap-4">
          {Object.values(TYPEN).map((t) => {
            const Icon = ICONS[t.icon];
            const aktiv = t.key === typ;
            return (
              <button key={t.key} type="button" onClick={() => waehleTyp(t.key)} aria-pressed={aktiv}
                className={cn("relative rounded-2xl border bg-white p-4 text-left transition", aktiv ? "border-2 border-vr-ultramarine" : "border-vr-border-blue hover:border-vr-blue")}>
                {aktiv && <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-vr-blue text-white"><Check className="size-4" /></span>}
                <div className="flex h-28 items-center justify-center rounded-xl bg-vr-muted"><Icon className="size-10 text-vr-blue" strokeWidth={1.5} /></div>
                <div className="mt-3 text-[17px] font-bold text-vr-ultramarine">{t.label}</div>
                <p className="mt-1 text-sm text-foreground/75">{t.beschreibung}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground/70">
                  <LayoutTemplate className="size-3.5" /> {t.formate.map((f) => f.verhaeltnis).join(" · ")} · {t.export.join(" / ").toUpperCase()}
                </p>
              </button>
            );
          })}
          {KOMMENDE_TYPEN.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <div key={t.label} aria-disabled className="relative rounded-2xl border border-dashed border-vr-border-blue bg-white/60 p-4 opacity-70">
                <Badge variant="secondary" className="absolute top-3 right-3">Demnächst</Badge>
                <div className="flex h-28 items-center justify-center rounded-xl bg-vr-muted/60"><Icon className="size-10 text-vr-blue/60" strokeWidth={1.5} /></div>
                <div className="mt-3 text-[17px] font-bold text-vr-ultramarine">{t.label}</div>
                <p className="mt-1 text-sm text-foreground/75">{t.beschreibung}</p>
                <p className="mt-3 text-xs text-foreground/70">{t.meta}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-6 rounded-2xl border border-vr-border-blue bg-white p-6">
          <div className="flex-1">
            <h3 className="text-[17px]">Ausgabeformat für {def.label}</h3>
            <p className="mt-1 text-sm text-foreground/75">
              {typ === "social" ? "Wählen Sie das Hauptformat. Eine Story-Variante kann zusätzlich entstehen." : "Druckfertiges PDF im Format DIN A5."}
            </p>
            {def.zusatzformat && format !== def.zusatzformat && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <Checkbox checked={story} onCheckedChange={(v) => setStory(v === true)} /> Story-Variante 9:16 zusätzlich erstellen
              </label>
            )}
          </div>
          <div className="flex gap-3">
            {def.formate.map((f) => (
              <button key={f.key} type="button" onClick={() => setFormat(f.key)} aria-pressed={format === f.key}
                className={cn("flex w-56 items-center gap-3 rounded-xl border p-4 text-left whitespace-nowrap", format === f.key ? "border-2 border-vr-ultramarine" : "border-vr-border-blue")}>
                <span className={cn("size-5 rounded-full border-2", format === f.key ? "border-[6px] border-vr-blue" : "border-foreground/40")} />
                {f.verhaeltnis === "1:1" ? <Square className="size-6 text-vr-blue" /> : <RectangleVertical className="size-6 text-vr-blue" />}
                <span className="leading-tight">
                  <span className="block font-bold text-vr-ultramarine">{f.label}</span>
                  <span className="text-xs text-foreground/70">{f.px ? `${f.verhaeltnis} · ${f.px.w} × ${f.px.h}` : f.verhaeltnis}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-foreground/75">
          <Info className="size-4 text-vr-blue" /> Tipp: In der Filiale wirken Flyer, für junge Zielgruppen eher Social Media.
        </p>
      </section>

      <FooterBar
        gespeichertAm={daten.wm.updatedAt}
        primaer={
          <Button variant="cta" size="lg" onClick={weiter} disabled={pending}>
            Weiter: Zielgruppe <ArrowRight />
          </Button>
        }
      />
    </>
  );
}
