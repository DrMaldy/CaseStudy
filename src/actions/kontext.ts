"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { KONTEXT_COOKIE, requireUser } from "@/lib/session";

/** Bankumschalter: nur Superuser dürfen die wirksame Filiale (und damit Bank) wechseln. */
export async function wechsleFiliale(filialeId: string) {
  const user = await requireUser();
  if (!user.istSuperuser) return { ok: false as const, fehler: "Keine Berechtigung." };
  const filiale = await db.filiale.findUnique({ where: { id: filialeId } });
  if (!filiale) return { ok: false as const, fehler: "Filiale nicht gefunden." };
  (await cookies()).set(KONTEXT_COOKIE, filiale.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/marketing/werbemittel");
}
