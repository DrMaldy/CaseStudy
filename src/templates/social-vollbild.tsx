import type { RenderModel } from "@/lib/werbemittel/render-model";
import { hintergrund } from "@/lib/werbemittel/config";
import { C, FONT, LogoLockup } from "./shared";

/**
 * Freier Hintergrund: Foto vollflächig oder eine Markenfarbe.
 * Auf dem Foto sorgt ein Ultramarin-Verlauf hinter dem Text für ausreichenden Kontrast.
 */
export function SocialVollbild({ m }: { m: RenderModel }) {
  const s = m.breite / 1080;
  const v = m.sichtbar;
  const hg = hintergrund(m.hintergrund);
  const foto = hg.key === "bild" && m.bildSrc;
  const schrift = hg.hell ? "#fff" : C.ultramarin;

  return (
    <div style={{ position: "relative", width: m.breite, height: m.hoehe, background: hg.farbe, color: schrift, fontFamily: FONT, overflow: "hidden" }}>
      {foto && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.bildSrc!} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,45,103,.55) 0%, rgba(0,45,103,0) 22%, rgba(0,45,103,0) 38%, rgba(0,45,103,.92) 78%)" }} />
        </>
      )}

      <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: 80 * s, display: "flex", flexDirection: "column" }}>
        {v.logo && <LogoLockup logoSrc={m.logoSrc} name={m.bankName} hell={hg.hell} signetHoehe={58 * s} schrift={38 * s} />}

        <div style={{ marginTop: "auto" }}>
          {v.headline && <div style={{ fontSize: 96 * s, fontWeight: 700, lineHeight: 1.06, maxWidth: 920 * s }}>{m.headline}</div>}
          {v.subline && m.subline && <div style={{ fontSize: 38 * s, lineHeight: 1.3, marginTop: 28 * s, opacity: 0.92, maxWidth: 880 * s }}>{m.subline}</div>}
          {(v.preis || (v.cta && m.cta)) && (
            <div style={{ display: "flex", alignItems: "center", gap: 32 * s, marginTop: 40 * s }}>
              {v.preis && <span style={{ background: C.orange, color: "#fff", borderRadius: 9999, padding: `${14 * s}px ${36 * s}px`, fontSize: 42 * s, fontWeight: 700 }}>{m.preis}</span>}
              {v.cta && m.cta && <span style={{ fontSize: 34 * s, fontWeight: 700 }}>{m.cta} →</span>}
            </div>
          )}
          {m.ortZeile && <div style={{ fontSize: 28 * s, marginTop: 36 * s, opacity: 0.88 }}>{m.ortZeile}</div>}
          {v.tarif && <div style={{ fontSize: 24 * s, marginTop: 10 * s, opacity: 0.78 }}>{m.tarifZeile}</div>}
          {v.pflicht && <div style={{ fontSize: 18 * s, marginTop: 6 * s, opacity: 0.65 }}>{m.pflichtangaben}</div>}
        </div>
      </div>
    </div>
  );
}
