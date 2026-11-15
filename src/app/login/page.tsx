import { LoginForm } from "./login-form";
import { VrSignet } from "@/components/brand/vr-signet";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-[0_4px_15px_rgba(0,0,0,.08)]">
        <div className="mb-6 flex items-center gap-3">
          <VrSignet className="h-8" />
          <div className="leading-tight font-bold text-vr-blue">
            VR Mobilfunk
            <br />
            Partnerhub
          </div>
        </div>
        <h1 className="mb-1 text-2xl">Anmelden</h1>
        <p className="mb-6 text-sm text-muted-foreground">Melden Sie sich mit Ihrem Partnerhub-Zugang an.</p>
        <LoginForm />
      </div>
    </main>
  );
}
