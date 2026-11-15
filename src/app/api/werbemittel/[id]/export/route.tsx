import { type NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDef, type Dateiformat } from "@/lib/werbemittel/config";
import { ladeExportDaten } from "@/lib/werbemittel/export-daten";
import { exportBereit } from "@/lib/werbemittel/checks";
import { alsDataUri, rendereDatei } from "@/lib/export/render";
import { WerbemittelMotiv } from "@/templates";

const MIME: Record<Dateiformat, string> = { png: "image/png", jpg: "image/jpeg", pdf: "application/pdf" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Nicht angemeldet", { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new Response("Nicht angemeldet", { status: 401 });

  const sp = request.nextUrl.searchParams;
  const daten = await ladeExportDaten(id, user.rolle === "SUPERUSER" ? null : user.filialeId, sp.get("format") ?? undefined, alsDataUri);
  // 404 auch für fremde Werbemittel – keine Existenz-Preisgabe.
  if (!daten) return new Response("Nicht gefunden", { status: 404 });

  const datei = (sp.get("datei") ?? daten.def.export[0]) as Dateiformat;
  if (!daten.def.export.includes(datei)) return new Response("Dateiformat nicht verfügbar", { status: 400 });
  if (!exportBereit(daten.pruefungen)) return Response.json({ fehler: "Prüfungen nicht bestanden", pruefungen: daten.pruefungen }, { status: 422 });

  const format = formatDef(daten.typ, sp.get("format") ?? daten.wm.format);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const html = renderToStaticMarkup(<WerbemittelMotiv model={daten.model} />);
  const buf = await rendereDatei({ html, breite: daten.model.breite, hoehe: daten.model.hoehe, datei, mm: format.mm });

  await db.$transaction([
    db.export.create({ data: { werbemittelId: id, dateiformat: datei, variante: format.key } }),
    db.werbemittel.update({ where: { id }, data: { status: "EXPORTIERT" } }),
  ]);

  const dateiname = `${daten.wm.name}-${format.key}`.toLowerCase().replace(/[^a-z0-9äöüß-]+/g, "-").replace(/-+/g, "-");
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[datei],
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${dateiname}.${datei}`)}`,
      "Cache-Control": "no-store",
    },
  });
}
