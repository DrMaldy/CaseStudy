import type { RenderModel } from "@/lib/werbemittel/render-model";
import { Bild, C, FONT, LogoLockup } from "./shared";

export function SocialFoto({ m }: { m: RenderModel }) {
  const s = m.breite / 1080;
  const v = m.sichtbar;
  return (
    <div style={{ width: m.breite, height: m.hoehe, boxSizing: "border-box", padding: 72 * s, background: C.ultramarin, color: "#fff", fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {v.logo && <LogoLockup logoSrc={m.logoSrc} name={m.bankName} hell signetHoehe={56 * s} schrift={38 * s} />}
      <Bild src={m.bildSrc} style={{ marginTop: v.logo ? 44 * s : 0, height: m.hoehe * 0.36, borderRadius: 24 * s }} />
      {v.headline && <div style={{ fontSize: 84 * s, fontWeight: 700, lineHeight: 1.08, marginTop: 48 * s, maxWidth: 920 * s }}>{m.headline}</div>}
      {v.subline && m.hoehe > m.breite && m.subline && (
        <div style={{ fontSize: 38 * s, lineHeight: 1.3, marginTop: 28 * s, opacity: 0.9 }}>{m.subline}</div>
      )}
      {(v.preis || (v.cta && m.cta)) && (
        <div style={{ display: "flex", alignItems: "center", gap: 32 * s, marginTop: 36 * s }}>
          {v.preis && <span style={{ background: C.orange, borderRadius: 9999, padding: `${14 * s}px ${36 * s}px`, fontSize: 42 * s, fontWeight: 700 }}>{m.preis}</span>}
          {v.cta && m.cta && <span style={{ fontSize: 34 * s, fontWeight: 700 }}>{m.cta} →</span>}
        </div>
      )}
      <div style={{ marginTop: "auto" }}>
        {m.ortZeile && <div style={{ fontSize: 28 * s, opacity: 0.85 }}>{m.ortZeile}</div>}
        {v.tarif && <div style={{ fontSize: 24 * s, marginTop: 10 * s, opacity: 0.75 }}>{m.tarifZeile}</div>}
        {v.pflicht && <div style={{ fontSize: 18 * s, marginTop: 6 * s, opacity: 0.6 }}>{m.pflichtangaben}</div>}
      </div>
    </div>
  );
}
