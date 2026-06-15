import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Logowanie admin – CampGo" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session && isAdmin) navigate({ to: "/admin" });
  }, [loading, session, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Zalogowano");
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) toast.error(error.message);
      else toast.success("Konto utworzone. Poproś administratora o nadanie uprawnień.");
    }
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted/20 px-4">
      <section className="flex w-full max-w-md flex-col items-center py-16">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-sunset text-primary-foreground shadow-glow">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">Panel administratora</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Zaloguj się, aby zarządzać rezerwacjami." : "Utwórz konto. Uprawnienia administratora nadaje istniejący admin."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 w-full space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">E-mail</span>
            <input required type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Hasło</span>
            <input required type="password" minLength={6} className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button disabled={busy} className="inline-flex w-full items-center justify-center rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            {busy ? "..." : mode === "login" ? "Zaloguj się" : "Utwórz konto"}
          </button>
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
            {mode === "login" ? "Utwórz nowe konto" : "Mam już konto – zaloguj się"}
          </button>
        </form>
        {session && !isAdmin && (
          <p className="mt-4 rounded-xl bg-warning/15 px-4 py-3 text-sm text-warning-foreground">
            Twoje konto nie ma uprawnień administratora.
          </p>
        )}
      </section>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
