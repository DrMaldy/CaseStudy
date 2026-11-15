"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Check, GraduationCap, Heart, Info, Smile, Sparkles, Star, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARGUMENTE, MAX_ARGUMENTE, TYPEN, ZIELGRUPPEN, formatDef, type Anrede, type ArgumentKey, type ZielgruppeKey } from "@/lib/werbemittel/config";
import { fakten, resolveTokens } from "@/lib/werbemittel/tokens";
import type { WizardDaten } from "@/lib/werbemittel/daten";
import { speichereZielgruppe } from "@/actions/werbemittel";
import { RegionalPromptDialog } from "@/components/filiale/regional-prompt-dialog";
import { cn } from "@/lib/utils";
import { FooterBar } from "./footer-bar";

const ICONS = { "graduation-cap": GraduationCap, heart: Heart, briefcase: Briefcase, star: Star, smile: Smile, sun: Sun };

function Nummer({ n }: { n: number }) {
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-vr-ultramarine text-sm font-bold text-white">{n}</span>;
}

export function ZielgruppeStep({ daten }: { daten: WizardDaten }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [zg, setZg] = useState<ZielgruppeKey | null>((daten.wm.zielgruppe as ZielgruppeKey) ?? null);
  const [argumente, setArgumente] = useState<ArgumentKey[]>(daten.wm.argumente as ArgumentKey[]);
  const [anrede, setAnrede] = useState<Anrede>(daten.wm.anrede);

  const filiale = daten.filialen.find((f) => f.id === daten.wm.bezugFilialeId)!;
  const f = fakten({ angebot: daten.angebot, bank: daten.bank, filiale });
  const label = (key: ArgumentKey) => resolveTokens(ARGUMENTE.find((a) => a.key === key)!.label, f);
  const typ = TYPEN[daten.wm.typ];
  const format = formatDef(daten.wm.typ, daten.wm.format);

  function waehleZielgruppe(key: ZielgruppeKey) {
    setZg(key);
    setArgumente(ZIELGRUPPEN.find((z) => z.key === key)!.empfohleneArgumente);
  }
  function toggleArgument(key: ArgumentKey) {
    setArgumente((a) => (a.includes(key) ? a.filter((k) => k !== key) : a.length < MAX_ARGUMENTE ? [...a, key] : [a[1], key]));
  }

  const weiter = () =>
    start(async () => {
      if (!zg) return;
      await speichereZielgruppe({ id: daten.wm.id, zielgruppe: zg, argumente, anrede });
      router.push(`/marketing/werbemittel/${daten.wm.id}/vorschlag`);
    });

  return (
    <>
      <section className="mx-auto grid w-full max-w-[1200px] grid-cols-[1fr_400px] gap-6 px-4 py-8">
        <div className="rounded-3xl border border-vr-border-blue bg-white p-6">
          <div className="flex gap-3">
            <Nummer n={1} />
            <div>
              <h2 className="text-lg">Wen möchten Sie ansprechen?</h2>
              <p className="text-sm text-foreground/75">Die Zielgruppe bestimmt Tonalität, Argumente und Bildwelt des Werbemittels.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {ZIELGRUPPEN.map((z) => {
              const Icon = ICONS[z.icon];
              const aktiv = z.key === zg;
              return (
                <button key={z.key} type="button" onClick={() => waehleZielgruppe(z.key)} aria-pressed={aktiv}
                  className={cn("relative flex items-center gap-3 rounded-xl border p-4 text-left", aktiv ? "border-2 border-vr-ultramarine" : "border-vr-border-blue hover:border-vr-blue")}>
                  {aktiv && <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-vr-blue text-white"><Check className="size-4" /></span>}
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-vr-lightblue"><Icon className="size-5 text-vr-blue" /></span>
                  <span className="leading-tight">
                    <span className="block font-bold text-vr-ultramarine">{z.label}</span>
                    <span className="text-sm text-foreground/75">{z.beschreibung}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <Nummer n={2} />
            <div>
              <h2 className="text-lg">Was soll im Mittelpunkt stehen?</h2>
              <p className="text-sm text-foreground/75">Wählen Sie bis zu zwei Argumente. Je Zielgruppe ist eine Empfehlung vorausgewählt.</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ARGUMENTE.map((a) => {
              const aktiv = argumente.includes(a.key);
              return (
                <button key={a.key} type="button" onClick={() => toggleArgument(a.key)} aria-pressed={aktiv}
                  className={cn("flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-bold", aktiv ? "border-vr-ultramarine bg-vr-ultramarine text-white" : "border-vr-border-blue text-vr-ultramarine")}>
                  {aktiv && <Check className="size-4" />} {label(a.key)}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3">
            <Nummer n={3} />
            <div className="flex-1">
              <h2 className="text-lg">Wie möchten Sie ansprechen?</h2>
              <p className="text-sm text-foreground/75">Empfohlen für Social Media und junge Zielgruppen: „Du“. Für Flyer in der Filiale eher „Sie“.</p>
            </div>
            <div className="flex rounded-full border border-vr-border-blue p-1">
              {(["DU", "SIE"] as const).map((a) => (
                <button key={a} type="button" onClick={() => setAnrede(a)} aria-pressed={anrede === a}
                  className={cn("h-9 rounded-full px-5 text-sm font-bold", anrede === a ? "bg-vr-ultramarine text-white" : "text-vr-ultramarine")}>
                  {a === "DU" ? "Du" : "Sie"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col rounded-3xl border border-vr-border-blue bg-white p-6">
          <h2 className="flex items-center gap-2 text-base text-vr-blue"><Sparkles className="size-4" /> Bereit für Ihren Vorschlag</h2>
          <p className="mt-2 text-sm text-foreground/80">Auf Basis Ihrer Angaben erstellt die KI drei Vorschläge – jeweils mit Headline, Text, Handlungsaufforderung und Bildidee.</p>
          <dl className="mt-4 space-y-3 rounded-2xl bg-vr-lightblue p-4 text-sm">
            <div><dt className="text-xs font-bold text-foreground/70">Format</dt><dd className="font-bold text-vr-ultramarine">{typ.label} · {format.verhaeltnis}{daten.wm.storyVariante ? " + Story 9:16" : ""}</dd></div>
            <div><dt className="text-xs font-bold text-foreground/70">Zielgruppe</dt><dd className="font-bold text-vr-ultramarine">{ZIELGRUPPEN.find((z) => z.key === zg)?.label ?? "–"}</dd></div>
            <div><dt className="text-xs font-bold text-foreground/70">Argumente</dt><dd className="font-bold text-vr-ultramarine">{argumente.map(label).join(" · ") || "–"}</dd></div>
            <div><dt className="text-xs font-bold text-foreground/70">Ansprache</dt><dd className="font-bold text-vr-ultramarine">{anrede === "DU" ? "Du" : "Sie"}</dd></div>
          </dl>
          <h3 className="mt-5 text-sm">Außerdem berücksichtigt</h3>
          <ul className="mt-2 space-y-2 text-sm text-vr-ultramarine">
            {["Tarifdaten " + daten.angebot.name, "Bankprofil, Filialen & Region", "Markenregeln der Volksbanken Raiffeisenbanken", "Pflichtangaben zu Preis & Vertrag"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="size-4 text-vr-success" /> {t}</li>
            ))}
            <li className="flex items-start gap-2">
              <Check className={cn("mt-0.5 size-4", filiale.regionalPrompt ? "text-vr-success" : "text-foreground/30")} />
              <span>
                Regionaler Prompt · {filiale.name}{" "}
                <RegionalPromptDialog
                  filialeId={filiale.id}
                  filialeName={filiale.name}
                  wert={filiale.regionalPrompt}
                  bearbeitbar={daten.istSuperuser || filiale.id === daten.eigeneFilialeId}
                  trigger={<button type="button" className="font-bold text-vr-blue underline-offset-2 hover:underline">{filiale.regionalPrompt ? "ansehen" : "hinzufügen"}</button>}
                />
                {filiale.regionalPrompt && <span className="mt-0.5 line-clamp-2 block text-xs text-foreground/70">„{filiale.regionalPrompt}“</span>}
              </span>
            </li>
          </ul>
          <p className="mt-auto flex items-center gap-2 pt-6 text-xs text-foreground/70"><Info className="size-3.5" /> Jeder Vorschlag lässt sich danach frei bearbeiten.</p>
        </aside>
      </section>

      <FooterBar
        zurueck={`/marketing/werbemittel/${daten.wm.id}/format`}
        gespeichertAm={daten.wm.updatedAt}
        primaer={
          <Button variant="cta" size="lg" onClick={weiter} disabled={pending || !zg}>
            Vorschlag generieren <Sparkles />
          </Button>
        }
      />
    </>
  );
}
