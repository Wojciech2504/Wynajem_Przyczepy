import { addDays, differenceInCalendarDays, format, isBefore } from "date-fns";

export const PRICING = {
  high: 320,
  mid: 260,
  low: 210,
  serviceFee: 250,
  serviceFeeWaiverDays: 15,
  deposit: 2500,
  dirtyFee: 300,
  petFee: 200,
  minDays: 6,
} as const;

export type Season = "high" | "mid" | "low";

export const SEASON_LABEL: Record<Season, string> = {
  high: "Sezon wysoki",
  mid: "Sezon średni",
  low: "Sezon niski",
};

// Polskie długie weekendy (stałe + wybrane na 2025-2027).
// Format: ISO daty (YYYY-MM-DD) traktowane jako sezon wysoki.
const LONG_WEEKEND_DATES = new Set<string>([
  // Majówka (1-3 maja) – tradycyjny długi weekend
  "2025-05-01", "2025-05-02", "2025-05-03", "2025-05-04",
  "2026-05-01", "2026-05-02", "2026-05-03",
  "2027-05-01", "2027-05-02", "2027-05-03",
  // Boże Ciało
  "2025-06-19", "2025-06-20", "2025-06-21", "2025-06-22",
  "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07",
  "2027-05-27", "2027-05-28", "2027-05-29", "2027-05-30",
  // 11 listopada
  "2025-11-10", "2025-11-11",
  "2026-11-11",
  "2027-11-11", "2027-11-12",
  // Święta / Nowy Rok 2026/2027 (24.12.2026 – 10.01.2027)
  "2026-12-24", "2026-12-25", "2026-12-26", "2026-12-27", "2026-12-28",
  "2026-12-29", "2026-12-30", "2026-12-31",
  "2027-01-01", "2027-01-02", "2027-01-03", "2027-01-04", "2027-01-05",
  "2027-01-06", "2027-01-07", "2027-01-08", "2027-01-09", "2027-01-10",
]);


export function getSeasonForDate(d: Date): Season {
  const iso = format(d, "yyyy-MM-dd");
  if (LONG_WEEKEND_DATES.has(iso)) return "high";
  const m = d.getMonth() + 1; // 1-12
  if (m === 6 || m === 7 || m === 8) return "high";
  if (m === 5 || m === 9) return "mid";
  return "low";
}

export function priceForSeason(s: Season): number {
  return PRICING[s];
}

export type SeasonBreakdownItem = {
  season: Season;
  days: number;
  pricePerDay: number;
  subtotal: number;
};

export type AddonInput = {
  id: string;
  name: string;
  price: number;
  unit: string; // 'wynajem' | 'doba'
};

export type AppliedAddon = AddonInput & {
  quantity: number;
  subtotal: number;
};

export type PricingResult = {
  startDate: Date;
  endDate: Date;
  days: number;
  breakdown: SeasonBreakdownItem[];
  baseCost: number;
  serviceFee: number;
  serviceFeeWaived: boolean;
  addons: AppliedAddon[];
  addonsTotal: number;
  deposit: number;
  dirtyFee: number;
  rentalTotal: number; // base + service + addons
  payableTotal: number; // rental + deposit
  belowMinimum: boolean;
};

export function calculatePricing(
  start: Date,
  end: Date,
  selectedAddons: AddonInput[] = [],
): PricingResult | null {
  if (!start || !end) return null;
  if (isBefore(end, start)) return null;
  // Inclusive day count: liczymy wszystkie zaznaczone dni (od odbioru do zwrotu włącznie)
  const days = differenceInCalendarDays(end, start) + 1;
  if (days <= 0) return null;

  const map: Record<Season, number> = { high: 0, mid: 0, low: 0 };
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    map[getSeasonForDate(d)] += 1;
  }

  const order: Season[] = ["high", "mid", "low"];
  const breakdown: SeasonBreakdownItem[] = order
    .filter((s) => map[s] > 0)
    .map((s) => ({
      season: s,
      days: map[s],
      pricePerDay: priceForSeason(s),
      subtotal: map[s] * priceForSeason(s),
    }));

  const baseCost = breakdown.reduce((a, b) => a + b.subtotal, 0);
  const serviceFeeWaived = days > PRICING.serviceFeeWaiverDays;
  const serviceFee = serviceFeeWaived ? 0 : PRICING.serviceFee;

  const addons: AppliedAddon[] = selectedAddons.map((a) => {
    const quantity = a.unit === "doba" ? days : 1;
    return { ...a, quantity, subtotal: a.price * quantity };
  });
  const addonsTotal = addons.reduce((a, b) => a + b.subtotal, 0);

  const rentalTotal = baseCost + serviceFee + addonsTotal;
  const payableTotal = rentalTotal + PRICING.deposit;

  return {
    startDate: start,
    endDate: end,
    days,
    breakdown,
    baseCost,
    serviceFee,
    serviceFeeWaived,
    addons,
    addonsTotal,
    deposit: PRICING.deposit,
    dirtyFee: PRICING.dirtyFee,
    rentalTotal,
    payableTotal,
    belowMinimum: days < PRICING.minDays,
  };
}

export function formatPln(n: number): string {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n);
}
