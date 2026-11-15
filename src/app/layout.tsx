import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// GenosGFG ist proprietär – Source Sans 3 ist der im Brand-Guide empfohlene Fallback.
const sourceSans = Source_Sans_3({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VR Mobilfunk Partnerhub – Werbemittel",
  description: "Werbemittel-Generator für das Mobilfunk-Partnerhub",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-vr-lightblue">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
