import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Cookie, in dem ein Superuser die aktuell gewählte Filiale (und damit Bank) hält. */
export const KONTEXT_COOKIE = "partnerhub_filiale";

const filialeMitBank = { include: { bank: { include: { filialen: { orderBy: { name: "asc" as const } } } } } };

/**
 * Data Access Layer: angemeldeter Nutzer inkl. *wirksamer* Filiale und Bank.
 * Filialnutzer sind fest an ihre Filiale gebunden; Superuser arbeiten in der per Bankumschalter gewählten Filiale.
 */
export const requireUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id }, include: { filiale: filialeMitBank } });
  if (!user) redirect("/login");

  const istSuperuser = user.rolle === "SUPERUSER";
  const gewaehlt = istSuperuser ? (await cookies()).get(KONTEXT_COOKIE)?.value : undefined;
  if (gewaehlt && gewaehlt !== user.filialeId) {
    const filiale = await db.filiale.findUnique({ where: { id: gewaehlt }, ...filialeMitBank });
    if (filiale) return { ...user, filialeId: filiale.id, filiale, istSuperuser };
  }
  return { ...user, istSuperuser };
});

export type CurrentUser = Awaited<ReturnType<typeof requireUser>>;

/**
 * Lädt ein Werbemittel nur, wenn der Nutzer darauf zugreifen darf – sonst 404 (keine Existenz-Preisgabe).
 * Für Superuser wird der Kontext auf die Filiale des Werbemittels umgestellt, damit Bank, Filialen und Bilder passen.
 */
export async function requireWerbemittel(id: string) {
  const user = await requireUser();
  const wm = await db.werbemittel.findFirst({
    where: user.istSuperuser ? { id } : { id, filialeId: user.filialeId },
    include: { bildAsset: true, bezugFiliale: true },
  });
  if (!wm) notFound();
  if (wm.filialeId === user.filialeId) return { user, wm };
  const filiale = await db.filiale.findUniqueOrThrow({ where: { id: wm.filialeId }, ...filialeMitBank });
  return { user: { ...user, filialeId: filiale.id, filiale }, wm };
}
