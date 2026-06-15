import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Pencil, History, Search, Phone, Mail, PawPrint, Flame, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReservationFormDialog } from "@/components/admin/ReservationFormDialog";

export const Route = createFileRoute("/admin/rezerwacje")({
  component: RezerwacjeAdmin,
});

type Reservation = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  start_date: string;
  end_date: string;
  nights: number | null;
  status: string;
  settlement_status: string | null;
  rental_total: number | null;
  total_amount: number | null;
  base_cost: number | null;
  service_fee: number | null;
  addons_total: number | null;
  deposit: number | null;
  has_pet: boolean | null;
  has_grill: boolean | null;
  is_abroad: boolean | null;
  created_at: string;
};

type Payment = {
  reservation_id: string;
  amount: number;
  status: string;
  type: string;
};

type Deposit = {
  reservation_id: string;
  required_amount: number | null;
  collected: boolean | null;
  collected_amount: number | null;
  returned: boolean | null;
  returned_amount: number | null;
  deduction_amount: number | null;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  zapytanie: { label: "Zapytanie", cls: "bg-blue-100 text-blue-800 border-blue-200 animate-pulse" },
  oczekuje_na_zadatek: { label: "Oczekuje na zadatek", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  potwierdzona: { label: "Potwierdzona", cls: "bg-green-100 text-green-800 border-green-200" },
  oplacona: { label: "Opłacona", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  wydana: { label: "Wydana", cls: "bg-orange-100 text-orange-900 border-orange-200" },
  zwrocona: { label: "Zwrócona", cls: "bg-orange-200 text-orange-950 border-orange-300" },
  rozliczona: { label: "Rozliczona", cls: "bg-teal-100 text-teal-800 border-teal-200" },
  anulowana: { label: "Anulowana", cls: "bg-red-100 text-red-700 border-red-200" },
  telefoniczna: { label: "Telefoniczna", cls: "bg-blue-100 text-blue-800 border-blue-200" },
};

const SETTLEMENT_META: Record<string, { label: string; cls: string }> = {
  brak_wplat: { label: "Brak wpłat", cls: "bg-slate-100 text-slate-700" },
  zadatek_wplacony: { label: "Zadatek wpłacony", cls: "bg-blue-100 text-blue-800" },
  czesciowo_oplacone: { label: "Częściowo opłacone", cls: "bg-amber-100 text-amber-800" },
  oplacone_w_calosci: { label: "Opłacone w całości", cls: "bg-emerald-100 text-emerald-800" },
  kaucja_pobrana: { label: "Kaucja pobrana", cls: "bg-purple-100 text-purple-800" },
  kaucja_do_zwrotu: { label: "Kaucja do zwrotu", cls: "bg-orange-100 text-orange-900" },
  kaucja_rozliczona: { label: "Kaucja rozliczona", cls: "bg-teal-100 text-teal-800" },
  zamkniete: { label: "Zamknięte", cls: "bg-green-100 text-green-800" },
};

type FilterKey =
  | "all"
  | "zapytania"
  | "active"
  | "oczekuje_na_zadatek"
  | "zadatek_wplacony"
  | "czesciowo_oplacone"
  | "oplacone_w_calosci"
  | "kaucja_niepobrana"
  | "kaucja_pobrana"
  | "kaucja_do_zwrotu"
  | "rozliczone"
  | "ze_zwierzeciem"
  | "zagranica"
  | "anulowane";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Wszystkie" },
  { key: "zapytania", label: "Nowe zapytania" },
  { key: "active", label: "Aktywne" },
  { key: "oczekuje_na_zadatek", label: "Oczekują na zadatek" },
  { key: "zadatek_wplacony", label: "Zadatek wpłacony" },
  { key: "czesciowo_oplacone", label: "Częściowo opłacone" },
  { key: "oplacone_w_calosci", label: "Opłacone w całości" },
  { key: "kaucja_niepobrana", label: "Kaucja niepobrana" },
  { key: "kaucja_pobrana", label: "Kaucja pobrana" },
  { key: "kaucja_do_zwrotu", label: "Kaucja do zwrotu" },
  { key: "rozliczone", label: "Rozliczone" },
  { key: "ze_zwierzeciem", label: "Ze zwierzęciem" },
  { key: "zagranica", label: "Zagranica" },
  { key: "anulowane", label: "Anulowane" },
];

const fmtPln = (n: number | null | undefined) =>
  n == null ? "—" : `${Number(n).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;

function RezerwacjeAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<{ type: "email" | "phone"; value: string } | null>(null);

  const { data: reservations = [] } = useQuery({
    queryKey: ["admin", "rezerwacje", "list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select(
          "id, first_name, last_name, email, phone, start_date, end_date, nights, status, settlement_status, rental_total, total_amount, base_cost, service_fee, addons_total, deposit, has_pet, has_grill, is_abroad, created_at",
        )
        .order("start_date", { ascending: false });
      return (data ?? []) as Reservation[];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin", "rezerwacje", "payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservation_payments")
        .select("reservation_id, amount, status, type");
      return (data ?? []) as Payment[];
    },
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ["admin", "rezerwacje", "deposits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservation_deposits")
        .select(
          "reservation_id, required_amount, collected, collected_amount, returned, returned_amount, deduction_amount",
        );
      return (data ?? []) as Deposit[];
    },
  });

  const paymentsBy = useMemo(() => {
    const m = new Map<string, Payment[]>();
    payments.forEach((p) => {
      const arr = m.get(p.reservation_id) ?? [];
      arr.push(p);
      m.set(p.reservation_id, arr);
    });
    return m;
  }, [payments]);

  const depositBy = useMemo(() => {
    const m = new Map<string, Deposit>();
    deposits.forEach((d) => m.set(d.reservation_id, d));
    return m;
  }, [deposits]);

  const enriched = useMemo(() => {
    return reservations.map((r) => {
      const pays = paymentsBy.get(r.id) ?? [];
      const paid = pays
        .filter((p) => p.status === "wplacono")
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const rental = Number(r.rental_total ?? r.total_amount ?? 0);
      const due = Math.max(0, rental - paid);
      const dep = depositBy.get(r.id);
      const hasDeposit = !!dep?.collected;
      const depReturned = !!dep?.returned;
      return { r, paid, rental, due, dep, hasDeposit, depReturned };
    });
  }, [reservations, paymentsBy, depositBy]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ r, paid, rental, hasDeposit, depReturned }) => {
      if (q) {
        const hay = `${r.first_name} ${r.last_name} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (filter) {
        case "all":
          return true;
        case "zapytania":
          return r.status === "zapytanie";
        case "active":
          return !["anulowana", "rozliczona", "zamkniete", "zapytanie"].includes(r.status);
        case "anulowane":
          return r.status === "anulowana";
        case "rozliczone":
          return r.status === "rozliczona" || r.settlement_status === "zamkniete";
        case "ze_zwierzeciem":
          return !!r.has_pet;
        case "zagranica":
          return !!r.is_abroad;
        case "kaucja_niepobrana":
          return !hasDeposit;
        case "kaucja_pobrana":
          return hasDeposit && !depReturned;
        case "kaucja_do_zwrotu":
          return hasDeposit && !depReturned &&
            ["zwrocona", "oplacona", "rozliczona"].includes(r.status);
        case "oczekuje_na_zadatek":
          return r.status === "oczekuje_na_zadatek" || (paid === 0 && r.status !== "anulowana");
        case "zadatek_wplacony":
          return r.settlement_status === "zadatek_wplacony" || (paid > 0 && paid < rental);
        case "czesciowo_oplacone":
          return paid > 0 && paid < rental;
        case "oplacone_w_calosci":
          return rental > 0 && paid >= rental;
        default:
          return true;
      }
    });
  }, [enriched, filter, search]);

  const openEdit = (id: string) => {
    setEditId(id);
    setEditOpen(true);
  };

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "rezerwacje"] });
    qc.invalidateQueries({ queryKey: ["admin", "kalendarz"] });
    qc.invalidateQueries({ queryKey: ["unavailable-dates"] });
  };

  const acceptInquiry = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "potwierdzona" })
      .eq("id", id);
    if (error) {
      toast.error(
        error.message.includes("nakłada")
          ? "Termin nakłada się na istniejącą rezerwację"
          : error.message,
      );
      return;
    }
    toast.success("Rezerwacja zaakceptowana — widoczna w kalendarzu");
    invalidateAll();
  };

  const rejectInquiry = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "anulowana" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Zapytanie odrzucone");
    invalidateAll();
  };

  const deleteReservation = async (id: string) => {
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rezerwacja usunięta");
    setDeleteId(null);
    invalidateAll();
  };

  const toDelete = useMemo(
    () => enriched.find((e) => e.r.id === deleteId)?.r ?? null,
    [enriched, deleteId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Rezerwacje</h1>
          <p className="text-sm text-muted-foreground">
            Pełna lista rezerwacji z rozliczeniem finansowym i historią klienta.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj: imię, e-mail, telefon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              filter === f.key
                ? "bg-gradient-sunset text-primary-foreground shadow-soft"
                : "border border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Klient</th>
                <th className="px-3 py-3">Termin</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Koszt</th>
                <th className="px-3 py-3 text-right">Wpłacono</th>
                <th className="px-3 py-3 text-right">Do zapłaty</th>
                <th className="px-3 py-3 text-right">Kaucja</th>
                <th className="px-3 py-3 text-center">🐾</th>
                <th className="px-3 py-3">Rozliczenie</th>
                <th className="px-3 py-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(({ r, paid, rental, due, dep, hasDeposit, depReturned }) => {
                const stMeta = STATUS_META[r.status] ?? STATUS_META.zapytanie;
                const setMeta =
                  SETTLEMENT_META[r.settlement_status ?? "brak_wplat"] ?? SETTLEMENT_META.brak_wplat;
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <div className="font-medium">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5 text-[11px] text-muted-foreground">
                        {r.email && (
                          <button
                            type="button"
                            onClick={() => setHistoryKey({ type: "email", value: r.email! })}
                            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                          >
                            <Mail className="h-3 w-3" /> {r.email}
                          </button>
                        )}
                        {r.phone && (
                          <button
                            type="button"
                            onClick={() => setHistoryKey({ type: "phone", value: r.phone! })}
                            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                          >
                            <Phone className="h-3 w-3" /> {r.phone}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                      {format(parseISO(r.start_date), "d MMM yyyy", { locale: pl })}
                      <span className="text-muted-foreground"> – </span>
                      {format(parseISO(r.end_date), "d MMM yyyy", { locale: pl })}
                      {r.nights && (
                        <div className="text-[11px] text-muted-foreground">{r.nights} dób</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", stMeta.cls)}>
                        {stMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">{fmtPln(rental)}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-emerald-700">
                      {fmtPln(paid)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 text-right whitespace-nowrap font-medium",
                        due > 0 ? "text-amber-700" : "text-muted-foreground",
                      )}
                    >
                      {fmtPln(due)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-xs">
                      {hasDeposit ? (
                        <div>
                          <div className="font-medium text-purple-700">
                            {fmtPln(dep?.collected_amount ?? dep?.required_amount ?? r.deposit)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {depReturned ? "zwrócona" : "pobrana"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">niepobrana</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {r.has_pet || r.has_grill ? (
                        <div className="flex items-center justify-center gap-1">
                          {r.has_pet && (
                            <PawPrint className="h-4 w-4 text-orange-600" aria-label="Ze zwierzęciem" />
                          )}
                          {r.has_grill && (
                            <Flame className="h-4 w-4 text-red-600" aria-label="Z grillem" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", setMeta.cls)}>
                        {setMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "zapytanie" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Akceptuj zapytanie"
                              onClick={() => acceptInquiry(r.id)}
                              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Odrzuć zapytanie"
                              onClick={() => rejectInquiry(r.id)}
                              className="text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" title="Edytuj" onClick={() => openEdit(r.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Usuń"
                          onClick={() => setDeleteId(r.id)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                    Brak rezerwacji pasujących do filtra
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReservationFormDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditId(null);
        }}
        reservationId={editId}
        onSaved={invalidateAll}
      />

      <ClientHistorySheet
        keyData={historyKey}
        onClose={() => setHistoryKey(null)}
        onOpenReservation={(id) => {
          setHistoryKey(null);
          openEdit(id);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć rezerwację?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `Rezerwacja ${toDelete.first_name} ${toDelete.last_name} (${format(parseISO(toDelete.start_date), "d MMM yyyy", { locale: pl })} – ${format(parseISO(toDelete.end_date), "d MMM yyyy", { locale: pl })}) zostanie trwale usunięta wraz z powiązanymi wpłatami i kaucją. Tej operacji nie można cofnąć.`
                : "Tej operacji nie można cofnąć."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteReservation(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClientHistorySheet({
  keyData,
  onClose,
  onOpenReservation,
}: {
  keyData: { type: "email" | "phone"; value: string } | null;
  onClose: () => void;
  onOpenReservation: (id: string) => void;
}) {
  const { data: history = [] } = useQuery({
    queryKey: ["admin", "client-history", keyData?.type, keyData?.value],
    enabled: !!keyData,
    queryFn: async () => {
      if (!keyData) return [];
      const col = keyData.type === "email" ? "email" : "phone";
      const { data } = await supabase
        .from("reservations")
        .select(
          "id, first_name, last_name, email, phone, start_date, end_date, status, rental_total, total_amount, has_pet, has_grill, is_abroad, created_at",
        )
        .eq(col, keyData.value)
        .order("start_date", { ascending: false });
      return (data ?? []) as Reservation[];
    },
  });

  const totals = useMemo(() => {
    const rental = history.reduce(
      (s, h) => s + Number(h.rental_total ?? h.total_amount ?? 0),
      0,
    );
    const pets = history.filter((h) => h.has_pet).length;
    const abroad = history.filter((h) => h.is_abroad).length;
    return { count: history.length, rental, pets, abroad };
  }, [history]);

  const client = history[0];

  return (
    <Sheet open={!!keyData} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Historia klienta</SheetTitle>
          <SheetDescription>
            {keyData?.type === "email" ? "Po e-mailu: " : "Po telefonie: "}
            <span className="font-medium text-foreground">{keyData?.value}</span>
          </SheetDescription>
        </SheetHeader>

        {client && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
            <div className="font-display text-lg font-semibold">
              {client.first_name} {client.last_name}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {client.email && <div>{client.email}</div>}
              {client.phone && <div>{client.phone}</div>}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Rezerwacji" value={totals.count.toString()} />
          <Stat label="Suma" value={fmtPln(totals.rental)} />
          <Stat label="Ze zwierzęciem" value={totals.pets.toString()} />
          <Stat label="Zagranica" value={totals.abroad.toString()} />
        </div>

        <div className="mt-6 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Wszystkie rezerwacje
          </div>
          {history.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Brak innych rezerwacji
            </div>
          )}
          {history.map((h) => {
            const meta = STATUS_META[h.status] ?? STATUS_META.zapytanie;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onOpenReservation(h.id)}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left hover:bg-muted/40"
              >
                <div>
                  <div className="text-sm font-medium">
                    {format(parseISO(h.start_date), "d MMM yyyy", { locale: pl })} –{" "}
                    {format(parseISO(h.end_date), "d MMM yyyy", { locale: pl })}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", meta.cls)}>
                      {meta.label}
                    </span>
                    {h.has_pet && <PawPrint className="h-3 w-3 text-orange-600" />}
                    {h.has_grill && <Flame className="h-3 w-3 text-red-600" />}
                  </div>
                </div>
                <div className="text-right text-sm font-medium">
                  {fmtPln(h.rental_total ?? h.total_amount)}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <History className="h-3 w-3" /> Kliknij rezerwację, aby otworzyć jej szczegóły.
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
