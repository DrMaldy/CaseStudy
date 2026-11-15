import { WerbemittelMotiv } from "@/templates";
import type { RenderModel } from "@/lib/werbemittel/render-model";
import type { WizardDaten } from "@/lib/werbemittel/daten";
import { buildRenderModel } from "@/lib/werbemittel/render-model";

/** Skaliert das Original-Motiv (z. B. 1080 px) per CSS in den verfügbaren Platz – echtes WYSIWYG. */
export function MotivVorschau({ model, maxBreite, maxHoehe, className }: { model: RenderModel; maxBreite: number; maxHoehe: number; className?: string }) {
  const scale = Math.min(maxBreite / model.breite, maxHoehe / model.hoehe);
  return (
    <div className={className} style={{ width: model.breite * scale, height: model.hoehe * scale, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ width: model.breite, height: model.hoehe, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <WerbemittelMotiv model={model} />
      </div>
    </div>
  );
}

type Felder = Partial<Pick<WizardDaten["wm"], "headline" | "subline" | "cta" | "vorlage" | "ortImMotiv" | "bildAssetId" | "bezugFilialeId" | "ausgeblendet" | "hintergrund">>;

/** Baut das Render-Model aus den Wizard-Daten plus lokalen (noch ungespeicherten) Änderungen. */
export function modelAusDaten(d: WizardDaten, overrides: Felder = {}, formatKey?: string) {
  const wm = { ...d.wm, ...overrides };
  const filiale = d.filialen.find((f) => f.id === wm.bezugFilialeId) ?? d.filialen[0];
  const bild = d.bilder.find((b) => b.id === wm.bildAssetId) ?? null;
  return buildRenderModel({ wm: { ...wm, bildAsset: bild }, formatKey, bank: d.bank, filiale, angebot: d.angebot });
}
