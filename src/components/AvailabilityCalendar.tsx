import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { eachDayOfInterval, isSameDay, parseISO, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { getSeasonForDate, priceForSeason } from "@/lib/pricing";

export function useUnavailableDates() {
  return useQuery({
    queryKey: ["unavailable-dates"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const [resv, blocks] = await Promise.all([
        supabase
          .from("reservations")
          .select("start_date,end_date,status,expires_at")
          .in("status", ["potwierdzona", "telefoniczna"])
          .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
        supabase.from("public_blocked_dates").select("start_date,end_date"),
      ]);
      const dates: Date[] = [];
      for (const r of resv.data ?? []) {
        dates.push(...eachDayOfInterval({ start: parseISO(r.start_date), end: parseISO(r.end_date) }));
      }
      for (const b of blocks.data ?? []) {
        if (!b.start_date || !b.end_date) continue;
        dates.push(...eachDayOfInterval({ start: parseISO(b.start_date), end: parseISO(b.end_date) }));
      }
      return dates;
    },
  });
}

type Props = {
  range?: DateRange;
  onRangeChange?: (r: DateRange | undefined) => void;
  numberOfMonths?: number;
};

export function AvailabilityCalendar({ range, onRangeChange, numberOfMonths = 2 }: Props) {
  const { data: unavailable = [] } = useUnavailableDates();
  const today = startOfDay(new Date());

  return (
    <div
      className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6"
      style={{
        ["--rdp-day_button-height" as any]: "3.25rem",
        ["--rdp-day_button-width" as any]: "3.25rem",
        ["--rdp-day-height" as any]: "3.25rem",
        ["--rdp-day-width" as any]: "3.25rem",
      }}
    >
      <DayPicker
        mode="range"
        selected={range}
        onSelect={(r) => {
          if (range?.from && range?.to) {
            onRangeChange?.(undefined);
            return;
          }
          onRangeChange?.(r);
        }}
        min={1}
        disabled={[{ before: today }, ...unavailable]}
        modifiers={{ booked: unavailable }}
        numberOfMonths={numberOfMonths}
        locale={pl}
        weekStartsOn={1}
        className="pointer-events-auto rdp-prices"
        classNames={{
          month: "space-y-3 relative",
          month_caption: "flex h-9 items-center justify-center text-sm font-semibold",
          nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1 z-10 pointer-events-none",
          button_previous:
            "pointer-events-auto h-7 w-7 inline-flex items-center justify-center rounded-md opacity-60 hover:opacity-100 hover:bg-muted",
          button_next:
            "pointer-events-auto h-7 w-7 inline-flex items-center justify-center rounded-md opacity-60 hover:opacity-100 hover:bg-muted",
        }}
        modifiersClassNames={{
          selected: "!ring-2 !ring-primary",
          range_middle: "!ring-2 !ring-primary",
        }}
        components={{
          DayButton: ({ day, modifiers, ...props }) => {
            const date = day.date;
            const isBooked = unavailable.some((u) => isSameDay(u, date));
            const isPast = date < today;
            const price = priceForSeason(getSeasonForDate(date));

            const base =
              "flex h-full w-full flex-col items-center justify-center rounded-md px-1 py-1 text-xs leading-tight transition-colors";
            const state = isPast
              ? "text-muted-foreground/40"
              : isBooked
                ? "bg-destructive/20 text-destructive hover:bg-destructive/25"
                : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200";

            return (
              <button {...props} className={`${base} ${state}`}>
                <span className="text-sm font-medium">{date.getDate()}</span>
                {!isPast && !isBooked && (
                  <span className="text-[10px] font-normal opacity-80">{price} zł</span>
                )}
              </button>
            );
          },
        }}
      />
      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs">
        <Legend color="bg-emerald-200" label="Wolny termin (z ceną)" />
        <Legend color="bg-destructive/30" label="Zajęte / zablokowane" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <span className={`inline-block h-3 w-3 rounded-sm ${color}`} /> {label}
    </span>
  );
}
