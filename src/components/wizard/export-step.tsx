"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Download, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TYPEN, formatDef, type Dateiformat } from "@/lib/werbemittel/config";
import { fakten } from "@/lib/werbemittel/tokens";
import { exportBereit, pruefe } from "@/lib/werbemittel/checks";
import { beitragstext } from "@/lib/werbemittel/caption";
import { faktenKontext } from "@/lib/werbemittel/fakten-guard";
import type { WizardDaten } from "@/lib/werbemittel/daten";
import { speichereName } from "@/actions/werbemittel";
import { MotivVorschau, modelAusDaten } from "@/components/werbemittel/motiv-vorschau";
import { cn } from "@/lib/utils";
import { FooterBar } from "./footer-bar";

const DATEI_INFO: Record<Dateiformat, { label: string; sub: string }> = {
  png: { label: "PNG", sub: "empfohlen" },
  jpg: { label: "JPG", sub: "kleiner" },
  pdf: { label: "PDF", sub: "für Druck" },
};

export function ExportStep({ daten }: { daten: WizardDaten }) {
  const router = useRouter();
  const def = TYPEN[daten.wm.typ];
  const [name, setName] = useState(daten.wm.name);
  const [datei, setDatei] = useState<Dateiformat>(def.export[0]);
  const [mitStory, setMitStory] = useState(daten.wm.storyVariante);
  const [pending, start] = useTransition();

  const formate = [daten.wm.format, ...(daten.wm.storyVariante && def.zusatzformat ? [def.zusatzformat] : [])];
  const models = formate.map((k) => ({ key: k, def: formatDef(daten.wm.typ, k), model: modelAusDaten(daten, {}, k) }));
  const pruefungen = pruefe({ typ: daten.wm.typ, roh: daten.wm, model: models[0].model, angebotStand: daten.angebot.stand, kontext: faktenKontext(daten) });
  const bereit = exportBereit(pruefungen);
  const filiale = daten.filialen.find((f) => f.id === daten.wm.bezugFilialeId)!;
  const caption = beitragstext({ subline: daten.wm.subline, fakten: fakten({ angebot: daten.angebot, bank: daten.bank, filiale }) });

  async function lade(format: string) {
    const res = await fetch(`/api/werbemittel/${daten.wm.id}/export?datei=${datei}&format=${format}`);
    if (!res.ok) throw new Error(res.status === 422 ? "Prüfungen nicht bestanden." : "Export fehlgeschlagen.");
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = decodeURIComponent(res.headers.get("Content-Disposition")?.split("''")[1] ?? `werbemittel.${datei}`);
    a.click();
    URL.revokeObjectURL(url);
  }

  const exportieren = () =>
    start(async () => {
      try {
        if (name.trim() && name !== daten.wm.name) await speichereName({ id: daten.wm.id, name });
        for (const m of models.filter((m, i) => i === 0 || mitStory)) await lade(m.key);
        toast.success("Export abgeschlossen – die Datei liegt in Ihren Downloads.");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  return (
    <>
      <section className="mx-auto grid w-full max-w-[1200px] grid-cols-[1fr_440px] gap-6 px-4 py-8">
        <div className="flex flex-col rounded-3xl border border-vr-border-blue bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">{name || daten.wm.name}</h2>
            <Link href={`/marketing/werbemittel/${daten.wm.id}/gestalten`} className="flex items-center gap-1.5 text-sm font-bold text-vr-blue"><Pencil className="size-4" /> Zurück zum Gestalten</Link>
          </div>
          <div className="mt-4 flex flex-1 items-center justify-center gap-10 rounded-2xl bg-vr-muted p-8">
            {models.map((m, i) => (
              <figure key={m.key} className="flex flex-col items-center">
                <MotivVorschau model={m.model} maxBreite={i === 0 ? 300 : 180} maxHoehe={400} className="shadow-[0_4px_15px_rgba(0,0,0,.15)]" />
                <figcaption className="mt-3 text-center text-sm">
                  <span className="block font-bold text-vr-ultramarine">{m.def.label} {m.def.verhaeltnis}</span>
                  <span className="text-xs text-foreground/70">{m.def.px ? `${m.def.px.w} × ${m.def.px.h} px` : `${m.def.mm!.w} × ${m.def.mm!.h} mm`} · {i === 0 ? "Hauptformat" : "zusätzlich"}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-vr-border-blue bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg">
              <span className={cn("flex size-8 items-center justify-center rounded-full", bereit ? "bg-vr-success-bg" : "bg-destructive/10")}>
                {bereit ? <Check className="size-4 text-vr-success" /> : <X className="size-4 text-destructive" />}
              </span>
              {bereit ? "Alles bereit zum Export" : "Bitte zuerst korrigieren"}
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {pruefungen.map((p) => (
                <li key={p.label} className="flex items-start gap-2">
                  {p.status === "ok" ? <Check className="mt-0.5 size-4 text-vr-success" /> : p.status === "warnung" ? <AlertTriangle className="mt-0.5 size-4 text-vr-orange-hover" /> : <X className="mt-0.5 size-4 text-destructive" />}
                  <span className="text-vr-ultramarine">{p.label}{p.hinweis && <span className="block text-xs text-foreground/70">{p.hinweis}</span>}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-vr-border-blue bg-white p-5">
            <h2 className="text-lg">Export</h2>
            <label htmlFor="name" className="mt-3 block text-sm font-bold">Name</label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="mt-1.5 h-11" />
            <p className="mt-4 text-sm font-bold">Dateiformat</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {def.export.map((d) => (
                <button key={d} type="button" onClick={() => setDatei(d)} aria-pressed={datei === d}
                  className={cn("flex items-center gap-2 rounded-xl border p-3 text-left", datei === d ? "border-2 border-vr-ultramarine" : "border-vr-border-blue")}>
                  <span className={cn("size-5 shrink-0 rounded-full border-2", datei === d ? "border-[6px] border-vr-blue" : "border-foreground/40")} />
                  <span className="leading-tight"><span className="block font-bold text-vr-ultramarine">{DATEI_INFO[d].label}</span><span className="text-xs text-foreground/70">{DATEI_INFO[d].sub}</span></span>
                </button>
              ))}
            </div>
            {models.length > 1 && (
              <label className="mt-3 flex items-center gap-2 text-sm"><Checkbox checked={mitStory} onCheckedChange={(v) => setMitStory(v === true)} /> Story-Variante 9:16 mitexportieren</label>
            )}
          </div>

          {daten.wm.typ === "social" && (
            <div className="rounded-3xl border border-vr-border-blue bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base">Beitragstext für Social Media</h2>
                <button type="button" className="flex items-center gap-1 text-sm font-bold text-vr-blue" onClick={() => navigator.clipboard.writeText(caption).then(() => toast.success("Beitragstext kopiert."))}>
                  <Copy className="size-4" /> Kopieren
                </button>
              </div>
              <p className="mt-2 text-sm whitespace-pre-line text-foreground/85">{caption}</p>
            </div>
          )}
        </div>
      </section>

      <FooterBar
        zurueck={`/marketing/werbemittel/${daten.wm.id}/gestalten`}
        gespeichertAm={daten.wm.updatedAt}
        primaer={
          <Button variant="cta" size="lg" onClick={exportieren} disabled={!bereit || pending}>
            {pending ? "Wird erstellt …" : "Exportieren & herunterladen"} <Download />
          </Button>
        }
      />
    </>
  );
}
