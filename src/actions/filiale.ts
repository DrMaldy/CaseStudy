"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const eingabe = z.object({ filialeId: z.string(), regionalPrompt: z.string().trim().max(500, "Maximal 500 Zeichen.") });

/** Regionaler Prompt – darf nur von Nutzern der eigenen Filiale geändert werden. */
export async function speichereRegionalPrompt(input: z.infer<typeof eingabe>) {
  const user = await requireUser();
  const parsed = eingabe.safeParse(input);
  if (!parsed.success) return { ok: false as const, fehler: parsed.error.issues[0].message };
  if (!user.istSuperuser && parsed.data.filialeId !== user.filialeId) return { ok: false as const, fehler: "Nur der Prompt Ihrer eigenen Filiale kann bearbeitet werden." };

  await db.filiale.update({
    where: { id: parsed.data.filialeId },
    data: { regionalPrompt: parsed.data.regionalPrompt || null, regionalPromptAktualisiertAm: new Date() },
  });
  revalidatePath("/marketing/werbemittel", "layout");
  return { ok: true as const };
}
