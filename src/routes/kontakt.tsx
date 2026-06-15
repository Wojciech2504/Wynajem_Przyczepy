import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, Landmark, Banknote } from "lucide-react";
import { useSettings } from "@/lib/use-settings";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import logoIcon from "@/assets/logo-campgo-icon.png";

export const Route = createFileRoute("/kontakt")({
  head: () => ({ meta: [{ title: "Kontakt – CampGo" }] }),
  component: ContactPage,
});




const schema = z.object({
  name: z.string().trim().min(2, "Podaj imię").max(100),
  email: z.string().trim().email("Nieprawidłowy email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Wiadomość jest zbyt krótka").max(1000),
});

function ContactPage() {
  const settings = useSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Nie udało się wysłać wiadomości");
      } else {
        toast.success("Wiadomość wysłana. Odpowiemy wkrótce.");
        setForm({ name: "", email: "", phone: "", message: "" });
      }
    } catch {
      toast.error("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <PublicLayout>
      <section className="container mx-auto max-w-6xl px-4 py-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative">
            {/* Watermark logo */}
            <img
              src={logoIcon}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 hidden h-[50%] w-auto max-w-[90%] -translate-x-1/2 select-none opacity-[0.15] md:block"
            />

            <div className="relative">


            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Kontakt</h1>
            <p className="mt-3 text-muted-foreground">Masz pytanie? Napisz lub zadzwoń – chętnie pomożemy.</p>

            <ul className="mt-8 space-y-4 text-sm">
              {settings.contactPhone && (
                <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> {settings.contactPhone}</li>
              )}
              {settings.contactEmail && (
                <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /><span>{settings.contactEmail}</span></li>
              )}
              {settings.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    {settings.address.split("\n").map((l, i) => (
                      <span key={i} className="block">{l}</span>
                    ))}
                  </span>
                </li>
              )}
              {settings.nip && <li className="text-muted-foreground pl-8">NIP: {settings.nip}</li>}
              {settings.regon && <li className="text-muted-foreground pl-8">REGON: {settings.regon}</li>}
              {settings.bankAccount && (
                <li className="text-muted-foreground pl-8">
                  Konto: {settings.bankAccount}
                  {settings.bankName && ` (${settings.bankName})`}
                </li>
              )}
            </ul>

            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Akceptujemy:</span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  <span className="relative inline-flex items-center justify-center rounded-[3px] bg-black px-1 py-0.5 text-[10px] font-extrabold leading-none text-white">
                    blik
                    <span className="absolute left-[8px] top-[0px] h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#ff6a3d] to-[#e6007e]" />
                  </span>
                  BLIK
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  <Landmark className="h-3.5 w-3.5 text-[#1e6fbf]" /> Przelew
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  <Banknote className="h-3.5 w-3.5 text-[#2e9d57]" /> Gotówka
                </span>
              </div>
            </div>

            <div className="mt-8 aspect-video w-full rounded-2xl overflow-hidden shadow-soft border border-border">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address.replace(/\n/g, ", ") || "Polska")}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa"
              />
            </div>
            </div>
          </div>



          <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <div className="space-y-4">
              <Field label="Imię i nazwisko">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required />
              </Field>
              <Field label="Telefon (opcjonalnie)">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Wiadomość">
                <textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls + " resize-none"} required />
              </Field>
              <PrivacyNotice />
              <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-sunset px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
                <Send className="h-4 w-4" /> {loading ? "Wysyłanie..." : "Wyślij wiadomość"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
