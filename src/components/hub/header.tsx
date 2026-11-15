import Link from "next/link";
import { Bell, ChevronDown, Landmark } from "lucide-react";
import { VrSignet } from "@/components/brand/vr-signet";
import { UserMenu } from "./user-menu";
import { BankUmschalter } from "./bank-umschalter";

// Nur „Marketing“ ist im Prototyp funktional; übrige Bereiche sind sichtbar, aber deaktiviert.
const hauptnavigation = ["Übersicht", "Produkt", "Onboarding", "Mitarbeitende"];
const subnavigation = ["Kampagnenkalender", "Bildmaterial"];

export function HubHeader(props: {
  bankName: string;
  userName: string;
  funktion: string;
  umschalter?: React.ComponentProps<typeof BankUmschalter>;
}) {
  return (
    <header className="bg-white">
      <div className="flex h-[72px] items-stretch border-b">
        <Link href="/marketing/werbemittel" className="flex items-center gap-3 px-8">
          <VrSignet className="h-8" />
          <span className="text-[15px] leading-tight font-bold text-vr-blue">
            VR Mobilfunk
            <br />
            Partnerhub
          </span>
        </Link>
        <nav className="ml-6 flex items-stretch gap-9 text-[15px]">
          {hauptnavigation.map((item) => (
            <span key={item} aria-disabled className="flex items-center text-vr-ultramarine/60" title="Im Prototyp nicht verfügbar">
              {item}
            </span>
          ))}
          <span className="flex items-center border-b-2 border-vr-blue font-bold text-vr-ultramarine">Marketing</span>
        </nav>
        <div className="ml-auto flex items-center gap-5 pr-6">
          {props.umschalter ? (
            <BankUmschalter {...props.umschalter} />
          ) : (
            <span className="flex h-10 items-center gap-2 rounded-md border border-vr-border-blue px-3 text-sm font-bold text-vr-ultramarine">
              <Landmark className="size-4" /> {props.bankName} <ChevronDown className="size-4 opacity-50" />
            </span>
          )}
          <Bell className="size-5 text-vr-ultramarine" aria-label="Benachrichtigungen" />
        </div>
        <UserMenu name={props.userName} funktion={props.funktion} />
      </div>
      <div className="flex h-12 items-stretch gap-8 border-b px-8 text-sm">
        <span className="flex items-center text-xs font-bold text-vr-ultramarine/70">Marketing</span>
        <Link href="/marketing/werbemittel" className="flex items-center border-b-2 border-vr-blue font-bold text-vr-ultramarine">
          Werbemittel
        </Link>
        {subnavigation.map((item) => (
          <span key={item} aria-disabled className="flex items-center text-vr-ultramarine/60" title="Im Prototyp nicht verfügbar">
            {item}
          </span>
        ))}
      </div>
    </header>
  );
}
