"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { loescheWerbemittel } from "@/actions/werbemittel";

export function LoeschenButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const loeschen = () =>
    start(async () => {
      await loescheWerbemittel({ id });
      toast.success(`„${name}“ wurde gelöscht.`);
      router.refresh();
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Werbemittel löschen" disabled={pending}
          className="hover:border-destructive hover:bg-destructive/5 hover:text-destructive">
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-vr-ultramarine">Werbemittel löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            „{name}“ wird endgültig gelöscht – inklusive Entwurf, KI-Vorschlägen und Export-Historie. Bereits heruntergeladene Dateien bleiben erhalten.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={loeschen}>Endgültig löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
