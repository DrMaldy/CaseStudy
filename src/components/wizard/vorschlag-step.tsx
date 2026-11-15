"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Circle, ImageIcon, Info, Loader2, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ARGUMENTE, TYPEN, ZIELGRUPPEN } from "@/lib/werbemittel/config";
import { fakten, resolveTokens } from "@/lib/werbemittel/tokens";
import type { WizardDaten } from "@/lib/werbemittel/daten";
import type { KiVorschlag } from "@/lib/ai/schema";
import { generiereVorschlaege, uebernehmeVorschlag } from "@/actions/werbemittel";
import { MotivVorschau, modelAusDaten } from "@/components/werbemittel/motiv-vorschau";
import { cn } from "@/lib/utils";
import { FooterBar } from "./footer-bar";

export function VorschlagStep({ daten }: { daten: WizardDaten }) {
  const router = useRouter();
  const [vorschlaege, setVorschlaege] = useState<KiVorschlag[] | null>(daten.wm.vorschlaege);
  const [gewaehlt, setGewaehlt] = useState(daten.wm.gewaehlterVorschlag ?? 0);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState<"alle" | number | null>(null);
  const [seed, setSeed] = useState(0);
  const [pending, start] = useTransition();
  const gestartet = useRef(false);

  const zg = ZIELGRUPPEN.find((z) => z.key === daten.wm.zielgruppe)!;
  const filiale = daten.filialen.find((f) => f.id === daten.wm.bezugFilialeId)!;
  const f = fakten({ angebot: daten.angebot, bank: daten.bank, filiale });

  async function generiere(opts: { neu?: boolean; aehnlichZu?: number } = {}) {
    const naechsterSeed = opts.neu || opts.aehnlichZu !== undefined ? seed + 1 : seed;
    setSeed(naechsterSeed);
    setFehler(null);
    setLaedt(opts.aehnlichZu ?? "alle");
    const res = await generiereVorschlaege({ id: daten.wm.id, seed: naechsterSeed, aehnlichZu: opts.aehnlichZu });
    setLaedt(null);
    if (!res.ok) return setFehler(res.fehler);
    setVorschlaege(res.vorschlaege);
    setGewaehlt(res.gewaehlt);
  }

  useEffect(() => {
    if (!vorschlaege && !gestartet.current) {
      gestartet.current = true;
      void generiere();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weiter = () =>
    start(async () => {
      await uebernehmeVorschlag({ id: daten.wm.id, index: gewaehlt });
      router.push(`/marketing/werbemittel/${daten.wm.id}/gestalten`);
    });

  const grundlage = [TYPEN[daten.wm.typ].label, zg.label, ...ARGUMENTE.filter((a) => daten.wm.argumente.includes(a.key)).map((a) => resolveTokens(a.label, f)), daten.wm.anrede === "DU" ? "Du" : "Sie"];

  return (
    <>
      <section className="mx-auto w-full max-w-[1200px] px-4 py-8">
        {laedt === "alle" && !vorschlaege ? (
          <Generierung zielgruppe={zg.label} bank={daten.bank.name} tarif={daten.angebot.name} />
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[22px]">Drei Vorschläge für {zg.label}</h2>
                <p className="mt-1 text-[15px] text-foreground/80">Wählen Sie einen Vorschlag. Im nächsten Schritt passen Sie Text, Bild und Region an.</p>
              </div>
              <Button variant="outline" size="lg" onClick={() => generiere({ neu: true })} disabled={laedt !== null}>
                {laedt === "alle" ? <Loader2 className="animate-spin" /> : <Sparkles />} Neu generieren
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-foreground/80">Grundlage:</span>
              {grundlage.map((g) => <span key={g} className="rounded-md bg-vr-muted px-3 py-1 text-vr-ultramarine">{g}</span>)}
              <Link href={`/marketing/werbemittel/${daten.wm.id}/zielgruppe`} className="ml-1 inline-flex items-center gap-1 font-bold text-vr-blue"><Pencil className="size-3.5" /> Angaben ändern</Link>
            </div>
          </>
        )}

        {fehler && (
          <Alert variant="destructive" className="mt-6 bg-white">
            <AlertTitle>Keine gültigen Vorschläge erhalten</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              {fehler}
              <Button variant="outline" onClick={() => generiere({ neu: true })}><RefreshCw /> Erneut versuchen</Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 grid grid-cols-3 gap-5">
          {(vorschlaege ?? [null, null, null]).map((v, i) =>
            !v || laedt === i ? (
              <div key={i} className="rounded-3xl border border-vr-border-blue bg-white p-4">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="mt-4 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ) : (
              <VorschlagKarte key={i} v={v} aktiv={gewaehlt === i} onWaehlen={() => setGewaehlt(i)} onAehnlich={() => generiere({ aehnlichZu: i })} sperre={laedt !== null}
                model={modelAusDaten(daten, { headline: v.headline, subline: v.subline, cta: v.cta, bildAssetId: daten.wm.bildAssetId ?? zg.standardBild })}
                text={(t) => resolveTokens(t, f)} buchstabe={String.fromCharCode(65 + i)} />
            ),
          )}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-foreground/70">
          <Info className="size-3.5" /> KI-generiert · Tarif- und Pflichtangaben setzt das Partnerhub automatisch ein. Bitte Inhalte vor der Veröffentlichung kurz gegenlesen.
        </p>
      </section>

      <FooterBar
        zurueck={`/marketing/werbemittel/${daten.wm.id}/zielgruppe`}
        gespeichertAm={daten.wm.updatedAt}
        primaer={
          <Button variant="cta" size="lg" onClick={weiter} disabled={pending || !vorschlaege || laedt !== null}>
            Weiter: Gestalten <ArrowRight />
          </Button>
        }
      />
    </>
  );
}

function VorschlagKarte(props: {
  v: KiVorschlag; aktiv: boolean; sperre: boolean; buchstabe: string;
  model: ReturnType<typeof modelAusDaten>; text: (t: string) => string;
  onWaehlen: () => void; onAehnlich: () => void;
}) {
  const { v } = props;
  return (
    <div className={cn("flex flex-col rounded-3xl border bg-white p-4", props.aktiv ? "border-2 border-vr-ultramarine" : "border-vr-border-blue")}>
      <button type="button" onClick={props.onWaehlen} className="flex h-44 items-center justify-center rounded-2xl bg-vr-muted">
        <MotivVorschau model={props.model} maxBreite={300} maxHoehe={160} />
      </button>
      <span className="mt-4 w-fit rounded-md bg-vr-muted px-2 py-1 text-xs font-bold text-vr-ultramarine">Vorschlag {props.buchstabe} · {v.ansatz}</span>
      <h3 className="mt-2 text-lg">{props.text(v.headline)}</h3>
      <p className="mt-1 text-sm text-foreground/80">{props.text(v.subline)}</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-vr-blue"><ArrowRight className="size-4" /> {props.text(v.cta)}</p>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-foreground/70"><ImageIcon className="mt-0.5 size-3.5 shrink-0" /> Bildidee: {props.text(v.bildidee)}</p>
      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <button type="button" onClick={props.onWaehlen} className="flex items-center gap-2 text-sm font-bold text-vr-ultramarine" aria-pressed={props.aktiv}>
          <span className={cn("size-5 rounded-full border-2", props.aktiv ? "border-[6px] border-vr-blue" : "border-foreground/40")} />
          {props.aktiv ? "Ausgewählt" : "Auswählen"}
        </button>
        <button type="button" onClick={props.onAehnlich} disabled={props.sperre} className="flex items-center gap-1.5 text-sm font-bold text-vr-blue disabled:opacity-50">
          <Sparkles className="size-4" /> Ähnliche Variante
        </button>
      </div>
    </div>
  );
}

function Generierung({ zielgruppe, bank, tarif }: { zielgruppe: string; bank: string; tarif: string }) {
  const schritte = [`Tarifdaten ${tarif} geladen`, `Bankprofil ${bank} übernommen`, `Texte für ${zielgruppe} formulieren …`, "Markenregeln & Pflichtangaben prüfen"];
  const [stand, setStand] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStand((s) => Math.min(s + 1, 3)), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-[72px] items-center justify-center rounded-full border border-vr-border-blue bg-white"><Sparkles className="size-7 text-vr-blue" /></span>
      <h2 className="mt-6 text-[26px]">Ihre Vorschläge werden erstellt …</h2>
      <p className="mt-3 text-[15px]">Die KI formuliert drei Varianten für {zielgruppe}. Das dauert meist 5–10 Sekunden.</p>
      <div className="mt-6 w-full max-w-xl rounded-2xl border border-vr-border-blue bg-white p-5 text-left">
        <div className="h-1.5 rounded-full bg-vr-muted"><div className="h-1.5 rounded-full bg-vr-blue transition-all" style={{ width: `${25 + stand * 20}%` }} /></div>
        <ul className="mt-4 space-y-3 text-sm">
          {schritte.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-2", i === stand ? "font-bold text-vr-ultramarine" : i < stand ? "text-vr-ultramarine" : "text-foreground/60")}>
              {i < stand ? <Check className="size-4 text-vr-success" /> : i === stand ? <Loader2 className="size-4 animate-spin text-vr-blue" /> : <Circle className="size-4" />}
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
