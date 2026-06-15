import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { pl } from "date-fns/locale";
import { parseISO, eachDayOfInterval, format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  /** Which categories of bookings to highlight. */
  show?: Array<"confirmed" | "pending" | "inquiry" | "blocked">;
};

export function AdminBookingsCalendar({ show = ["confirmed", "pending", "inquiry", "blocked"] }: Props) {
  const [month, setMonth] = useState<Date>(new Date());

  const { data: reservations = [] } = useQuery({
    queryKey: ["admin", "calendar", "reservations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id, start_date, end_date, first_name, last_name, status")
        .in("status", ["potwierdzona", "oczekuje", "zapytanie"]);
      return data ?? [];
    },
  });

  const { data: blocked = [] } = useQuery({
    queryKey: ["admin", "calendar", "blocked"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blocked_dates")
        .select("id, start_date, end_date, reason");
      return data ?? [];
    },
  });

  const expandRange = (start: string, end: string): Date[] => {
    try {
      return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
    } catch {
      return [];
    }
  };

  const confirmed: Date[] = [];
  const pending: Date[] = [];
  const inquiry: Date[] = [];
  const blockedDays: Date[] = [];

  reservations.forEach((r: any) => {
    const days = expandRange(r.start_date, r.end_date);
    if (r.status === "potwierdzona") confirmed.push(...days);
    else if (r.status === "oczekuje") pending.push(...days);
    else if (r.status === "zapytanie") inquiry.push(...days);
  });
  blocked.forEach((b: any) => blockedDays.push(...expandRange(b.start_date, b.end_date)));

  const modifiers: Record<string, Date[]> = {};
  const modifiersClassNames: Record<string, string> = {};

  if (show.includes("confirmed")) {
    modifiers.confirmed = confirmed;
    modifiersClassNames.confirmed = "bg-green-500/80 text-white rounded-md font-semibold";
  }
  if (show.includes("pending")) {
    modifiers.pending = pending;
    modifiersClassNames.pending = "bg-amber-400/80 text-foreground rounded-md font-semibold";
  }
  if (show.includes("inquiry")) {
    modifiers.inquiry = inquiry;
    modifiersClassNames.inquiry = "bg-blue-400/70 text-white rounded-md font-semibold";
  }
  if (show.includes("blocked")) {
    modifiers.blocked = blockedDays;
    modifiersClassNames.blocked = "bg-destructive/70 text-white rounded-md font-semibold";
  }

  // Build a lookup for day -> tooltip text
  const tooltipMap = new Map<string, string[]>();
  const addTip = (d: Date, txt: string) => {
    const k = format(d, "yyyy-MM-dd");
    const arr = tooltipMap.get(k) ?? [];
    arr.push(txt);
    tooltipMap.set(k, arr);
  };
  reservations.forEach((r: any) => {
    const label = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Rezerwacja";
    const tag = r.status === "potwierdzona" ? "✓" : r.status === "oczekuje" ? "○" : "?";
    expandRange(r.start_date, r.end_date).forEach((d) => addTip(d, `${tag} ${label}`));
  });
  blocked.forEach((b: any) => {
    expandRange(b.start_date, b.end_date).forEach((d) => addTip(d, `⛔ ${b.reason || "Blokada"}`));
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Kalendarz</h2>
        <Legend show={show} />
      </div>
      <DayPicker
        mode="single"
        locale={pl}
        weekStartsOn={1}
        month={month}
        onMonthChange={setMonth}
        numberOfMonths={2}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className={cn("p-0 pointer-events-auto")}
        classNames={{
          months: "flex flex-col md:flex-row gap-6",
          month: "space-y-3",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-semibold",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 rounded-md hover:bg-muted",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "text-muted-foreground w-9 font-normal text-xs",
          row: "flex w-full mt-1",
          cell: "h-9 w-9 text-center text-sm p-0 relative",
          day: "h-9 w-9 p-0 font-normal hover:bg-muted rounded-md",
          day_today: "ring-1 ring-primary/40",
          day_outside: "text-muted-foreground/40",
        }}
        components={{
          DayButton: ({ day, modifiers: _m, ...rest }: any) => {
            const k = format(day.date, "yyyy-MM-dd");
            const tips = tooltipMap.get(k);
            return (
              <button
                type="button"
                {...rest}
                title={tips ? tips.join("\n") : undefined}
                className={cn("h-9 w-9 rounded-md text-sm hover:bg-muted", rest.className)}
              >
                {day.date.getDate()}
              </button>
            );
          },
        }}
      />
    </div>
  );
}

function Legend({ show }: { show: Props["show"] }) {
  const items: Array<{ key: string; label: string; cls: string }> = [];
  if (show?.includes("confirmed")) items.push({ key: "c", label: "Potwierdzona", cls: "bg-green-500/80" });
  if (show?.includes("pending")) items.push({ key: "p", label: "Oczekuje", cls: "bg-amber-400/80" });
  if (show?.includes("inquiry")) items.push({ key: "i", label: "Poczekalnia", cls: "bg-blue-400/70" });
  if (show?.includes("blocked")) items.push({ key: "b", label: "Blokada", cls: "bg-destructive/70" });
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map((it) => (
        <span key={it.key} className="inline-flex items-center gap-1.5">
          <span className={cn("inline-block h-3 w-3 rounded", it.cls)} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
