"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function relativ(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return min < 1 ? "gerade eben" : `vor ${min} Min.`;
}

export function FooterBar(props: {
  zurueck?: string;
  gespeichertAm: string;
  primaer: React.ReactNode;
  speichernUndSchliessen?: () => Promise<void> | void;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="sticky bottom-0 z-10 mt-auto border-t bg-white">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center gap-6 px-4">
        {props.zurueck ? (
          <Button variant="outline" size="lg" asChild>
            <Link href={props.zurueck}><ArrowLeft /> Zurück</Link>
          </Button>
        ) : (
          <Button variant="outline" size="lg" asChild>
            <Link href="/marketing/werbemittel">Abbrechen</Link>
          </Button>
        )}
        <span className="mx-auto flex items-center gap-2 text-sm text-muted-foreground" suppressHydrationWarning>
          <Check className="size-4 text-vr-success" /> Automatisch als Entwurf gespeichert · {relativ(props.gespeichertAm)}
        </span>
        <Button variant="link" asChild onClick={() => props.speichernUndSchliessen?.()}>
          <Link href="/marketing/werbemittel">Speichern & schließen</Link>
        </Button>
        {props.primaer}
      </div>
    </div>
  );
}
