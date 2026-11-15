import type { CSSProperties } from "react";

/* Vorlagen nutzen bewusst Inline-Styles: Dieselbe Komponente rendert Vorschau (Browser) und Export (Headless-Chromium). */
export const FONT = "var(--font-sans), 'Source Sans 3', 'Fira Sans', Helvetica, Arial, sans-serif";
export const C = {
  ultramarin: "#002D67",
  blau: "#0066B3",
  orange: "#FF6200",
  hellblau: "#F2F7FB",
  muted: "#EDF0F4",
  orange07: "#FFF5F1",
  text: "#121212",
};

export function LogoLockup(props: { logoSrc: string; name: string; hell?: boolean; signetHoehe: number; schrift: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: props.signetHoehe * 0.4 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.logoSrc} alt="" style={{ height: props.signetHoehe, width: "auto", display: "block" }} />
      <span style={{ fontSize: props.schrift, fontWeight: 700, lineHeight: 1.1, color: props.hell ? "#fff" : C.ultramarin }}>
        {props.name}
      </span>
    </div>
  );
}

export function Bild({ src, style }: { src: string | null; style: CSSProperties }) {
  return (
    <div style={{ overflow: "hidden", background: C.hellblau, flexShrink: 0, ...style }}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
    </div>
  );
}
