import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info as InfoIcon } from "lucide-react";
import {
  PRICING,
  SEASON_LABEL,
  calculatePricing,
  formatPln,
} from "@/lib/pricing";
import { ArrowRight, Info, ShieldCheck, AlertTriangle, CalendarDays, Car, CalendarCheck, ClipboardList, Landmark, Banknote } from "lucide-react";

export const Route = createFileRoute("/cennik")({
  head: () => ({ meta: [{ title: "Cennik – CampGo" }] }),
  component: PricingPage,
});

function PricingPage() {
  const { data: prices = [] } = useQuery({
    queryKey: ["price_list"],
    queryFn: async () => {
      const { data } = await supabase.from("price_list").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["addon_fees"],
    queryFn: async () => {
      const { data } = await supabase.from("addon_fees" as any).select("*").eq("active", true).order("sort_order");
      return (data as any[]) ?? [];
    },
  });

  const { data: seasonDescs = {} } = useQuery({
    queryKey: ["season_descriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("season_descriptions").select("season,description");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.season] = r.description; });
      return map;
    },
  });


  const [range, setRange] = useState<DateRange | undefined>();
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const selectedAddons = useMemo(
    () => addons.filter((a) => selectedAddonIds.has(a.id)).map((a) => ({
      id: a.id, name: a.name, price: Number(a.price), unit: a.unit,
    })),
    [addons, selectedAddonIds],
  );

  const result = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    return calculatePricing(range.from, range.to, selectedAddons);
  }, [range, selectedAddons]);

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const goReserve = () => {
    if (!range?.from || !range?.to) return;
    const addonIds = Array.from(selectedAddonIds);
    navigate({
      to: "/kalkulator-dmc",
      search: {
        from: format(range.from, "yyyy-MM-dd"),
        to: format(range.to, "yyyy-MM-dd"),
        addons: addonIds.length ? addonIds.join(",") : undefined,
      } as any,
    });
  };


  return (
    <PublicLayout>
      <section className="container mx-auto max-w-6xl px-4 py-12 lg:py-20">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Cennik</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Przejrzysty cennik wynajmu zależny od sezonu. Wybierz termin, aby zobaczyć dokładny koszt.
        </p>

        {/* Stawki sezonowe */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <SeasonCard
            label={SEASON_LABEL.high}
            price={PRICING.high}
            variant="high"
            tooltip={seasonDescs.high || "Brak opisu – dodaj go w panelu administratora."}
          />
          <SeasonCard
            label={SEASON_LABEL.mid}
            price={PRICING.mid}
            variant="mid"
            tooltip={seasonDescs.mid || "Brak opisu – dodaj go w panelu administratora."}
          />
          <SeasonCard
            label={SEASON_LABEL.low}
            price={PRICING.low}
            variant="low"
            tooltip={seasonDescs.low || "Brak opisu – dodaj go w panelu administratora."}
          />
        </div>

        {/* Pozostałe opłaty – zarządzane z panelu admina */}
        {prices.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {prices.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-2xl font-bold text-primary whitespace-nowrap">{Number(p.price).toFixed(0)} zł</div>
                    <div className="text-xs text-muted-foreground">/ {p.unit}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kalkulator */}
        <div className="mt-14">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-sunset text-primary-foreground shadow-glow">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Kalkulator wynajmu</h2>
              <p className="text-sm text-muted-foreground">Wybierz termin odbioru i zwrotu, aby zobaczyć koszt.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="order-1 lg:col-start-1 lg:row-start-1">
              <AvailabilityCalendar range={range} onRangeChange={setRange} />
            </div>
            <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2">
              <SummaryPanel
                result={result}
                addons={addons}
                selectedAddonIds={selectedAddonIds}
                onToggleAddon={toggleAddon}
                onReserve={goReserve}
              />
            </div>
            <div className="order-3 lg:col-start-1 lg:row-start-2">
              <NextStepsPanel />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/80">
            Możesz sprawdzić dostępność terminu i koszt wynajmu bez weryfikacji auta. Przed finalną
            rezerwacją wymagamy jednak sprawdzenia, czy samochód może holować naszą przyczepę.
          </p>
          <a
            href="/kalkulator-dmc"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gradient-sunset px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
          >
            Sprawdź swoje auto
          </a>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Wszystkie ceny są kwotami brutto. Ostateczny koszt potwierdzimy w odpowiedzi na Twoje zapytanie.
        </p>
      </section>
    </PublicLayout>
  );
}

type SeasonVariant = "high" | "mid" | "low";

const SEASON_STYLES: Record<SeasonVariant, string> = {
  high:
    "hover:bg-orange-50 hover:border-orange-400 hover:shadow-[0_10px_30px_-12px_rgba(234,88,12,0.45)] dark:hover:bg-orange-950/30",
  mid:
    "hover:bg-sky-50 hover:border-sky-400 hover:shadow-[0_10px_30px_-12px_rgba(2,132,199,0.45)] dark:hover:bg-sky-950/30",
  low:
    "hover:bg-slate-100 hover:border-slate-500 hover:shadow-[0_10px_30px_-12px_rgba(71,85,105,0.5)] dark:hover:bg-slate-800/60",
};

function SeasonCard({
  label, price, variant, tooltip,
}: { label: string; price: number; variant: SeasonVariant; tooltip: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`group w-full text-left cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 ${SEASON_STYLES[variant]}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <InfoIcon className="h-4 w-4 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold">
            {price} zł<span className="text-base font-normal text-muted-foreground"> / doba</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Dotknij, aby zobaczyć szczegóły sezonu.</p>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="max-w-xs">
        <p className="text-xs leading-relaxed">{tooltip}</p>
      </PopoverContent>
    </Popover>
  );
}


function SummaryPanel({
  result, addons, selectedAddonIds, onToggleAddon, onReserve,
}: {
  result: ReturnType<typeof calculatePricing>;
  addons: any[];
  selectedAddonIds: Set<string>;
  onToggleAddon: (id: string) => void;
  onReserve: () => void;
}) {
  if (!result) {
    return (
      <aside className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold">Podsumowanie kosztów</h3>
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Wybierz datę odbioru i zwrotu, aby zobaczyć koszt wynajmu.</p>
        </div>
      </aside>
    );
  }

  const { startDate, endDate, days, breakdown, baseCost, serviceFee, serviceFeeWaived, addons: appliedAddons, deposit, rentalTotal, payableTotal, belowMinimum } = result;

  return (
    <aside className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h3 className="font-display text-lg font-semibold">Podsumowanie kosztów</h3>

      <div className="mt-4 rounded-xl border border-border bg-background/60 p-4 text-sm">
        <div>Termin: <strong>{format(startDate, "d MMM yyyy", { locale: pl })} – {format(endDate, "d MMM yyyy", { locale: pl })}</strong></div>
        <div className="mt-1">Liczba dni: <strong>{days}</strong></div>
      </div>

      {belowMinimum && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-foreground">
            Minimalny czas wynajmu wynosi {PRICING.minDays} dni. Krótszy wynajem jest możliwy wyłącznie w ramach{" "}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex cursor-pointer items-center gap-1 font-semibold underline decoration-dotted underline-offset-2">
                  Wolnego Slota
                  <InfoIcon className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="max-w-xs text-xs leading-relaxed">
                <strong>Wolny Slot</strong> to krótki, wolny okres między rezerwacjami (np. 1–2 dni), który nie spełnia minimalnego czasu wynajmu, ale możemy go zaoferować po indywidualnym uzgodnieniu. Wyślij zapytanie, a potwierdzimy dostępność i warunki.
              </PopoverContent>
            </Popover>
            . Skontaktuj się z nami, aby potwierdzić dostępność.
          </p>
        </div>
      )}

      <div className="mt-5 space-y-2 text-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Koszt wynajmu</div>
        {breakdown.map((b) => (
          <Row
            key={b.season}
            label={`${SEASON_LABEL[b.season]} – ${b.days} ${b.days === 1 ? "doba" : "dni"} × ${b.pricePerDay} zł`}
            value={formatPln(b.subtotal)}
          />
        ))}
        <Row label="Koszt podstawowy" value={formatPln(baseCost)} bold />
        <Row
          label={`Opłata serwisowa${serviceFeeWaived ? " (gratis powyżej 15 dni)" : ""}`}
          value={serviceFeeWaived ? "0 zł" : formatPln(serviceFee)}
          strike={serviceFeeWaived}
        />
      </div>

      {addons.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-border pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Koszty dodatkowe</div>
          <div className="space-y-2">
            {addons.map((a) => {
              const checked = selectedAddonIds.has(a.id);
              const price = Number(a.price);
              return (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleAddon(a.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{a.name}</span>
                      <span className="font-semibold">+{price} zł{a.unit === "doba" ? " / doba" : ""}</span>
                    </div>
                    {a.description && <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>}
                  </div>
                </label>
              );
            })}
          </div>
          {appliedAddons.length > 0 && (
            <div className="space-y-1 pt-2 text-sm">
              {appliedAddons.map((a) => (
                <Row
                  key={a.id}
                  label={`${a.name}${a.unit === "doba" ? ` – ${a.quantity} ${a.quantity === 1 ? "doba" : "dni"} × ${a.price} zł` : ""}`}
                  value={formatPln(a.subtotal)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <Row label="Koszt wynajmu" value={formatPln(rentalTotal)} bold />
        <Row label="Kaucja zwrotna (zabezpieczenie)" value={formatPln(deposit)} muted />
      </div>


      <div className="mt-4 rounded-2xl bg-gradient-sunset p-4 text-primary-foreground shadow-glow">
        <div className="text-xs uppercase tracking-wide opacity-90">Razem do wpłaty</div>
        <div className="font-display text-3xl font-bold">{formatPln(payableTotal)}</div>
        <div className="mt-1 text-xs opacity-90">{formatPln(rentalTotal)} koszt + {formatPln(deposit)} kaucja zwrotna</div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <p>
          Kaucja jest zwrotna po bezszkodowym i prawidłowym zwrocie przyczepy. Opłata <strong>{PRICING.dirtyFee} zł brutto</strong> za oddanie brudnej przyczepy może zostać potrącona z kaucji, jeżeli przyczepa wróci niewyczyszczona, z nieopróżnioną toaletą lub zbiornikami.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Akceptowane formy płatności</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground">
            <span className="relative inline-flex items-center justify-center rounded-[4px] bg-black px-1.5 py-1 text-[11px] font-extrabold leading-none text-white">
              blik
              <span className="absolute left-[11px] top-[1px] h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#ff6a3d] to-[#e6007e]" />
            </span>
            BLIK
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground">
            <Landmark className="h-4 w-4 text-[#1e6fbf]" /> Przelew
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground">
            <Banknote className="h-4 w-4 text-[#2e9d57]" /> Gotówka
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Płatność możliwa przez BLIK, przelew lub gotówką przy odbiorze.
        </p>
      </div>

      <button
        onClick={onReserve}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90"
      >
        {belowMinimum ? "Zapytaj o Wolny Slot" : "Rezerwuj"} <ArrowRight className="h-4 w-4" />
      </button>
    </aside>
  );
}

function Row({
  label, value, bold, muted, strike,
}: { label: string; value: string; bold?: boolean; muted?: boolean; strike?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${muted ? "text-muted-foreground" : ""}`}>
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span className={`${bold ? "font-display font-bold" : ""} ${strike ? "line-through opacity-60" : ""}`}>{value}</span>
    </div>
  );
}

function NextStepsPanel() {
  const steps = [
    {
      icon: Car,
      title: "Sprawdź swoje auto",
      description:
        "Przed finalną rezerwacją upewnij się, że samochód może holować przyczepę. Sprawdzimy DMC, O.1, O.2 i wymagane uprawnienia.",
      href: "/kalkulator-dmc",
    },
    {
      icon: CalendarCheck,
      title: "Wyślij zapytanie o termin",
      description:
        "Wybrany termin traktujemy jako zapytanie. Dostępność potwierdzimy ręcznie, szczególnie przy krótszych pobytach i wolnych slotach.",
    },
    {
      icon: ClipboardList,
      title: "Odbiór i instruktaż",
      description:
        "Przy odbiorze pokazujemy obsługę przyczepy, wyposażenia, zabezpieczeń, ogrzewania, wody, prądu i podstaw holowania.",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h3 className="font-display text-lg font-semibold">Co dalej po wyborze terminu?</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Kalendarz pokazuje orientacyjną dostępność i koszt wynajmu. Ostateczne potwierdzenie terminu następuje po sprawdzeniu możliwości holowania przyczepy oraz potwierdzeniu dostępności przez obsługę.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-border bg-background/60 p-4 transition hover:bg-background/80"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                <step.icon className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-display text-sm font-semibold">{step.title}</h4>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            {step.href && (
              <Link
                to={step.href}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Przejdź <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
