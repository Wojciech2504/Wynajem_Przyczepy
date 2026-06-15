import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";

import { DayPicker, type DateRange } from "react-day-picker";
import { pl } from "date-fns/locale";
import {
  eachDayOfInterval,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  parseISO,
} from "date-fns";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getUserEmails } from "@/lib/admin-users.functions";
import { ReservationFormDialog } from "@/components/admin/ReservationFormDialog";
export const Route = createFileRoute("/admin/kalendarz")({
  component: KalendarzAdmin,
  validateSearch: (s: Record<string, unknown>) => ({
    prefillFromMessage: typeof s.prefillFromMessage === "string" ? s.prefillFromMessage : undefined,
  }),
});


// ============================================================
// Typy zajętości — kolory widoczne tylko w panelu admina
// ============================================================
type ItemType =
  | "potwierdzona"
  | "telefoniczna"
  | "manualna"
  | "serwis"
  | "wydanie"
  | "zwrot"
  | "inne";

const TYPE_META: Record<
  ItemType,
  { label: string; dot: string; bg: string; badge: string }
> = {
  potwierdzona: {
    label: "Rezerwacja potwierdzona",
    dot: "bg-green-500",
    bg: "bg-green-500/85 text-white",
    badge: "bg-green-100 text-green-800 border-green-200",
  },
  telefoniczna: {
    label: "Rezerwacja telefoniczna / e-mail",
    dot: "bg-blue-500",
    bg: "bg-blue-500/85 text-white animate-pulse",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  manualna: {
    label: "Blokada ręczna",
    dot: "bg-red-500",
    bg: "bg-red-500/85 text-white",
    badge: "bg-red-100 text-red-800 border-red-200",
  },
  serwis: {
    label: "Serwis / sprzątanie",
    dot: "bg-purple-500",
    bg: "bg-purple-500/85 text-white",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
  },
  wydanie: {
    label: "Wydanie przyczepy",
    dot: "bg-orange-300",
    bg: "bg-orange-300 text-orange-950",
    badge: "bg-orange-100 text-orange-900 border-orange-200",
  },
  zwrot: {
    label: "Zwrot przyczepy",
    dot: "bg-orange-700",
    bg: "bg-orange-700/90 text-white",
    badge: "bg-orange-200 text-orange-950 border-orange-300",
  },
  inne: {
    label: "Inne",
    dot: "bg-slate-700",
    bg: "bg-slate-700/85 text-white",
    badge: "bg-slate-200 text-slate-800 border-slate-300",
  },
};

const RESERVATION_TYPES: ItemType[] = ["potwierdzona", "telefoniczna"];
const BLOCK_TYPES: ItemType[] = ["manualna", "serwis", "wydanie", "zwrot", "inne"];
const ALL_TYPES: ItemType[] = [...RESERVATION_TYPES, ...BLOCK_TYPES];

// Common item shape used across the calendar, details panel, and table
type Item = {
  kind: "reservation" | "block";
  id: string;
  type: ItemType;
  start_date: string;
  end_date: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  reason?: string | null;
  internal_note?: string | null;
  expires_at?: string | null;
  resolved?: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function emptyForm() {
  return {
    type: "manualna" as ItemType,
    start_date: "",
    end_date: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    reason: "",
    internal_note: "",
  };
}

type FormState = ReturnType<typeof emptyForm>;

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

// ============================================================
// Główny komponent
// ============================================================
function KalendarzAdmin() {
  const qc = useQueryClient();
  const fetchUserEmails = useServerFn(getUserEmails);
  const search = useSearch({ from: "/admin/kalendarz" });

  const [range, setRange] = useState<DateRange | undefined>();
  const [month, setMonth] = useState<Date>(new Date());
  const [filter, setFilter] = useState<"all" | ItemType>("all");
  const [showSplit, setShowSplit] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKind, setEditingKind] = useState<"reservation" | "block" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [resvDialogOpen, setResvDialogOpen] = useState(false);
  const [resvDialogId, setResvDialogId] = useState<string | null>(null);
  const [resvInitialStart, setResvInitialStart] = useState<string | undefined>();
  const [resvInitialEnd, setResvInitialEnd] = useState<string | undefined>();

  const [conflictOpen, setConflictOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<(() => Promise<unknown>) | null>(null);

  // ===== Auto-purge expired phone reservations on every mount/refresh =====
  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      await supabase
        .from("reservations")
        .delete()
        .eq("status", "telefoniczna")
        .lt("expires_at", nowIso);
      qc.invalidateQueries({ queryKey: ["admin", "kalendarz"] });
      qc.invalidateQueries({ queryKey: ["unavailable-dates"] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Prefill form when navigating from a contact message =====
  useEffect(() => {
    const msgId = search.prefillFromMessage;
    if (!msgId) return;
    (async () => {
      const { data: msg } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("id", msgId)
        .maybeSingle();
      if (!msg) return;
      const [first, ...rest] = (msg.name || "").split(" ");
      setForm({
        ...emptyForm(),
        type: "telefoniczna",
        first_name: first || "",
        last_name: rest.join(" "),
        email: msg.email || "",
        phone: msg.phone || "",
        reason: msg.message || "",
        internal_note: `Z wiadomości z ${format(parseISO(msg.created_at), "d MMM yyyy, HH:mm", { locale: pl })}`,
      });
      setDialogOpen(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.prefillFromMessage]);


  // ===== Queries =====
  const { data: reservations = [] } = useQuery({
    queryKey: ["admin", "kalendarz", "reservations"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("reservations")
        .select("*")
        .in("status", ["potwierdzona", "telefoniczna"])
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("start_date", { ascending: true });
      return (data ?? []) as any[];
    },
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["admin", "kalendarz", "blocks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blocked_dates")
        .select("*")
        .order("start_date", { ascending: true });
      return (data ?? []) as any[];
    },
  });

  // ===== Unified item list =====
  const items: Item[] = useMemo(() => {
    const resvItems: Item[] = reservations.map((r) => ({
      kind: "reservation",
      id: r.id,
      type: r.status === "potwierdzona" ? "potwierdzona" : "telefoniczna",
      start_date: r.start_date,
      end_date: r.end_date,
      first_name: r.first_name,
      last_name: r.last_name,
      phone: r.phone,
      email: r.email,
      reason: r.trip_notes,
      internal_note: r.notes,
      expires_at: r.expires_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    const blockItems: Item[] = blocks.map((b) => ({
      kind: "block",
      id: b.id,
      type: (b.block_type ?? "inne") as ItemType,
      start_date: b.start_date,
      end_date: b.end_date,
      reason: b.reason,
      internal_note: b.internal_note,
      resolved: b.resolved,
      created_by: b.created_by,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));
    return [...resvItems, ...blockItems];
  }, [reservations, blocks]);

  // user emails for "kto dodał"
  const userIds = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.created_by).filter(Boolean) as string[]),
      ),
    [items],
  );
  const { data: emails = {} } = useQuery({
    queryKey: ["admin", "user-emails", userIds.join(",")],
    queryFn: () => fetchUserEmails({ data: { userIds } }),
    enabled: userIds.length > 0,
  });

  // ===== Filtered items for table =====
  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  // ===== Calendar modifiers — day → type =====
  const expandRange = (s: string, e: string): Date[] => {
    try {
      return eachDayOfInterval({ start: parseISO(s), end: parseISO(e) });
    } catch {
      return [];
    }
  };

  // Map: yyyy-mm-dd -> Item[] (ordered by priority)
  const dayMap = useMemo(() => {
    const m = new Map<string, Item[]>();
    items.forEach((it) => {
      expandRange(it.start_date, it.end_date).forEach((d) => {
        const k = format(d, "yyyy-MM-dd");
        const arr = m.get(k) ?? [];
        arr.push(it);
        m.set(k, arr);
      });
    });
    return m;
  }, [items]);

  // ===== Detail panel =====
  const selectedItem: Item | null = useMemo(() => {
    if (!selectedItemKey) return null;
    const [kind, id] = selectedItemKey.split(":");
    return items.find((i) => i.kind === kind && i.id === id) ?? null;
  }, [selectedItemKey, items]);

  // Re-render every minute for live phone-reservation countdown
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // ===== Range select → open form dialog =====
  useEffect(() => {
    if (range?.from && range?.to) {
      setForm((f) => ({
        ...f,
        start_date: format(range.from!, "yyyy-MM-dd"),
        end_date: format(range.to!, "yyyy-MM-dd"),
      }));
      if (!editingId) {
        setDialogOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.from, range?.to]);

  // ===== Conflict detection =====
  const hasConflict = (start: string, end: string, ignoreKey?: string) =>
    items.some((it) => {
      if (ignoreKey && `${it.kind}:${it.id}` === ignoreKey) return false;
      return it.start_date <= end && it.end_date >= start;
    });

  // ===== Submit =====
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "kalendarz"] });
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["unavailable-dates"] });
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm());
    setRange(undefined);
    setEditingId(null);
    setEditingKind(null);
  };

  const persistItem = async () => {
    const isReservation: boolean = (RESERVATION_TYPES as string[]).includes(form.type);

    if (isReservation) {
      const status = form.type === "potwierdzona" ? "potwierdzona" : "telefoniczna";
      const payload: any = {
        start_date: form.start_date,
        end_date: form.end_date,
        first_name: form.first_name || "—",
        last_name: form.last_name || "—",
        phone: form.phone || "—",
        email: form.email || "—",
        people_count: 2,
        trip_notes: form.reason || null,
        notes: form.internal_note || null,
        status,
        expires_at:
          status === "telefoniczna"
            ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            : null,
      };

      if (editingId && editingKind === "reservation") {
        const { error } = await supabase
          .from("reservations")
          .update(payload)
          .eq("id", editingId);
        if (error) return toast.error(error.message);
        toast.success("Rezerwacja zaktualizowana");
      } else if (editingId && editingKind === "block") {
        // Switching from block to reservation — delete block, create reservation
        await supabase.from("blocked_dates").delete().eq("id", editingId);
        const { error } = await supabase.from("reservations").insert(payload);
        if (error) return toast.error(error.message);
        toast.success("Zamieniono na rezerwację");
      } else {
        const { error } = await supabase.from("reservations").insert(payload);
        if (error)
          return toast.error(
            error.message.includes("nakłada")
              ? "Termin nakłada się na istniejącą rezerwację"
              : error.message,
          );
        toast.success("Rezerwacja dodana");
      }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const payload: any = {
        start_date: form.start_date,
        end_date: form.end_date,
        block_type: form.type,
        reason: form.reason || null,
        internal_note: form.internal_note || null,
        client_visible_as_unavailable: true,
      };
      if (editingId && editingKind === "block") {
        const { error } = await supabase
          .from("blocked_dates")
          .update(payload)
          .eq("id", editingId);
        if (error) return toast.error(error.message);
        toast.success("Blokada zaktualizowana");
      } else if (editingId && editingKind === "reservation") {
        await supabase.from("reservations").delete().eq("id", editingId);
        const { error } = await supabase
          .from("blocked_dates")
          .insert({ ...payload, created_by: userData.user?.id ?? null });
        if (error) return toast.error(error.message);
        toast.success("Zamieniono na blokadę");
      } else {
        const { error } = await supabase
          .from("blocked_dates")
          .insert({ ...payload, created_by: userData.user?.id ?? null });
        if (error)
          return toast.error(
            error.message.includes("nakłada")
              ? "Termin nakłada się na istniejącą rezerwację"
              : error.message,
          );
        toast.success("Termin zablokowany");
      }
    }
    closeDialog();
    invalidateAll();
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) {
      toast.error("Wybierz datę od i do");
      return;
    }
    if (form.end_date < form.start_date) {
      toast.error("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.");
      return;
    }
    const editKey = editingId && editingKind ? `${editingKind}:${editingId}` : undefined;
    if (hasConflict(form.start_date, form.end_date, editKey)) {
      setPendingSubmit(() => persistItem);
      setConflictOpen(true);
      return;
    }
    await persistItem();
  };

  // ===== Item actions =====
  const openDetails = (it: Item) => {
    setSelectedItemKey(`${it.kind}:${it.id}`);
  };

  const startEdit = (it: Item) => {
    if (it.kind === "reservation") {
      // Otwórz nowy pełny formularz finansowy
      setResvDialogId(it.id);
      setResvInitialStart(undefined);
      setResvInitialEnd(undefined);
      setResvDialogOpen(true);
      return;
    }
    setEditingId(it.id);
    setEditingKind(it.kind);
    setForm({
      type: it.type,
      start_date: it.start_date,
      end_date: it.end_date,
      first_name: it.first_name ?? "",
      last_name: it.last_name ?? "",
      phone: it.phone ?? "",
      email: it.email ?? "",
      reason: it.reason ?? "",
      internal_note: it.internal_note ?? "",
    });
    setDialogOpen(true);
  };

  const openNewReservation = () => {
    setResvDialogId(null);
    setResvInitialStart(range?.from ? format(range.from, "yyyy-MM-dd") : undefined);
    setResvInitialEnd(range?.to ? format(range.to, "yyyy-MM-dd") : undefined);
    setResvDialogOpen(true);
  };

  const removeItem = async (it: Item) => {
    if (!confirm("Usunąć tę pozycję?")) return;
    const tbl = it.kind === "reservation" ? "reservations" : "blocked_dates";
    const { error } = await supabase.from(tbl).delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Usunięto");
    setSelectedItemKey(null);
    invalidateAll();
  };

  const confirmPhone = async (it: Item) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "potwierdzona", expires_at: null })
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Rezerwacja potwierdzona");
    invalidateAll();
  };

  const markPrepared = async (it: Item) => {
    const { error } = await supabase
      .from("blocked_dates")
      .update({ resolved: true })
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Oznaczono jako przygotowane");
    invalidateAll();
  };

  // ===== Render =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Kalendarz i rezerwacje</h1>
          <p className="text-sm text-muted-foreground">
            Zarządzaj rezerwacjami, wydaniami, zwrotami i blokadami terminów.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={openNewReservation}
            className="bg-gradient-sunset text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nowa rezerwacja
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(null);
              setEditingKind(null);
              setForm({ ...emptyForm(), type: "manualna" });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Dodaj blokadę
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Wszystkie
        </FilterChip>
        {ALL_TYPES.map((t) => (
          <FilterChip
            key={t}
            active={filter === t}
            onClick={() => setFilter(t)}
            dotCls={TYPE_META[t].dot}
          >
            {TYPE_META[t].label}
          </FilterChip>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showSplit}
            onChange={(e) => setShowSplit(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Pokaż podział dnia (do/po 14:00)
        </label>
      </div>

      {/* Calendar + Details */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <CalendarView
            range={range}
            onRangeChange={setRange}
            month={month}
            onMonthChange={setMonth}
            dayMap={dayMap}
            onDayClick={openDetails}
            showSplit={showSplit}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Kliknij datę początkową, a następnie końcową — formularz otworzy się
            automatycznie. Kliknij zajęty dzień, by zobaczyć szczegóły.
          </p>
        </div>

        <DetailsPanel
          item={selectedItem}
          emails={emails as Record<string, string>}
          onClose={() => setSelectedItemKey(null)}
          onEdit={startEdit}
          onRemove={removeItem}
          onConfirmPhone={confirmPhone}
          onMarkPrepared={markPrepared}
        />
      </div>

      {/* Table */}
      <ItemsTable
        items={filteredItems}
        onView={openDetails}
        onEdit={startEdit}
        onRemove={removeItem}
        onConfirmPhone={confirmPhone}
      />

      {/* Pełny formularz rezerwacji (z finansami) */}
      <ReservationFormDialog
        open={resvDialogOpen}
        onOpenChange={setResvDialogOpen}
        reservationId={resvDialogId}
        initialStart={resvInitialStart}
        initialEnd={resvInitialEnd}
        onSaved={invalidateAll}
      />

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edytuj pozycję" : "Dodaj rezerwację lub blokadę"}
            </DialogTitle>
            <DialogDescription>
              Wybierz typ zajętości i uzupełnij szczegóły.
            </DialogDescription>
          </DialogHeader>
          <ItemForm form={form} setForm={setForm} onSubmit={submitForm} onCancel={closeDialog} />
        </DialogContent>
      </Dialog>

      {/* Conflict alert */}
      <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin jest już zajęty</AlertDialogTitle>
            <AlertDialogDescription>
              Ten termin jest już zajęty. Sprawdź szczegóły w kalendarzu przed
              dodaniem kolejnej pozycji.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSubmit(null)}>
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const fn = pendingSubmit;
                setPendingSubmit(null);
                if (fn) await fn();
              }}
            >
              Dodaj mimo to
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Kalendarz
// ============================================================
function CalendarView({
  range,
  onRangeChange,
  month,
  onMonthChange,
  dayMap,
  onDayClick,
  showSplit,
}: {
  range: DateRange | undefined;
  onRangeChange: (r: DateRange | undefined) => void;
  month: Date;
  onMonthChange: (d: Date) => void;
  dayMap: Map<string, Item[]>;
  onDayClick: (i: Item) => void;
  showSplit: boolean;
}) {
  // Priority for the FULL-cell background. wydanie/zwrot are rendered as
  // half-day triangles separately, so we skip them here.
  const pickPrimary = (arr: Item[]): Item | undefined => {
    const order: ItemType[] = [
      "potwierdzona",
      "telefoniczna",
      "manualna",
      "serwis",
      "inne",
    ];
    for (const t of order) {
      const found = arr.find((i) => i.type === t);
      if (found) return found;
    }
    return undefined;
  };

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={onRangeChange}
      locale={pl}
      weekStartsOn={1}
      month={month}
      onMonthChange={onMonthChange}
      numberOfMonths={2}
      className={cn("p-0 pointer-events-auto")}
      classNames={{
        months: "flex flex-col md:flex-row gap-6",
        month: "space-y-3 relative",
        month_caption: "flex h-9 items-center justify-center text-sm font-semibold",
        caption_label: "text-sm font-semibold",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1 z-10 pointer-events-none",
        button_previous:
          "pointer-events-auto h-7 w-7 inline-flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-muted",
        button_next:
          "pointer-events-auto h-7 w-7 inline-flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-muted",
        chevron: "h-4 w-4 fill-current",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-10 font-normal text-xs",
        week: "flex w-full mt-1",
        day: "h-10 w-10 text-center text-sm p-0 relative",
        day_button: "h-10 w-10 p-0 font-normal hover:bg-muted rounded-md",
        today: "ring-1 ring-primary/40",
        outside: "text-muted-foreground/40",
      }}

      components={{
        DayButton: ({ day, modifiers: _m, ...rest }: any) => {
          const k = format(day.date, "yyyy-MM-dd");
          const dayItems = dayMap.get(k) ?? [];
          const primary = pickPrimary(dayItems);

          // Half-day visualization sources:
          // 1. Reservation start/end days (auto-derived)
          // 2. Block items explicitly typed "wydanie" / "zwrot"
          let hasWydanie = false;
          let hasZwrot = false;
          let halfItem: Item | undefined;
          if (showSplit) {
            for (const it of dayItems) {
              if (it.type === "wydanie") {
                hasWydanie = true;
                halfItem = halfItem ?? it;
              } else if (it.type === "zwrot") {
                hasZwrot = true;
                halfItem = halfItem ?? it;
              } else if (
                it.kind === "reservation" &&
                (it.type === "potwierdzona" || it.type === "telefoniczna")
              ) {
                if (isSameDay(parseISO(it.start_date), day.date)) hasWydanie = true;
                if (isSameDay(parseISO(it.end_date), day.date)) hasZwrot = true;
              }
            }
          }


          const handleClick = (e: React.MouseEvent) => {
            const target = primary ?? halfItem;
            if (target) {
              e.preventDefault();
              e.stopPropagation();
              onDayClick(target);
              return;
            }
            rest.onClick?.(e);
          };

          if (!primary && !hasWydanie && !hasZwrot) {
            return (
              <button
                type="button"
                {...rest}
                onClick={handleClick}
                className={cn(
                  "relative h-10 w-10 rounded-md text-sm hover:bg-muted",
                  rest.className,
                )}
              >
                {day.date.getDate()}
              </button>
            );
          }

          const meta = primary ? TYPE_META[primary.type] : null;

          return (
            <button
              type="button"
              {...rest}
              onClick={handleClick}
              className={cn(
                "relative h-10 w-10 overflow-hidden rounded-md text-sm",
                rest.className,
              )}
              title={
                dayItems
                  .map((it) => `${TYPE_META[it.type].label}${it.reason ? ` — ${it.reason}` : ""}`)
                  .join("\n") || undefined
              }
            >
              {meta && (
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center font-semibold",
                    meta.bg,
                  )}
                />
              )}
              {/* Half-day overlays: TOP = zwrot (do 14:00, ciemny pomarańczowy), BOTTOM = wydanie (po 14:00, jasny pomarańczowy) */}
              {hasZwrot && (
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 right-0 top-0 h-1/2",
                    TYPE_META.zwrot.bg,
                  )}
                  aria-label="Zwrot do 14:00"
                />
              )}
              {hasWydanie && (
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 right-0 bottom-0 h-1/2",
                    TYPE_META.wydanie.bg,
                  )}
                  aria-label="Wydanie po 14:00"
                />
              )}

              <span className="relative z-10 font-semibold">{day.date.getDate()}</span>
            </button>
          );
        },

      }}
    />
  );
}

// ============================================================
// Panel szczegółów
// ============================================================
function DetailsPanel({
  item,
  emails,
  onClose,
  onEdit,
  onRemove,
  onConfirmPhone,
  onMarkPrepared,
}: {
  item: Item | null;
  emails: Record<string, string>;
  onClose: () => void;
  onEdit: (i: Item) => void;
  onRemove: (i: Item) => void;
  onConfirmPhone: (i: Item) => void;
  onMarkPrepared: (i: Item) => void;
}) {
  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
        <div className="font-display text-base font-semibold text-foreground">
          Szczegóły pozycji
        </div>
        <p className="mt-2">
          Kliknij zajęty dzień w kalendarzu lub pozycję w tabeli, aby zobaczyć
          szczegóły.
        </p>
        <div className="mt-6 space-y-2 text-xs">
          <div className="font-semibold uppercase text-foreground">Legenda</div>
          {ALL_TYPES.map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-sm", TYPE_META[t].dot)} />
              {TYPE_META[t].label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const meta = TYPE_META[item.type];
  const isPhone = item.type === "telefoniczna";
  const expiresLeft =
    isPhone && item.expires_at
      ? formatDistanceToNowStrict(parseISO(item.expires_at), { locale: pl, addSuffix: false })
      : null;
  const isExpired = isPhone && item.expires_at && new Date(item.expires_at) < new Date();

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold",
              meta.badge,
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", meta.dot)} /> {meta.label}
          </span>
          <h3 className="mt-2 font-display text-lg font-semibold">
            {format(parseISO(item.start_date), "d MMM", { locale: pl })} –{" "}
            {format(parseISO(item.end_date), "d MMM yyyy", { locale: pl })}
          </h3>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Zamknij
        </button>
      </div>

      <dl className="space-y-2 text-sm">
        {item.kind === "reservation" && (
          <>
            <Row label="Klient">
              {item.first_name} {item.last_name}
            </Row>
            <Row label="Telefon">{item.phone || "—"}</Row>
            <Row label="E-mail">{item.email || "—"}</Row>
          </>
        )}
        {item.reason && <Row label={item.kind === "reservation" ? "Plan wyjazdu" : "Powód"}>{item.reason}</Row>}
        {item.internal_note && (
          <Row label="Notatka wewnętrzna">
            <span className="whitespace-pre-wrap">{item.internal_note}</span>
          </Row>
        )}
        {item.created_by && (
          <Row label="Dodał">{emails[item.created_by] ?? item.created_by.slice(0, 8)}</Row>
        )}
        <Row label="Dodano">
          {format(parseISO(item.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
        </Row>
        {item.updated_at && (
          <Row label="Ostatnia zmiana">
            {format(parseISO(item.updated_at), "d MMM yyyy, HH:mm", { locale: pl })}
          </Row>
        )}
        {isPhone && item.expires_at && (
          <Row label="Wygasa">
            <span className={cn(isExpired ? "text-destructive font-semibold" : "")}>
              {format(parseISO(item.expires_at), "d MMM, HH:mm", { locale: pl })}{" "}
              {!isExpired && (
                <span className="text-xs text-muted-foreground">(za {expiresLeft})</span>
              )}
              {isExpired && <span className="text-xs">(wygasła)</span>}
            </span>
          </Row>
        )}
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {isPhone && (
          <Button size="sm" onClick={() => onConfirmPhone(item)}>
            <CheckCircle2 className="h-4 w-4" /> Potwierdź rezerwację
          </Button>
        )}
        {item.kind === "block" && item.type === "serwis" && !item.resolved && (
          <Button size="sm" variant="secondary" onClick={() => onMarkPrepared(item)}>
            <Sparkles className="h-4 w-4" /> Oznacz jako przygotowane
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4" /> Edytuj
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onRemove(item)}>
          <Trash2 className="h-4 w-4" /> Usuń
        </Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="min-w-28 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="flex-1 text-sm">{children}</dd>
    </div>
  );
}

// ============================================================
// Formularz
// ============================================================
function ItemForm({
  form,
  setForm,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const isReservation = (RESERVATION_TYPES as string[]).includes(form.type);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Typ zajętości</Label>
        <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as ItemType }))}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                <span className="inline-flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_META[t].dot)} />
                  {TYPE_META[t].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Data od</Label>
          <input
            required
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data do</Label>
          <input
            required
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className={inputCls}
          />
        </div>
      </div>

      {isReservation && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Imię</Label>
              <input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nazwisko</Label>
              <input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Telefon</Label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail (opcjonalnie)</Label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">{isReservation ? "Plan wyjazdu (opcjonalnie)" : "Powód"}</Label>
        <input
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Notatka wewnętrzna (tylko admin)</Label>
        <textarea
          rows={2}
          value={form.internal_note}
          onChange={(e) => setForm((f) => ({ ...f, internal_note: e.target.value }))}
          className={cn(inputCls, "resize-y")}
        />
      </div>

      {form.type === "telefoniczna" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
          Rezerwacja telefoniczna wygaśnie automatycznie po 48 godzinach, jeżeli nie
          zostanie potwierdzona.
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" className="bg-gradient-sunset text-primary-foreground hover:opacity-90">
          Zapisz
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================================
// Tabela
// ============================================================
function ItemsTable({
  items,
  onView,
  onEdit,
  onRemove,
  onConfirmPhone,
}: {
  items: Item[];
  onView: (i: Item) => void;
  onEdit: (i: Item) => void;
  onRemove: (i: Item) => void;
  onConfirmPhone: (i: Item) => void;
}) {
  const sorted = [...items].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Od</th>
              <th className="px-4 py-3">Do</th>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Klient</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Powód</th>
              <th className="px-4 py-3">Wygasa</th>
              <th className="px-4 py-3 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((it) => {
              const meta = TYPE_META[it.type];
              const isPhone = it.type === "telefoniczna";
              return (
                <tr key={`${it.kind}:${it.id}`} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(parseISO(it.start_date), "d MMM yyyy", { locale: pl })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(parseISO(it.end_date), "d MMM yyyy", { locale: pl })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                        meta.badge,
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {it.kind === "reservation"
                      ? `${it.first_name ?? ""} ${it.last_name ?? ""}`.trim()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {it.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {it.reason || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {isPhone && it.expires_at
                      ? format(parseISO(it.expires_at), "d MMM HH:mm", { locale: pl })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onView(it)}>
                        Podgląd
                      </Button>
                      {isPhone && (
                        <Button size="sm" variant="ghost" onClick={() => onConfirmPhone(it)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => onEdit(it)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(it)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  Brak pozycji
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Filter chip
// ============================================================
function FilterChip({
  active,
  onClick,
  children,
  dotCls,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dotCls?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-gradient-sunset text-primary-foreground"
          : "border border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {dotCls && <span className={cn("h-2 w-2 rounded-full", dotCls)} />}
      {children}
    </button>
  );
}
