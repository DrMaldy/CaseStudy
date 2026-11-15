"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { speichereRegionalPrompt } from "@/actions/filiale";

const MAX = 500;

export function RegionalPromptDialog(props: { filialeId: string; filialeName: string; wert: string | null; trigger: React.ReactNode; bearbeitbar: boolean }) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [text, setText] = useState(props.wert ?? "");
  const [pending, start] = useTransition();

  const speichern = () =>
    start(async () => {
      const res = await speichereRegionalPrompt({ filialeId: props.filialeId, regionalPrompt: text });
      if (!res.ok) return void toast.error(res.fehler);
      toast.success("Regionaler Prompt gespeichert.");
      setOffen(false);
      router.refresh();
    });

  return (
    <Dialog open={offen} onOpenChange={setOffen}>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-vr-ultramarine">Regionaler Prompt · {props.filialeName}</DialogTitle>
          <DialogDescription>
            Beschreiben Sie, was Ihre Region ausmacht. Die KI nutzt das als Anregung für regionale Bezüge – Preise und Tarifdaten
            setzt das Partnerhub immer selbst ein.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={6}
          disabled={!props.bearbeitbar}
          placeholder="z. B. Bezug zur Hochschule vor Ort, zum Wochenmarkt und zu den Vereinen in der Region; viele Pendler Richtung Großstadt."
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{props.bearbeitbar ? "Nur für Ihre eigene Filiale bearbeitbar." : "Prompt einer anderen Filiale – nur lesbar."}</span>
          <span>{text.length} / {MAX}</span>
        </div>
        {props.bearbeitbar && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOffen(false)}>Abbrechen</Button>
            <Button variant="cta" onClick={speichern} disabled={pending}>Speichern</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
