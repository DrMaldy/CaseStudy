import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "sqlite" }),
  // Nutzer kommen ausschließlich aus dem Seed; Registrierung ist im Prototyp deaktiviert.
  emailAndPassword: { enabled: true, disableSignUp: true },
  user: {
    additionalFields: {
      filialeId: { type: "string", required: true, input: false },
      funktion: { type: "string", required: false, input: false },
      rolle: { type: "string", required: false, input: false },
    },
  },
  plugins: [nextCookies()],
});
