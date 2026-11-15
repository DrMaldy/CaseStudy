import type { CSSProperties } from "react";
import type { RenderModel } from "@/lib/werbemittel/render-model";
import { Bild, C, FONT, LogoLockup } from "./shared";

/* Print-Typografie: Gliederung über Haarlinien, Versal-Labels und Weißraum – keine Flächen,
   Rundungen oder Pillen, die auf Papier wie anklickbare Bedienelemente wirken. */
const RAND = 34; // ≈ 9 mm Satzspiegel-Rand
const LINIE = "#C9D3E0";
const label: CSSProperties = { fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: C.blau };

function Haken() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden>
      <path d="M1.5 6.5 4.5 9.5 10.5 2.5" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

/** DIN A5 hoch (559 × 794 CSS-px = 148 × 210 mm). */
export function FlyerStandard({ m }: { m: RenderModel }) {
  const preisBetrag = m.preis.split("/")[0];
  const v = m.sichtbar;
  const fussnote = [v.tarif && m.tarifZeile, v.pflicht && m.pflichtangaben].filter(Boolean).join(" · ");
  const stern = v.preis && fussnote ? "*" : "";
  const trenner = m.mitgliederVorteil.indexOf(": ");
  const mitgliederLabel = trenner > 0 ? m.mitgliederVorteil.slice(0, trenner) : "Mitgliedervorteil";
  const mitgliederText = trenner > 0 ? m.mitgliederVorteil.slice(trenner + 2) : m.mitgliederVorteil;
  const fussleiste = v.logo || v.filiale;

  return (
    <div style={{ width: m.breite, height: m.hoehe, boxSizing: "border-box", background: "#fff", color: C.text, fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Bild randabfallend, ohne Rundung */}
      <Bild src={m.bildSrc} style={{ height: 276 }} />
      <div style={{ height: 5, background: C.orange, flexShrink: 0 }} />

      <div style={{ padding: `24px ${RAND}px 0` }}>
        {v.headline && <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, color: C.ultramarin, letterSpacing: "-0.005em", textWrap: "balance" }}>{m.headline}</div>}
        {v.subline && m.subline && <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 10, color: "#313131", textWrap: "pretty" }}>{m.subline}</div>}

        {(v.fakten || v.preis) && (
          <div style={{ display: "flex", gap: 22, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${LINIE}` }}>
            {v.fakten && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={label}>Ihre Vorteile</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 14, rowGap: 5, marginTop: 8 }}>
                  {m.fakten.map((f) => (
                    <div key={f} style={{ display: "flex", gap: 6, fontSize: 12.5, lineHeight: 1.3, color: C.ultramarin }}>
                      <Haken />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {v.preis && (
              <div style={{ flexShrink: 0, paddingLeft: v.fakten ? 22 : 0, borderLeft: v.fakten ? `1px solid ${LINIE}` : "none", color: C.ultramarin }}>
                <div style={label}>Monatlich nur</div>
                <div style={{ display: "flex", alignItems: "flex-start", marginTop: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em" }}>{preisBetrag}</span>
                  {stern && <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, marginLeft: 1 }}>{stern}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {v.mitglieder && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINIE}`, fontSize: 12, lineHeight: 1.45, color: C.ultramarin }}>
            <span style={{ fontWeight: 700, color: C.orange }}>{mitgliederLabel}: </span>
            {mitgliederText}
          </div>
        )}

        {v.cta && m.cta && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
            <span style={{ width: 22, height: 2, background: C.orange, flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: C.ultramarin }}>{m.cta}</span>
          </div>
        )}
      </div>

      {fussnote && (
        <div style={{ marginTop: "auto", padding: `14px ${RAND}px 10px`, fontSize: 7.5, lineHeight: 1.4, color: "#5B6573" }}>
          {stern}
          {fussnote}
        </div>
      )}

      {fussleiste && (
        <div style={{ marginTop: fussnote ? 0 : "auto", flexShrink: 0, background: C.ultramarin, color: "#fff", padding: `16px ${RAND}px 15px` }}>
          {v.logo && <LogoLockup logoSrc={m.logoSrc} name={m.bankName} hell signetHoehe={24} schrift={13.5} />}
          {v.filiale && (
            <div style={{ display: "flex", gap: 18, fontSize: 10, lineHeight: 1.4, marginTop: v.logo ? 12 : 0, paddingTop: v.logo ? 11 : 0, borderTop: v.logo ? "1px solid rgba(255,255,255,0.28)" : "none" }}>
              <div style={{ flex: 1.15 }}>
                <div style={{ fontWeight: 700 }}>{m.filiale.name}</div>
                <div>{m.filiale.adresse}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>Öffnungszeiten</div>
                <div>{m.filiale.oeffnungszeiten}</div>
              </div>
              <div style={{ flex: 0.7 }}>
                <div style={{ fontWeight: 700 }}>Telefon</div>
                <div>{m.filiale.telefon}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
