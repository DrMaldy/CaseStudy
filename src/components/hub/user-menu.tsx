"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function UserMenu({ name, funktion }: { name: string; funktion: string }) {
  const router = useRouter();
  const initialen = name.split(" ").map((t) => t[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-3 rounded-bl-[32px] bg-vr-blue pr-8 pl-7 text-left text-white">
        <span className="flex size-9 items-center justify-center rounded-full bg-white text-sm font-bold text-vr-blue">
          {initialen}
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-bold">{name}</span>
          <span className="opacity-80">{funktion}</span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={async () => {
            await authClient.signOut();
            router.replace("/login");
            router.refresh();
          }}
        >
          <LogOut /> Abmelden
        </Button>
      </PopoverContent>
    </Popover>
  );
}
