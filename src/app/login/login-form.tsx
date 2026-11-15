"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) return setError("E-Mail oder Passwort ist nicht korrekt.");
    router.replace("/marketing/werbemittel");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="cta" size="lg" className="w-full" disabled={pending}>
        {pending ? "Anmelden …" : "Anmelden"} <ArrowRight />
      </Button>
    </form>
  );
}
