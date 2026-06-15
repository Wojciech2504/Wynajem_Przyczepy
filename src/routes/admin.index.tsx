import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  CalendarRange,
} from "lucide-react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const today = startOfDay(new Date());
  const todayIso = format(today, "yyyy-MM-dd");
  const in7 = format(addDays(today, 7), "yyyy-MM-dd");
  const nowIso = new Date().toISOString();
  const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [
        inquiries,
        confirmed,
        expiringSoon,
        wydaniaToday,
        zwrotyToday,
        unpaid,
        messages,
        upcoming,
        newMessages,
        expiringList,
        phoneList,
      ] = await Promise.all([
        supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "telefoniczna"),
        supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "potwierdzona"),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("status", "telefoniczna")
          .gt("expires_at", nowIso)
          .lt("expires_at", in48h),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .in("status", ["potwierdzona", "telefoniczna"])
          .eq("start_date", todayIso),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .in("status", ["potwierdzona", "telefoniczna"])
          .eq("end_date", todayIso),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("status", "potwierdzona")
          .or("total_amount.is.null,total_amount.gt.0"),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "nowa"),
        supabase
          .from("reservations")
          .select("*")
          .in("status", ["potwierdzona", "telefoniczna"])
          .gte("start_date", todayIso)
          .lte("start_date", in7)
          .order("start_date")
          .limit(10),
        supabase.from("contact_messages").select("*").eq("status", "nowa").order("created_at", { ascending: false }).limit(5),
        supabase
          .from("reservations")
          .select("*")
          .eq("status", "telefoniczna")
          .gt("expires_at", nowIso)
          .order("expires_at")
          .limit(5),
        supabase.from("reservations").select("*").eq("status", "telefoniczna").gt("expires_at", nowIso).order("expires_at").limit(20),
      ]);
      return {
        inquiries: inquiries.count ?? 0,
        confirmed: confirmed.count ?? 0,
        expiringSoon: expiringSoon.count ?? 0,
        wydaniaToday: wydaniaToday.count ?? 0,
        zwrotyToday: zwrotyToday.count ?? 0,
        unpaid: unpaid.count ?? 0,
        messages: messages.count ?? 0,
        upcoming: upcoming.data ?? [],
        newMessages: newMessages.data ?? [],
        expiringList: expiringList.data ?? [],
        phoneList: phoneList.data ?? [],
      };
    },
  });

  // Build "Do zrobienia" list
  const todos: { icon: any; text: string; to: string }[] = [];
  (data?.phoneList ?? []).forEach((r: any) => {
    todos.push({
      icon: Phone,
      text: `Potwierdzić rezerwację telefoniczną: ${r.first_name} ${r.last_name} (${format(parseISO(r.start_date), "d MMM", { locale: pl })})`,
      to: "/admin/kalendarz",
    });
  });
  (data?.newMessages ?? []).forEach((m: any) => {
    todos.push({
      icon: MessageSquare,
      text: `Odpowiedzieć na wiadomość od ${m.name}`,
      to: "/admin/wiadomosci",
    });
  });
  (data?.upcoming ?? [])
    .filter((r: any) => r.start_date === format(addDays(today, 1), "yyyy-MM-dd"))
    .forEach((r: any) => {
      todos.push({
        icon: ArrowUpFromLine,
        text: `Przygotować wydanie przyczepy jutro: ${r.first_name} ${r.last_name}`,
        to: "/admin/kalendarz",
      });
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Co muszę dzisiaj zrobić?</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Stat icon={Clock} label="Nowe zapytania" value={data?.inquiries ?? 0} to="/admin/kalendarz" />
        <Stat icon={CheckCircle2} label="Rezerwacje potwierdzone" value={data?.confirmed ?? 0} to="/admin/kalendarz" />
        <Stat icon={Phone} label="Rezerwacje telefoniczne" value={data?.inquiries ?? 0} to="/admin/kalendarz" />
        <Stat icon={AlertTriangle} label="Telefoniczne wygasające do 48h" value={data?.expiringSoon ?? 0} to="/admin/kalendarz" accent="warning" />
        <Stat icon={ArrowUpFromLine} label="Dzisiejsze wydania" value={data?.wydaniaToday ?? 0} to="/admin/kalendarz" />
        <Stat icon={ArrowDownToLine} label="Dzisiejsze zwroty" value={data?.zwrotyToday ?? 0} to="/admin/kalendarz" />
        <Stat icon={Wallet} label="Nieopłacone rezerwacje" value={data?.unpaid ?? 0} to="/admin/kalendarz" />
        <Stat icon={MessageSquare} label="Nowe wiadomości" value={data?.messages ?? 0} to="/admin/wiadomosci" />
        <Stat icon={CalendarRange} label="Najbliższe 7 dni" value={data?.upcoming.length ?? 0} to="/admin/kalendarz" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Do zrobienia</h2>
            <ul className="mt-4 space-y-2">
              {todos.length === 0 && (
                <li className="rounded-xl bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                  Nic pilnego — wszystko pod kontrolą. 🎉
                </li>
              )}
              {todos.map((t, i) => (
                <li key={i}>
                  <Link
                    to={t.to}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-sm hover:bg-muted/40"
                  >
                    <t.icon className="h-4 w-4 text-primary" />
                    <span className="flex-1">{t.text}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Najbliższe rezerwacje (7 dni)</h2>
            <ul className="mt-4 divide-y divide-border">
              {(data?.upcoming ?? []).map((r: any) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{r.first_name} {r.last_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(r.start_date), "d MMM", { locale: pl })} – {format(parseISO(r.end_date), "d MMM yyyy", { locale: pl })}
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{r.status}</span>
                </li>
              ))}
              {(data?.upcoming ?? []).length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">Brak nadchodzących rezerwacji</li>
              )}
            </ul>
          </div>
        </div>

        <div>
          <AvailabilityCalendar numberOfMonths={1} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  to,
  accent,
}: {
  icon: any;
  label: string;
  value: number;
  to?: string;
  accent?: "warning";
}) {
  const content = (
    <div
      className={`rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-md ${
        accent === "warning" && value > 0
          ? "border-amber-300 bg-amber-50/60 dark:bg-amber-900/20"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent === "warning" && value > 0 ? "text-amber-600" : "text-primary"}`} />
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}
