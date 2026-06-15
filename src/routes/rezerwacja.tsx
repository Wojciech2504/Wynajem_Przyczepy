import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Send, ShieldAlert, Car } from "lucide-react";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { parseISO, format } from "date-fns";
import { pl } from "date-fns/locale";
import { calculatePricing, formatPln, SEASON_LABEL } from "@/lib/pricing";
import { useVehicleCheck } from "@/lib/vehicle-check";

type Search = { from?: string; to?: string; addons?: string };

export const Route = createFileRoute("/rezerwacja")({
  head: () => ({ meta: [{ title: "Zapytanie rezerwacyjne – CampGo" }] }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
    addons: typeof search.addons === "string" ? search.addons : undefined,
  }),
  component: ReservationPage,
});

const schema = z.object({
  start_date: z.string().min(1, "Wybierz datę od"),
  end_date: z.string().min(1, "Wybierz datę do"),
  first_name: z.string().trim().min(2).max(80),
  last_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(255),
  people_count: z.coerce.number().int().min(1).max(10),
  trip_notes: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

function ReservationPage() {
  const search = Route.useSearch();
  const { passed: vehicleCheckPassed } = useVehicleCheck();
  const [form, setForm] = useState({
    start_date: search.from ?? "",
    end_date: search.to ?? "",
    first_name: "", last_name: "", phone: "", email: "",
    people_count: 2, trip_notes: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const addonIds = useMemo(
    () => (search.addons ? search.addons.split(",").filter(Boolean) : []),
    [search.addons],
  );

  const { data: addonRows = [] } = useQuery({
    queryKey: ["addon_fees", "selected", addonIds.sort().join(",")],
    queryFn: async () => {
      if (addonIds.length === 0) return [];
      const { data } = await supabase.from("addon_fees" as any).select("*").in("id", addonIds);
      return (data as any[]) ?? [];
    },
  });

  const pricing = useMemo(() => {
    if (!form.start_date || !form.end_date) return null;
    try {
      const s = parseISO(form.start_date);
      const e = parseISO(form.end_date);
      return calculatePricing(s, e, addonRows.map((a) => ({
        id: a.id, name: a.name, price: Number(a.price), unit: a.unit,
      })));
    } catch { return null; }
  }, [form.start_date, form.end_date, addonRows]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleCheckPassed) {
      toast.error("Przed wysłaniem zapytania rezerwacyjnego sprawdź swoje auto.");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (parsed.data.end_date < parsed.data.start_date) {
      toast.error("Data zakończenia musi być po dacie rozpoczęcia");
      return;
    }
    setLoading(true);
    const reservationId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : undefined;
    const payload: any = {
      ...parsed.data,
      ...(reservationId ? { id: reservationId } : {}),
      status: "zapytanie",
      // Required by RLS: must be set, in the future, and within 49h. 48h matches the business rule.
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };
    if (pricing) {
      payload.days = pricing.days;
      payload.base_cost = pricing.baseCost;
      payload.service_fee = pricing.serviceFee;
      payload.addons = pricing.addons.map((a) => ({
        id: a.id, name: a.name, price: a.price, unit: a.unit, quantity: a.quantity, subtotal: a.subtotal,
      }));
      payload.addons_total = pricing.addonsTotal;
      payload.rental_total = pricing.rentalTotal;
      payload.deposit = pricing.deposit;
      payload.total_amount = pricing.payableTotal;
    }
    const { error } = await supabase.from("reservations").insert(payload);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("nakłada") ? "Wybrany termin nie jest dostępny" : "Nie udało się wysłać zapytania");
      return;
    }
    // Fire-and-forget Slack notification — never block the user on it
    if (reservationId) {
      fetch("/api/public/reservation-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      }).catch(() => {});
    }
    setSent(true);
    toast.success("Zapytanie wysłane!");
  };

  if (sent) {
    return (
      <PublicLayout>
        <section className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-sunset text-primary-foreground shadow-glow">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">Dziękujemy za zapytanie!</h1>
          <p className="mt-3 text-muted-foreground">
            Otrzymaliśmy Twoje zapytanie. Skontaktujemy się z Tobą w ciągu 24 godzin, aby potwierdzić dostępność.
          </p>
          <a href="/" className="mt-8 inline-flex rounded-full border border-input bg-card px-5 py-2.5 text-sm font-semibold">Wróć na stronę główną</a>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-3xl px-4 py-12 lg:py-20">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Zapytanie rezerwacyjne</h1>
        <p className="mt-3 text-muted-foreground">Wypełnij formularz – odpowiemy w ciągu 24 godzin.</p>

        {!vehicleCheckPassed && (
          <div className="mt-6 rounded-3xl border-2 border-destructive/40 bg-destructive/5 p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
              <div className="flex-1">
                <h2 className="font-display text-lg font-semibold text-destructive">Wymagana weryfikacja auta</h2>
                <p className="mt-2 text-sm text-foreground">
                  Przed wysłaniem zapytania rezerwacyjnego sprawdź swoje auto. Musimy potwierdzić, czy samochód może holować naszą przyczepę oraz czy kierowca posiada odpowiednie uprawnienia.
                </p>
                <Link
                  to="/kalkulator-dmc"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  <Car className="h-4 w-4" /> Sprawdź swoje auto
                </Link>
              </div>
            </div>
          </div>
        )}

        {pricing && (
          <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Podsumowanie zamówienia</h2>
            <div className="mt-3 rounded-xl border border-border bg-background/60 p-4 text-sm">
              <div>Termin: <strong>{format(pricing.startDate, "d MMM yyyy", { locale: pl })} – {format(pricing.endDate, "d MMM yyyy", { locale: pl })}</strong></div>
              <div className="mt-1">Liczba dni: <strong>{pricing.days}</strong></div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              {pricing.breakdown.map((b) => (
                <SummaryRow key={b.season} label={`${SEASON_LABEL[b.season]} – ${b.days} ${b.days === 1 ? "doba" : "dni"} × ${b.pricePerDay} zł`} value={formatPln(b.subtotal)} />
              ))}
              {!pricing.serviceFeeWaived && pricing.serviceFee > 0 && (
                <SummaryRow label="Opłata serwisowa" value={formatPln(pricing.serviceFee)} />
              )}
              {pricing.addons.map((a) => (
                <SummaryRow
                  key={a.id}
                  label={`${a.name}${a.unit === "doba" ? ` – ${a.quantity} × ${a.price} zł` : ""}`}
                  value={formatPln(a.subtotal)}
                />
              ))}
              <SummaryRow label="Koszt wynajmu" value={formatPln(pricing.rentalTotal)} bold />
              <SummaryRow label="Kaucja zwrotna" value={formatPln(pricing.deposit)} muted />
            </div>
            <div className="mt-4 rounded-2xl bg-gradient-sunset p-4 text-primary-foreground shadow-glow">
              <div className="text-xs uppercase tracking-wide opacity-90">Razem do wpłaty</div>
              <div className="font-display text-3xl font-bold">{formatPln(pricing.payableTotal)}</div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:grid-cols-2 sm:p-8">
          <Field label="Data od"><input required type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
          <Field label="Data do"><input required type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          <Field label="Imię"><input required className={inputCls} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
          <Field label="Nazwisko"><input required className={inputCls} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
          <Field label="Telefon"><input required className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="E-mail"><input required type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Liczba osób"><input required type="number" min={1} max={10} className={inputCls} value={form.people_count} onChange={(e) => setForm({ ...form, people_count: +e.target.value })} /></Field>
          <Field label="Miejsce wyjazdu / plan (opcjonalnie)"><input className={inputCls} value={form.trip_notes} onChange={(e) => setForm({ ...form, trip_notes: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Dodatkowe uwagi"><textarea rows={4} className={inputCls + " resize-none"} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div className="sm:col-span-2">
            <PrivacyNotice />
          </div>
          <button disabled={loading || !vehicleCheckPassed} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-sunset px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            <Send className="h-4 w-4" /> {loading ? "Wysyłanie..." : !vehicleCheckPassed ? "Najpierw sprawdź swoje auto" : "Wyślij zapytanie"}
          </button>
        </form>
      </section>
    </PublicLayout>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${muted ? "text-muted-foreground" : ""}`}>
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span className={bold ? "font-display font-bold" : ""}>{value}</span>
    </div>
  );
}
