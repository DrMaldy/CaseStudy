import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { HubHeader } from "@/components/hub/header";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const banken = user.istSuperuser
    ? await db.bank.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, filialen: { orderBy: { name: "asc" }, select: { id: true, name: true } } } })
    : null;
  return (
    <>
      <HubHeader
        bankName={user.filiale.bank.name}
        userName={user.name}
        funktion={user.funktion}
        umschalter={banken ? { banken, filialeId: user.filialeId } : undefined}
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
