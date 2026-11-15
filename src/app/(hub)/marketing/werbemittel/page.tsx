import Link from "next/link";
import { ArrowRight, Check, Download, Landmark, FileText, Image as ImageIcon, Mail, File, Pencil, Plus, Smartphone, Sparkles, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KOMMENDE_TYPEN, SCHRITTE, TYPEN, formatDef, istPlatzhalter, zielgruppe, type WerbemittelTyp } from "@/lib/werbemittel/config";
import { buildRenderModel, parseAusgeblendet } from "@/lib/werbemittel/render-model";
import { formatEuro } from "@/lib/werbemittel/tokens";
import { MotivVorschau } from "@/components/werbemittel/motiv-vorschau";
import { RegionalPromptDialog } from "@/components/filiale/regional-prompt-dialog";
import { VrSignet } from "@/components/brand/vr-signet";
import { erstelleWerbemittel } from "@/actions/werbemittel";
import { LoeschenButton } from "@/components/werbemittel/loeschen-button";
import { cn } from "@/lib/utils";

const TYP_ICONS = { image: ImageIcon, "file-text": FileText, mail: Mail, file: File, smartphone: Smartphone };

export default async function WerbemittelUebersicht({ searchParams }: { searchParams: Promise<{ typ?: string }> }) {
  const { typ: filter } = await searchParams;
  const user = await requireUser();
  const bank = user.filiale.bank;
  const [angebot, alle] = await Promise.all([
    db.angebot.findFirstOrThrow(),
    db.werbemittel.findMany({
      // Superuser sehen alle Werbemittel der gewählten Bank, Filialnutzer nur die ihrer Filiale.
      where: user.istSuperuser ? { filiale: { bankId: bank.id } } : { filialeId: user.filialeId },
      include: { bildAsset: true, bezugFiliale: true, filiale: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const liste = filter ? alle.filter((w) => w.typ === filter) : alle;
  const profil = [
    { label: "Logo", ok: true }, { label: "Bankname", ok: true },
    { label: "Orte & Filialen", ok: !bank.filialen.some((f) => istPlatzhalter(f.strasse)) },
    { label: "Kontakt & Website", ok: !istPlatzhalter(bank.website) },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-16">
      <p className="text-xs text-foreground/70">Lokales Marketing / <span className="font-bold text-vr-ultramarine">Werbemittel</span></p>
      <div className="mt-4 flex items-end justify-between gap-8">
        <div>
          <h1 className="text-[32px]">Werbemittel</h1>
          <p className="mt-2 max-w-xl text-[15px] text-foreground/80">
            Erstellen Sie fertige Marketing-Unterlagen für VR Mobilfunk – automatisch mit Logo, Namen und Ort Ihrer Bank. Ohne eigene Kreation, sofort druck- und postfertig.
          </p>
        </div>
        <form action={erstelleWerbemittel}>
          <Button variant="cta" size="lg" type="submit"><Plus /> Neues Werbemittel erstellen</Button>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-[1fr_520px] gap-5">
        <div className="grid grid-cols-[1fr_220px] gap-5 rounded-3xl bg-white p-6">
          <div>
            <p className="text-xs font-bold text-vr-blue">Aktuell beworbenes Angebot</p>
            <h2 className="mt-2 text-xl">{angebot.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[`${angebot.datenvolumenGb} GB`, angebot.netz, angebot.roaming, "Monatlich kündbar"].map((c) => (
                <span key={c} className="rounded-md bg-vr-muted px-2.5 py-1.5 text-sm font-bold text-vr-ultramarine">{c}</span>
              ))}
            </div>
            <p className="mt-3 rounded-md bg-vr-orange-07 p-2.5 text-xs text-vr-ultramarine">
              <b>Mitgliedervorteil:</b> +{angebot.mitgliederBonusGb} GB Datenvolumen – insgesamt {angebot.datenvolumenGb + angebot.mitgliederBonusGb} GB für Mitglieder
            </p>
            <p className="mt-3 text-xs text-foreground/70">Tarifdaten, Preisangaben und Pflichthinweise werden automatisch in jedes Werbemittel übernommen.</p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-vr-lightblue p-5">
            <span className="text-4xl font-bold text-vr-ultramarine">{formatEuro(angebot.preisMonat)}</span>
            <span className="text-sm">pro Monat</span>
            <span className="mt-4 text-xs text-foreground/70">Abschluss {angebot.abschluss}</span>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-vr-blue">{user.istSuperuser ? "Gewählte Bank (Superuser)" : "Ihr Bankprofil"}</p>
            <Badge className="bg-vr-success-bg text-vr-success">Seed-Daten</Badge>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <VrSignet className="h-10" />
            <div>
              <p className="font-bold text-vr-ultramarine">{bank.name}</p>
              <p className="text-xs text-foreground/70">{user.filiale.name} · {bank.region}</p>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-vr-ultramarine">
            {profil.map((p) => (
              <li key={p.label} className="flex items-center gap-2">
                <span className={cn("flex size-4 items-center justify-center rounded-full", p.ok ? "bg-vr-success-bg" : "bg-vr-muted")}><Check className={cn("size-3", p.ok ? "text-vr-success" : "text-foreground/30")} /></span>
                {p.label}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className={cn("flex size-4 items-center justify-center rounded-full", user.filiale.regionalPrompt ? "bg-vr-success-bg" : "bg-vr-muted")}><Check className={cn("size-3", user.filiale.regionalPrompt ? "text-vr-success" : "text-foreground/30")} /></span>
              <RegionalPromptDialog filialeId={user.filialeId} filialeName={user.filiale.name} wert={user.filiale.regionalPrompt} bearbeitbar
                trigger={<button type="button" className="underline-offset-2 hover:underline">Prompt</button>} />
            </li>
          </ul>
          <p className="mt-auto pt-3 text-xs text-foreground/60">Stammdaten werden zentral gepflegt ({bank.quelle}).</p>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div>
          <h2 className="text-[22px]">Womit möchten Sie starten?</h2>
          <p className="text-sm text-foreground/80">Wählen Sie ein Format – Texte und Motive passen sich an die gewünschte Zielgruppe an.</p>
        </div>
        <span className="flex items-center gap-2 rounded-md border border-vr-border-blue bg-white px-3 py-1.5 text-xs text-vr-ultramarine"><Sparkles className="size-3.5 text-vr-blue" /> Texte werden pro Zielgruppe automatisch formuliert</span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-4">
        {Object.values(TYPEN).map((t) => {
          const Icon = TYP_ICONS[t.icon];
          return (
            <form key={t.key} action={erstelleWerbemittel} className="flex flex-col rounded-2xl bg-white p-4">
              <input type="hidden" name="typ" value={t.key} />
              <span className="flex size-10 items-center justify-center rounded-full bg-vr-lightblue"><Icon className="size-5 text-vr-blue" /></span>
              <p className="mt-4 font-bold text-vr-ultramarine">{t.label}</p>
              <p className="text-xs text-foreground/70">{t.formate.map((f) => f.verhaeltnis).join(" · ")} · {t.export.join(" / ").toUpperCase()}</p>
              <button type="submit" className="mt-8 flex items-center gap-1 text-sm font-bold text-vr-blue">Erstellen <ArrowRight className="size-4" /></button>
            </form>
          );
        })}
        {KOMMENDE_TYPEN.map((t) => {
          const Icon = TYP_ICONS[t.icon];
          return (
            <div key={t.label} aria-disabled className="flex flex-col rounded-2xl bg-white/60 p-4">
              <div className="flex justify-between"><span className="flex size-10 items-center justify-center rounded-full bg-vr-lightblue"><Icon className="size-5 text-vr-blue/60" /></span><Badge variant="secondary">Demnächst</Badge></div>
              <p className="mt-4 font-bold text-vr-ultramarine/70">{t.label}</p>
              <p className="text-xs text-foreground/60">{t.meta}</p>
            </div>
          );
        })}
      </div>

      <h2 className="mt-12 text-[22px]">Meine Werbemittel</h2>
      <p className="text-sm text-foreground/80">{alle.length} Werbemittel · {alle.filter((w) => w.status === "EXPORTIERT").length} exportiert · {alle.filter((w) => w.status !== "EXPORTIERT").length} Entwürfe</p>
      <div className="mt-4 flex gap-2">
        {[{ key: undefined, label: "Alle", n: alle.length }, ...Object.values(TYPEN).map((t) => ({ key: t.key, label: t.label, n: alle.filter((w) => w.typ === t.key).length }))].map((c) => (
          <Link key={c.label} href={c.key ? `?typ=${c.key}` : "?"}
            className={cn("rounded-full border px-4 py-1.5 text-sm font-bold", filter === c.key ? "border-vr-ultramarine bg-vr-ultramarine text-white" : "border-vr-border-blue bg-white text-vr-ultramarine")}>
            {c.label} <span className="ml-1 font-normal opacity-70">{c.n}</span>
          </Link>
        ))}
      </div>

      {liste.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-foreground/70">Noch keine Werbemittel. Starten Sie oben mit einem Format.</p>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-5">
          {liste.map((w) => {
            const typ = w.typ as WerbemittelTyp;
            const model = buildRenderModel({ wm: { ...w, ausgeblendet: parseAusgeblendet(w.ausgeblendet) }, bank, filiale: w.bezugFiliale, angebot });
            const fd = formatDef(typ, w.format);
            const exportiert = w.status === "EXPORTIERT";
            const ziel = w.headline ? (exportiert ? "export" : SCHRITTE[Math.min(w.schritt, 5) - 1].key) : SCHRITTE[Math.min(w.schritt, 3) - 1].key;
            return (
              <article key={w.id} className="overflow-hidden rounded-3xl bg-white">
                <div className="flex h-44 items-center justify-center bg-vr-muted">
                  {w.headline ? <MotivVorschau model={model} maxBreite={220} maxHoehe={150} className="shadow" /> : <span className="text-sm text-foreground/50">Noch ohne Inhalt</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 rounded-md bg-vr-muted px-2 py-1 text-xs font-bold text-vr-ultramarine">{TYPEN[typ].label}</span>
                    <Badge className={exportiert ? "bg-vr-success-bg text-vr-success" : "bg-vr-muted text-vr-ultramarine"}>{exportiert ? <><Check /> Exportiert</> : "Entwurf"}</Badge>
                  </div>
                  <h3 className="mt-3 text-[17px]">{w.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/70"><Users className="size-3.5" /> Zielgruppe: {zielgruppe(w.zielgruppe)?.label ?? "–"}</p>
                  {user.istSuperuser && <p className="flex items-center gap-1.5 text-xs text-foreground/70"><Landmark className="size-3.5" /> {w.filiale.name}</p>}
                  <p className="text-xs text-foreground/70">{fd.px ? `${fd.px.w} × ${fd.px.h} px` : fd.label} · {w.updatedAt.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</p>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <Button variant="outline" asChild><Link href={`/marketing/werbemittel/${w.id}/${ziel}`}><Pencil /> Bearbeiten</Link></Button>
                    <div className="flex gap-2">
                      {exportiert && (
                        <Button variant="outline" size="icon" asChild aria-label="Erneut herunterladen">
                          <a href={`/api/werbemittel/${w.id}/export`} download><Download /></a>
                        </Button>
                      )}
                      <LoeschenButton id={w.id} name={w.name} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
