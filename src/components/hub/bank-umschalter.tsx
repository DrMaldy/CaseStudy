"use client";

import { useTransition } from "react";
import { Landmark } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wechsleFiliale } from "@/actions/kontext";

type Bank = { id: string; name: string; filialen: { id: string; name: string }[] };

/** Nur für Superuser: Wechsel zwischen allen Banken und deren Filialen. */
export function BankUmschalter({ banken, filialeId }: { banken: Bank[]; filialeId: string }) {
  const [pending, start] = useTransition();
  return (
    <Select value={filialeId} onValueChange={(id) => start(() => void wechsleFiliale(id))} disabled={pending}>
      <SelectTrigger className="h-10 max-w-[360px] border-vr-border-blue font-bold text-vr-ultramarine" aria-label="Bank und Filiale wechseln">
        <Landmark className="text-vr-ultramarine" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {banken.map((b) => (
          <SelectGroup key={b.id}>
            <SelectLabel className="font-bold text-vr-blue">{b.name}</SelectLabel>
            {b.filialen.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {b.name.replace(/ eG$/, "")} · {f.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
