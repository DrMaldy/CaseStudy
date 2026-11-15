"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Check, Eye, EyeOff, MapPin, Sparkles, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ELEMENTE, HINTERGRUENDE, TYPEN, VORLAGEN, formatDef, istPlatzhalter, type ElementKey, type SlotKey } from "@/lib/werbemittel/config";
import { fakten, resolveTokens } from "@/lib/werbemittel/tokens";
import type { WizardDaten } from "@/lib/werbemittel/daten";
import { generiereKiMotiv, speichereGestaltung } from "@/actions/werbemittel";
import { MotivVorschau, modelAusDaten } from "@/components/werbemittel/motiv-vorschau";
import { cn } from "@/lib/utils";
import { FooterBar } from "./footer-bar";

type Stand = Pick<WizardDaten["wm"], "headline" | "subline" | "cta" | "bezugFilialeId" | "ortImMotiv" | "bildAssetId" | "vorlage" | "ausgeblendet" | "hintergrund">;

function Zaehler({ wert, max }: { wert: string; max: number }) {
  return <span className={cn("text-xs", wert.length > max ? "font-bold text-destructive" : "text-muted-foreground")}>{wert.length} / {max}</span>;
}

export function GestaltenStep({ daten }: { daten: WizardDaten }) {
  const typ = TYPEN[daten.wm.typ];
  const [stand, setStand] = useState<Stand>({
    headline: daten.wm.headline, subline: daten.wm.subline, cta: daten.wm.cta, bezugFilialeId: daten.wm.bezugFilialeId,
    ortImMotiv: daten.wm.ortImMotiv, bildAssetId: daten.wm.bildAssetId, vorlage: daten.wm.vorlage,
    ausgeblendet: daten.wm.ausgeblendet, hintergrund: daten.wm.hintergrund,
  });
  const [bilder, setBilder] = useState(daten.bilder);
  const [gespeichertAm, setGespeichertAm] = useState(daten.wm.updatedAt);
  const [vorschauFormat, setVorschauFormat] = useState(daten.wm.format);
  const [zoom, setZoom] = useState(1);
  const [motivLaedt, setMotivLaedt] = useState(false);
  const erster = useRef(true);
  const router = useRouter();
  const [pending, start] = useTransition();

  const filiale = daten.filialen.find((f) => f.id === stand.bezugFilialeId)!;
  const f = fakten({ angebot: daten.angebot, bank: daten.bank, filiale });
  const set = <K extends keyof Stand>(k: K, v: Stand[K]) => setStand((s) => ({ ...s, [k]: v }));
  const sichtbar = (k: ElementKey) => !stand.ausgeblendet.includes(k);
  // Funktionales Update: mehrere Schalter im selben Render-Zyklus überschreiben sich nicht gegenseitig.
  const umschalten = (k: ElementKey) =>
    setStand((s) => ({ ...s, ausgeblendet: s.ausgeblendet.includes(k) ? s.ausgeblendet.filter((x) => x !== k) : [...s.ausgeblendet, k] }));
  // Ausgeblendete Texte erscheinen nicht im Motiv – ihr Limit blockiert nicht (gleiche Regel wie im Server).
  const zuLang = (["headline", "subline", "cta"] as SlotKey[]).some((k) => sichtbar(k) && stand[k].length > typ.slots[k]);
  const vorlageDef = VORLAGEN[stand.vorlage];

  // Autosave (entprellt) – nur gültige Stände werden gespeichert.
  useEffect(() => {
    if (erster.current) return void (erster.current = false);
    if (zuLang) return;
    const t = setTimeout(async () => {
      const res = await speichereGestaltung({ id: daten.wm.id, ...stand, format: daten.wm.format });
      if (res.ok && res.gespeichertAm) setGespeichertAm(res.gespeichertAm);
      else if (!res.ok) toast.error(res.fehler);
    }, 700);
    return () => clearTimeout(t);
  }, [stand, zuLang, daten.wm.id, daten.wm.format]);

  async function kiMotiv() {
    setMotivLaedt(true);
    const res = await generiereKiMotiv({ id: daten.wm.id });
    setMotivLaedt(false);
    if (!res.ok) return void toast.error(res.fehler);
    setBilder((b) => [...b, { ...res.bild, zielgruppen: [] }]);
    set("bildAssetId", res.bild.id);
  }

  // Vor dem Wechsel sofort speichern, damit keine entprellte Änderung verloren geht.
  const weiter = () =>
    start(async () => {
      const res = await speichereGestaltung({ id: daten.wm.id, ...stand, format: daten.wm.format });
      if (!res.ok) return void toast.error(res.fehler);
      router.push(`/marketing/werbemittel/${daten.wm.id}/export`);
    });

  const formate = [daten.wm.format, ...(daten.wm.storyVariante && typ.zusatzformat ? [typ.zusatzformat] : [])];
  const model = modelAusDaten({ ...daten, bilder }, stand, vorschauFormat);
  const headlineOptionen = [...new Set((daten.wm.vorschlaege ?? []).map((v) => v.headline))];

  return (
    <>
      <section className="mx-auto grid w-full max-w-[1200px] grid-cols-[440px_1fr] gap-6 px-4 py-8">
        <Tabs defaultValue="text" className="rounded-3xl border border-vr-border-blue bg-white">
          <TabsList variant="line" className="w-full justify-start border-b px-5 pt-2">
            <TabsTrigger value="text">Text & Region</TabsTrigger>
            <TabsTrigger value="bild">Bild</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-5 p-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm">Headline</h3>
                <Link href={`/marketing/werbemittel/${daten.wm.id}/vorschlag`} className="flex items-center gap-1 text-xs font-bold text-vr-blue"><Sparkles className="size-3.5" /> Neue Vorschläge</Link>
              </div>
              <div className="mt-2 space-y-2">
                {headlineOptionen.map((h) => (
                  <button key={h} type="button" onClick={() => set("headline", h)}
                    className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm", stand.headline === h ? "border-2 border-vr-blue font-bold" : "border-vr-border-blue")}>
                    <span className={cn("size-5 shrink-0 rounded-full border-2", stand.headline === h ? "border-[6px] border-vr-blue" : "border-foreground/40")} />
                    {resolveTokens(h, f)}
                  </button>
                ))}
              </div>
            </div>
            <Feld label="Headline bearbeiten" wert={stand.headline} max={typ.slots.headline} onChange={(v) => set("headline", v)}
              sichtbar={sichtbar("headline")} onSichtbar={() => umschalten("headline")} />
            <Feld label="Subline" wert={stand.subline} max={typ.slots.subline} onChange={(v) => set("subline", v)} mehrzeilig
              sichtbar={sichtbar("subline")} onSichtbar={() => umschalten("subline")} />
            <Feld label="Call-to-Action" wert={stand.cta} max={typ.slots.cta} onChange={(v) => set("cta", v)}
              sichtbar={sichtbar("cta")} onSichtbar={() => umschalten("cta")} />
            <p className="text-xs text-muted-foreground">
              Platzhalter wie <code>{"{{PREIS}}"}</code> oder <code>{"{{ORT}}"}</code> setzt das Partnerhub automatisch mit aktuellen Werten ein.
            </p>

            <div className="border-t pt-4">
              <h3 className="text-sm">Regionaler Bezug</h3>
              <Select value={stand.bezugFilialeId} onValueChange={(v) => set("bezugFilialeId", v)}>
                <SelectTrigger className="mt-2 h-11 w-full"><MapPin className="text-vr-blue" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  {daten.filialen.map((fl) => (
                    <SelectItem key={fl.id} value={fl.id}>{fl.name}{istPlatzhalter(fl.strasse) ? "" : ` · ${fl.strasse}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="mt-3 flex items-center justify-between text-sm">
                Filialort im Motiv nennen <Switch checked={stand.ortImMotiv} onCheckedChange={(v) => set("ortImMotiv", v)} />
              </label>
            </div>
          </TabsContent>

          <TabsContent value="bild" className="space-y-4 p-5">
            <p className="text-sm text-foreground/80"><span className="font-bold text-vr-ultramarine">Bildidee:</span> {resolveTokens(daten.wm.bildidee, f) || "–"}</p>
            <div className="grid grid-cols-3 gap-3">
              {bilder.map((b) => (
                <button key={b.id} type="button" onClick={() => set("bildAssetId", b.id)} title={b.beschreibung}
                  className={cn("relative overflow-hidden rounded-xl border-2", stand.bildAssetId === b.id ? "border-vr-blue" : "border-transparent")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.datei} alt={b.beschreibung} className="aspect-[4/3] w-full object-cover" />
                  {b.herkunft !== "BIBLIOTHEK" && <Badge className="absolute top-1 left-1 bg-vr-ultramarine text-[10px]">KI</Badge>}
                  {stand.bildAssetId === b.id && <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-vr-blue text-white"><Check className="size-3" /></span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Bildmaterial: markierte Platzhalter-Fotos. Gemäß Markenrichtlinie sind echte Fotos der Standard.</p>
            <Button variant="outline" onClick={kiMotiv} disabled={motivLaedt} className="w-full">
              {motivLaedt ? <Loader2 className="animate-spin" /> : <Sparkles />} KI-Motiv aus Bildidee erzeugen (optional)
            </Button>
          </TabsContent>

          <TabsContent value="layout" className="space-y-3 p-5">
            {typ.vorlagen.map((key) => {
              const v = VORLAGEN[key];
              return (
                <button key={key} type="button" onClick={() => set("vorlage", key)}
                  className={cn("w-full rounded-xl border p-4 text-left", stand.vorlage === key ? "border-2 border-vr-ultramarine" : "border-vr-border-blue")}>
                  <span className="font-bold text-vr-ultramarine">{v.name}</span>
                  <p className="mt-1 text-sm text-foreground/75">{v.beschreibung}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{v.bausteine.map((b) => <span key={b} className="rounded bg-vr-muted px-1.5 py-0.5 text-[11px] text-vr-ultramarine">{b}</span>)}</div>
                </button>
              );
            })}

            {vorlageDef?.hintergrundWaehlbar && (
              <div className="border-t pt-4">
                <h3 className="text-sm">Hintergrund</h3>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {HINTERGRUENDE.map((h) => {
                    const bild = h.key === "bild" ? bilder.find((b) => b.id === stand.bildAssetId)?.datei : undefined;
                    return (
                      <button key={h.key} type="button" onClick={() => set("hintergrund", h.key)} aria-pressed={stand.hintergrund === h.key}
                        className="flex flex-col items-center gap-1 text-[11px] text-vr-ultramarine">
                        <span
                          className={cn("relative block aspect-square w-full overflow-hidden rounded-lg border-2", stand.hintergrund === h.key ? "border-vr-blue" : "border-vr-border-blue")}
                          style={{ background: bild ? `center / cover url("${bild}")` : h.farbe }}>
                          {stand.hintergrund === h.key && <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-vr-blue text-white"><Check className="size-3" /></span>}
                        </span>
                        {h.label}
                      </button>
                    );
                  })}
                </div>
                {stand.hintergrund === "bild" && (
                  <p className="mt-2 text-xs text-muted-foreground">Als Hintergrund dient das im Tab „Bild“ gewählte Foto.</p>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm">Elemente im Motiv</h3>
              <div className="mt-2 divide-y rounded-xl border border-vr-border-blue">
                {typ.elemente.map((k) => (
                  <label key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                    {ELEMENTE[k]} <Switch checked={sichtbar(k)} onCheckedChange={() => umschalten(k)} />
                  </label>
                ))}
                {daten.wm.typ === "social" && (
                  <label className="flex items-center justify-between px-3 py-2 text-sm">
                    Ortszeile <Switch checked={stand.ortImMotiv} onCheckedChange={(v) => set("ortImMotiv", v)} />
                  </label>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col rounded-3xl border border-vr-border-blue bg-white p-5">
          <div className="flex items-center">
            <div className="flex rounded-full border border-vr-border-blue p-1">
              {formate.map((k) => {
                const fd = formatDef(daten.wm.typ, k);
                return (
                  <button key={k} type="button" onClick={() => setVorschauFormat(k)}
                    className={cn("h-8 rounded-full px-4 text-sm font-bold", vorschauFormat === k ? "bg-vr-ultramarine text-white" : "text-vr-ultramarine")}>
                    {fd.px ? `${fd.label.split(" ")[0]} ${fd.verhaeltnis}` : fd.label}
                  </button>
                );
              })}
            </div>
            <span className="mx-auto flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-vr-success" /> Live-Vorschau</span>
            <div className="flex items-center gap-2 text-sm font-bold text-vr-ultramarine">
              <button type="button" aria-label="Verkleinern" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}><ZoomOut className="size-5" /></button>
              {Math.round(zoom * 100)} %
              <button type="button" aria-label="Vergrößern" onClick={() => setZoom((z) => Math.min(2, z + 0.25))}><ZoomIn className="size-5" /></button>
            </div>
          </div>
          <div className="mt-4 flex min-h-[520px] flex-1 items-center justify-center overflow-auto rounded-2xl bg-vr-muted p-8">
            <MotivVorschau model={model} maxBreite={420 * zoom} maxHoehe={480 * zoom} className="shadow-[0_4px_15px_rgba(0,0,0,.15)]" />
          </div>
        </div>
      </section>

      <FooterBar
        zurueck={`/marketing/werbemittel/${daten.wm.id}/vorschlag`}
        gespeichertAm={gespeichertAm}
        primaer={
          <Button variant="cta" size="lg" onClick={weiter} disabled={zuLang || pending}>
            Weiter: Prüfen & Export <ArrowRight />
          </Button>
        }
      />
    </>
  );
}

function Feld(props: {
  label: string; wert: string; max: number; onChange: (v: string) => void; mehrzeilig?: boolean;
  sichtbar: boolean; onSichtbar: () => void;
}) {
  const id = props.label.replace(/\W/g, "");
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-bold text-vr-ultramarine">{props.label}</label>
        <button type="button" onClick={props.onSichtbar} aria-pressed={!props.sichtbar}
          className="flex items-center gap-1 text-xs font-bold text-vr-blue">
          {props.sichtbar ? <><Eye className="size-3.5" /> Sichtbar</> : <><EyeOff className="size-3.5" /> Ausgeblendet</>}
        </button>
      </div>
      <div className={cn("relative mt-2", !props.sichtbar && "opacity-50")}>
        {props.mehrzeilig ? (
          <Textarea id={id} value={props.wert} onChange={(e) => props.onChange(e.target.value)} rows={3} className="pr-16" aria-invalid={props.wert.length > props.max} />
        ) : (
          <Input id={id} value={props.wert} onChange={(e) => props.onChange(e.target.value)} className="h-11 pr-16" aria-invalid={props.wert.length > props.max} />
        )}
        <span className="absolute right-3 bottom-2.5"><Zaehler wert={props.wert} max={props.max} /></span>
      </div>
    </div>
  );
}
