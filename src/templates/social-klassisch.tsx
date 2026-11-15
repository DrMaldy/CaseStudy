import type { RenderModel } from "@/lib/werbemittel/render-model";
import { C, FONT, LogoLockup } from "./shared";

export function SocialKlassisch({ m }: { m: RenderModel }) {
  const s = m.breite / 1080;
  const v = m.sichtbar;
  return (
    <div style={{ width: m.breite, height: m.hoehe, boxSizing: "border-box", padding: 88 * s, background: C.ultramarin, color: "#fff", fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Platz für das Logo bleibt reserviert, damit die Headline beim Ausblenden nicht springt. */}
      <div style={{ minHeight: 60 * s }}>{v.logo && <LogoLockup logoSrc={m.logoSrc} name={m.bankName} hell signetHoehe={60 * s} schrift={40 * s} />}</div>
      <div style={{ marginTop: (m.hoehe > m.breite ? 220 : 110) * s }}>
        {v.headline && <div style={{ fontSize: 104 * s, fontWeight: 700, lineHeight: 1.08, maxWidth: 900 * s }}>{m.headline}</div>}
        {v.subline && m.subline && <div style={{ fontSize: 40 * s, lineHeight: 1.3, marginTop: 32 * s, opacity: 0.9, maxWidth: 880 * s }}>{m.subline}</div>}
        {v.preis && (
          <div style={{ display: "inline-block", marginTop: 48 * s, background: C.orange, borderRadius: 9999, padding: `${16 * s}px ${40 * s}px`, fontSize: 46 * s, fontWeight: 700 }}>
            {m.preis}
          </div>
        )}
      </div>
      <div style={{ marginTop: "auto" }}>
        {v.cta && m.cta && <div style={{ fontSize: 38 * s, fontWeight: 700 }}>{m.cta} →</div>}
        {m.ortZeile && <div style={{ fontSize: 30 * s, marginTop: 12 * s, opacity: 0.85 }}>{m.ortZeile}</div>}
        {v.tarif && <div style={{ fontSize: 26 * s, marginTop: 20 * s, opacity: 0.75 }}>{m.tarifZeile}</div>}
        {v.pflicht && <div style={{ fontSize: 18 * s, marginTop: 8 * s, opacity: 0.6 }}>{m.pflichtangaben}</div>}
      </div>
    </div>
  );
}
