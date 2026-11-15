import { notFound, redirect } from "next/navigation";
import { SCHRITTE, type SchrittKey } from "@/lib/werbemittel/config";
import { ladeWizardDaten } from "@/lib/werbemittel/daten";
import { WizardKopf } from "@/components/wizard/wizard-kopf";
import { FormatStep } from "@/components/wizard/format-step";
import { ZielgruppeStep } from "@/components/wizard/zielgruppe-step";
import { VorschlagStep } from "@/components/wizard/vorschlag-step";
import { GestaltenStep } from "@/components/wizard/gestalten-step";
import { ExportStep } from "@/components/wizard/export-step";

/** Höchster Schritt, der mit den vorhandenen Daten sinnvoll erreichbar ist. */
function erreichbarBis(d: Awaited<ReturnType<typeof ladeWizardDaten>>["wm"]) {
  if (!d.zielgruppe) return Math.min(d.schritt, 2);
  if (!d.headline) return Math.min(d.schritt, 3);
  return d.schritt;
}

export default async function WizardPage({ params }: { params: Promise<{ id: string; schritt: string }> }) {
  const { id, schritt } = await params;
  const index = SCHRITTE.findIndex((s) => s.key === schritt);
  if (index < 0) notFound();

  const daten = await ladeWizardDaten(id);
  const erreicht = erreichbarBis(daten.wm);
  if (index + 1 > erreicht) redirect(`/marketing/werbemittel/${id}/${SCHRITTE[erreicht - 1].key}`);

  const key = schritt as SchrittKey;
  return (
    <div className="flex flex-1 flex-col">
      <WizardKopf id={id} aktiv={key} erreicht={erreicht} />
      {key === "format" && <FormatStep daten={daten} />}
      {key === "zielgruppe" && <ZielgruppeStep daten={daten} />}
      {key === "vorschlag" && <VorschlagStep daten={daten} />}
      {key === "gestalten" && <GestaltenStep daten={daten} />}
      {key === "export" && <ExportStep daten={daten} />}
    </div>
  );
}
