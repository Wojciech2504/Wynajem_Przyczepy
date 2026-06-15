import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  calculatePricing,
  formatPln,
  getSeasonForDate,
  SEASON_LABEL,
} from "@/lib/pricing";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const RESERVATION_STATUS_OPTIONS = [
  { value: "zapytanie", label: "Zapytanie" },
  { value: "oczekuje_na_zadatek", label: "Oczekuje na zadatek" },
  { value: "potwierdzona", label: "Rezerwacja potwierdzona" },
  { value: "oplacona", label: "Wynajem opłacony" },
  { value: "wydana", label: "Przyczepa wydana" },
  { value: "zwrocona", label: "Przyczepa zwrócona" },
  { value: "rozliczona", label: "Rozliczona" },
  { value: "anulowana", label: "Anulowana" },
  { value: "telefoniczna", label: "Telefoniczna / e-mail" },
];

const SETTLEMENT_STATUS_OPTIONS = [
  { value: "brak_wplat", label: "Brak wpłat" },
  { value: "zadatek_wplacony", label: "Zadatek wpłacony" },
  { value: "czesciowo_oplacone", label: "Częściowo opłacone" },
  { value: "oplacone_w_calosci", label: "Opłacone w całości" },
  { value: "kaucja_pobrana", label: "Kaucja pobrana" },
  { value: "kaucja_do_zwrotu", label: "Kaucja do zwrotu" },
  { value: "kaucja_rozliczona", label: "Kaucja rozliczona" },
  { value: "zamkniete", label: "Rozliczenie zamknięte" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "zadatek", label: "Zadatek" },
  { value: "doplata", label: "Dopłata do wynajmu" },
  { value: "pelna_platnosc", label: "Pełna płatność za wynajem" },
  { value: "dodatki", label: "Opłata za dodatki" },
  { value: "oplata_serwisowa", label: "Opłata serwisowa" },
  { value: "inne", label: "Inne" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "blik", label: "BLIK" },
  { value: "przelew", label: "Przelew" },
  { value: "gotowka", label: "Gotówka" },
  { value: "karta", label: "Karta" },
  { value: "inne", label: "Inne" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "oczekuje", label: "Oczekuje" },
  { value: "wplacono", label: "Wpłacono" },
  { value: "po_terminie", label: "Po terminie" },
  { value: "zwrocono", label: "Zwrócono" },
  { value: "anulowano", label: "Anulowano" },
];

type Payment = {
  id?: string;
  type: string;
  amount: number;
  paid_at: string | null;
  method: string;
  status: string;
  note: string | null;
};

type DepositRow = {
  required_amount: number;
  collected: boolean;
  collected_amount: number | null;
  collected_at: string | null;
  collected_method: string | null;
  returned: boolean;
  returned_amount: number | null;
  returned_at: string | null;
  returned_method: string | null;
  deduction: boolean;
  deduction_amount: number | null;
  deduction_reason: string | null;
  notes: string | null;
};

type ReservationForm = {
  status: string;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  people_count: number;
  trip_plan: string;
  country: string;
  is_abroad: boolean;
  trip_notes: string;
  price_per_day: number;
  service_fee: number;
  discount: number;
  discount_code: string;
  manual_override: boolean;
  has_pet: boolean;
  pets_count: number;
  pet_fee: number;
  has_grill: boolean;
  grill_fee: number;
  extra_chairs: boolean;
  chairs_fee: number;
  extra_table: boolean;
  table_fee: number;
  other_addons: string;
  other_addons_fee: number;
  settlement_status: string;
  admin_notes: string;
  internal_note: string;
};

function emptyForm(): ReservationForm {
  return {
    status: "zapytanie",
    start_date: "",
    end_date: "",
    pickup_time: "14:00",
    return_time: "12:00",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    people_count: 2,
    trip_plan: "",
    country: "Polska",
    is_abroad: false,
    trip_notes: "",
    price_per_day: 0,
    service_fee: 250,
    discount: 0,
    discount_code: "",
    manual_override: false,
    has_pet: false,
    pets_count: 0,
    pet_fee: 0,
    has_grill: false,
    grill_fee: 0,
    extra_chairs: false,
    chairs_fee: 0,
    extra_table: false,
    table_fee: 0,
    other_addons: "",
    other_addons_fee: 0,
    settlement_status: "brak_wplat",
    admin_notes: "",
    internal_note: "",
  };
}

function emptyDeposit(required = 2500): DepositRow {
  return {
    required_amount: required,
    collected: false,
    collected_amount: null,
    collected_at: null,
    collected_method: null,
    returned: false,
    returned_amount: null,
    returned_at: null,
    returned_method: null,
    deduction: false,
    deduction_amount: null,
    deduction_reason: null,
    notes: null,
  };
}

export function ReservationFormDialog({
  open,
  onOpenChange,
  reservationId,
  initialStart,
  initialEnd,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reservationId: string | null;
  initialStart?: string;
  initialEnd?: string;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!reservationId;

  // Finance settings
  const { data: settings } = useQuery({
    queryKey: ["finance_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("finance_settings" as any).select("*").maybeSingle();
      return data as any;
    },
  });

  // Catalog addons (from price list / addon_fees)
  const { data: catalogAddonList } = useQuery({
    queryKey: ["addon_fees_active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("addon_fees")
        .select("id,name,description,price,unit,sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as Array<{
        id: string;
        name: string;
        description: string | null;
        price: number;
        unit: string;
        sort_order: number | null;
      }>;
    },
  });

  // Selected catalog addons: addonId -> quantity (0/absent = unselected)
  const [catalogAddons, setCatalogAddons] = useState<Record<string, number>>({});

  const [form, setForm] = useState<ReservationForm>(emptyForm());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deletedPaymentIds, setDeletedPaymentIds] = useState<string[]>([]);
  const [deposit, setDeposit] = useState<DepositRow>(emptyDeposit());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load reservation + payments + deposit when opening for edit
  useEffect(() => {
    if (!open) return;
    setDeletedPaymentIds([]);
    if (!reservationId) {
      setForm({
        ...emptyForm(),
        start_date: initialStart ?? "",
        end_date: initialEnd ?? "",
        service_fee: settings?.default_service_fee ?? 250,
      });
      setPayments([]);
      setDeposit(emptyDeposit(settings?.default_deposit ?? 2500));
      setCatalogAddons({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ data: r }, { data: pays }, { data: dep }] = await Promise.all([
        supabase.from("reservations").select("*").eq("id", reservationId).maybeSingle(),
        supabase
          .from("reservation_payments" as any)
          .select("*")
          .eq("reservation_id", reservationId)
          .order("paid_at", { ascending: true }),
        supabase
          .from("reservation_deposits" as any)
          .select("*")
          .eq("reservation_id", reservationId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (r) {
        const rr = r as any;
        // Migrate legacy hardcoded addon fees → "Inne dodatki". Skip a legacy entry
        // if there's already a matching catalog addon (by name keyword), to avoid
        // double-counting old rows that have both.
        const addonArr = Array.isArray(rr.addons) ? rr.addons : [];
        const hasCatalog = (re: RegExp) =>
          addonArr.some((a: any) => a && typeof a?.name === "string" && re.test(a.name));
        const legacyParts: string[] = [];
        let legacyExtra = 0;
        const pushLegacy = (label: string, fee: number, re: RegExp) => {
          if (fee > 0 && !hasCatalog(re)) {
            legacyParts.push(`${label} ${fee} zł`);
            legacyExtra += fee;
          }
        };
        if (rr.has_pet) pushLegacy("Zwierzę", Number(rr.pet_fee ?? 0), /(zwierz|pies|kot)/i);
        if (rr.has_grill) pushLegacy("Grill", Number(rr.grill_fee ?? 0), /grill/i);
        if (rr.extra_chairs) pushLegacy("Dodatkowe krzesła", Number(rr.chairs_fee ?? 0), /krzes/i);
        if (rr.extra_table) pushLegacy("Dodatkowy stolik", Number(rr.table_fee ?? 0), /stolik/i);

        const existingOther = rr.other_addons ?? "";
        const existingOtherFee = Number(rr.other_addons_fee ?? 0);
        const mergedOther = [existingOther, legacyParts.join("; ")]
          .filter(Boolean)
          .join(legacyParts.length && existingOther ? "; " : "");

        setForm({
          status: rr.status ?? "zapytanie",
          start_date: rr.start_date ?? "",
          end_date: rr.end_date ?? "",
          pickup_time: rr.pickup_time ?? "14:00",
          return_time: rr.return_time ?? "12:00",
          first_name: rr.first_name ?? "",
          last_name: rr.last_name ?? "",
          phone: rr.phone ?? "",
          email: rr.email ?? "",
          people_count: rr.people_count ?? 2,
          trip_plan: rr.trip_plan ?? "",
          country: rr.country ?? "Polska",
          is_abroad: !!rr.is_abroad,
          trip_notes: rr.trip_notes ?? "",
          price_per_day: Number(rr.price_per_day ?? 0),
          service_fee: Number(rr.service_fee ?? 250),
          discount: Number(rr.discount ?? 0),
          discount_code: rr.discount_code ?? "",
          manual_override: !!rr.manual_override,
          // Legacy fields zeroed in form state (derived from catalog on save).
          has_pet: false,
          pets_count: 0,
          pet_fee: 0,
          has_grill: false,
          grill_fee: 0,
          extra_chairs: false,
          chairs_fee: 0,
          extra_table: false,
          table_fee: 0,
          other_addons: mergedOther,
          other_addons_fee: existingOtherFee + legacyExtra,
          settlement_status: rr.settlement_status ?? "brak_wplat",
          admin_notes: rr.admin_notes ?? "",
          internal_note: rr.notes ?? "",
        });
        const loaded: Record<string, number> = {};
        for (const a of addonArr) {
          if (a && typeof a === "object" && a.id) {
            loaded[a.id] = Number(a.quantity) || 1;
          }
        }
        setCatalogAddons(loaded);
      }
      setPayments(
        (pays ?? []).map((p: any) => ({
          id: p.id,
          type: p.type,
          amount: Number(p.amount),
          paid_at: p.paid_at,
          method: p.method,
          status: p.status,
          note: p.note,
        })),
      );
      setDeposit(
        dep
          ? {
              required_amount: Number((dep as any).required_amount ?? 2500),
              collected: !!(dep as any).collected,
              collected_amount: (dep as any).collected_amount ?? null,
              collected_at: (dep as any).collected_at ?? null,
              collected_method: (dep as any).collected_method ?? null,
              returned: !!(dep as any).returned,
              returned_amount: (dep as any).returned_amount ?? null,
              returned_at: (dep as any).returned_at ?? null,
              returned_method: (dep as any).returned_method ?? null,
              deduction: !!(dep as any).deduction,
              deduction_amount: (dep as any).deduction_amount ?? null,
              deduction_reason: (dep as any).deduction_reason ?? null,
              notes: (dep as any).notes ?? null,
            }
          : emptyDeposit(settings?.default_deposit ?? 2500),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reservationId, settings, initialStart, initialEnd]);

  // ===== Auto calculations =====
  const { nights, season, autoBase, suggestedPrice } = useMemo(() => {
    if (!form.start_date || !form.end_date) {
      return { nights: 0, season: "", autoBase: 0, suggestedPrice: 0 };
    }
    const s = parseISO(form.start_date);
    const e = parseISO(form.end_date);
    const n = Math.max(0, differenceInCalendarDays(e, s) + 1);
    const auto = calculatePricing(s, e, []);
    const seasonOfStart = getSeasonForDate(s);
    return {
      nights: n,
      season: seasonOfStart,
      autoBase: auto?.baseCost ?? 0,
      suggestedPrice: auto ? Math.round(auto.baseCost / Math.max(1, n)) : 0,
    };
  }, [form.start_date, form.end_date]);

  const pricePerDay = form.manual_override
    ? form.price_per_day
    : suggestedPrice || form.price_per_day;

  const baseCost = form.manual_override ? pricePerDay * nights : autoBase;

  const catalogAddonsResolved = useMemo(() => {
    const list = catalogAddonList ?? [];
    const out: Array<{ id: string; name: string; price: number; unit: string; quantity: number; subtotal: number }> = [];
    for (const a of list) {
      const qty = catalogAddons[a.id];
      if (!qty || qty <= 0) continue;
      const multiplier = a.unit === "doba" ? Math.max(1, nights) * qty : qty;
      out.push({
        id: a.id,
        name: a.name,
        price: Number(a.price),
        unit: a.unit,
        quantity: qty,
        subtotal: Number(a.price) * multiplier,
      });
    }
    return out;
  }, [catalogAddonList, catalogAddons, nights]);

  const catalogAddonsTotal = catalogAddonsResolved.reduce((s, a) => s + a.subtotal, 0);

  const addonsTotal = (form.other_addons_fee || 0) + catalogAddonsTotal;

  const rentalTotal = Math.max(0, baseCost + form.service_fee + addonsTotal - form.discount);

  const paidForRental = payments
    .filter((p) => p.status === "wplacono" && p.type !== "oplata_serwisowa")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const remaining = Math.max(0, rentalTotal - paidForRental);

  const autoSettlement = useMemo(() => {
    if (deposit.returned) return "kaucja_rozliczona";
    if (deposit.collected && remaining === 0) return "kaucja_pobrana";
    if (rentalTotal > 0 && paidForRental >= rentalTotal) return "oplacone_w_calosci";
    if (paidForRental > 0 && paidForRental < rentalTotal) {
      const hasZadatek = payments.some((p) => p.type === "zadatek" && p.status === "wplacono");
      return hasZadatek ? "zadatek_wplacony" : "czesciowo_oplacone";
    }
    return "brak_wplat";
  }, [payments, rentalTotal, paidForRental, deposit, remaining]);

  const addPayment = () => {
    setPayments((prev) => [
      ...prev,
      {
        type: "doplata",
        amount: 0,
        paid_at: format(new Date(), "yyyy-MM-dd"),
        method: "przelew",
        status: "wplacono",
        note: null,
      },
    ]);
  };

  const removePayment = (idx: number) => {
    const p = payments[idx];
    if (p.id) setDeletedPaymentIds((s) => [...s, p.id!]);
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, patch: Partial<Payment>) => {
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const handleSave = async () => {
    if (!form.start_date || !form.end_date) {
      toast.error("Uzupełnij datę od i datę do");
      return;
    }
    setSaving(true);
    try {
      // Derive pet/grill flags from selected catalog addons (single source of truth).
      const petAddon = catalogAddonsResolved.find((a) =>
        /(zwierz|pies|kot)/i.test(a.name),
      );
      const grillAddon = catalogAddonsResolved.find((a) => /grill/i.test(a.name));
      const hasPetDerived = !!petAddon;
      const hasGrillDerived = !!grillAddon;
      const petsCountDerived = petAddon ? Math.max(1, petAddon.quantity) : 0;

      const payload: any = {
        status: form.status,
        start_date: form.start_date,
        end_date: form.end_date,
        pickup_time: form.pickup_time || null,
        return_time: form.return_time || null,
        nights,
        season,
        first_name: form.first_name || "—",
        last_name: form.last_name || "—",
        phone: form.phone || "—",
        email: form.email || "—",
        people_count: form.people_count,
        trip_plan: form.trip_plan || null,
        country: form.country || null,
        is_abroad: form.is_abroad,
        trip_notes: form.trip_notes || null,
        notes: form.internal_note || null,
        admin_notes: form.admin_notes || null,
        price_per_day: pricePerDay,
        base_cost: baseCost,
        service_fee: form.service_fee,
        discount: form.discount,
        discount_code: form.discount_code || null,
        manual_override: form.manual_override,
        // Legacy addon fields — derived from catalog or zeroed out.
        has_pet: hasPetDerived,
        pets_count: petsCountDerived,
        pet_fee: 0,
        has_grill: hasGrillDerived,
        grill_fee: 0,
        extra_chairs: false,
        chairs_fee: 0,
        extra_table: false,
        table_fee: 0,
        other_addons: form.other_addons || null,
        other_addons_fee: form.other_addons_fee,
        addons_total: addonsTotal,
        addons: catalogAddonsResolved,
        rental_total: rentalTotal,
        deposit: deposit.required_amount,
        total_amount: rentalTotal + deposit.required_amount,
        settlement_status: form.settlement_status || autoSettlement,
        expires_at:
          form.status === "telefoniczna"
            ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            : null,
      };

      let resvId = reservationId;
      if (isEdit && resvId) {
        const { error } = await supabase.from("reservations").update(payload).eq("id", resvId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("reservations")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        resvId = (data as any).id;
      }

      if (!resvId) throw new Error("Brak ID rezerwacji");

      // Payments sync
      if (deletedPaymentIds.length) {
        await supabase
          .from("reservation_payments" as any)
          .delete()
          .in("id", deletedPaymentIds);
      }
      for (const p of payments) {
        const row: any = {
          reservation_id: resvId,
          type: p.type,
          amount: p.amount,
          paid_at: p.paid_at,
          method: p.method,
          status: p.status,
          note: p.note,
        };
        if (p.id) {
          await supabase
            .from("reservation_payments" as any)
            .update(row)
            .eq("id", p.id);
        } else {
          await supabase.from("reservation_payments" as any).insert(row);
        }
      }

      // Deposit upsert
      await supabase
        .from("reservation_deposits" as any)
        .upsert(
          { ...deposit, reservation_id: resvId },
          { onConflict: "reservation_id" },
        );

      toast.success(isEdit ? "Rezerwacja zaktualizowana" : "Rezerwacja zapisana");
      qc.invalidateQueries({ queryKey: ["admin", "kalendarz", "reservations"] });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edytuj rezerwację" : "Nowa rezerwacja"}
          </DialogTitle>
          <DialogDescription>
            Pełne dane finansowe, płatności i kaucja w jednym miejscu.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Ładowanie…</div>
        ) : (
          <Tabs defaultValue="termin" className="w-full">
            <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 bg-muted/40 p-1">
              <TabsTrigger value="termin">Termin</TabsTrigger>
              <TabsTrigger value="klient">Klient</TabsTrigger>
              <TabsTrigger value="kalkulacja">Kalkulacja</TabsTrigger>
              <TabsTrigger value="dodatki">Dodatki</TabsTrigger>
              <TabsTrigger value="platnosci">
                Płatności {payments.length > 0 && `(${payments.length})`}
              </TabsTrigger>
              <TabsTrigger value="kaucja">Kaucja</TabsTrigger>
              <TabsTrigger value="podsumowanie">Podsumowanie</TabsTrigger>
              <TabsTrigger value="notatki">Notatki</TabsTrigger>
            </TabsList>

            {/* A — Termin i status */}
            <TabsContent value="termin" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Data od">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </Field>
                <Field label="Data do">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </Field>
                <Field label="Godzina odbioru">
                  <input
                    type="time"
                    className={inputCls}
                    value={form.pickup_time}
                    onChange={(e) => setForm({ ...form, pickup_time: e.target.value })}
                  />
                </Field>
                <Field label="Godzina zwrotu">
                  <input
                    type="time"
                    className={inputCls}
                    value={form.return_time}
                    onChange={(e) => setForm({ ...form, return_time: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <Stat label="Liczba dni" value={nights.toString()} />
                <Stat label="Liczba dób" value={nights.toString()} />
                <Stat label="Sezon" value={season ? SEASON_LABEL[season as keyof typeof SEASON_LABEL] : "—"} />
              </div>
              <Field label="Status rezerwacji">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESERVATION_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </TabsContent>

            {/* B — Klient */}
            <TabsContent value="klient" className="space-y-3 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Imię">
                  <input className={inputCls} value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </Field>
                <Field label="Nazwisko">
                  <input className={inputCls} value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </Field>
                <Field label="Telefon">
                  <input className={inputCls} value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="E-mail">
                  <input type="email" className={inputCls} value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field label="Kraj wyjazdu">
                  <input className={inputCls} value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </Field>
                <Field label="Liczba osób">
                  <input type="number" min={1} className={inputCls} value={form.people_count}
                    onChange={(e) => setForm({ ...form, people_count: Number(e.target.value) })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_abroad}
                  onCheckedChange={(c) => setForm({ ...form, is_abroad: !!c })} />
                Wyjazd zagraniczny
              </label>
              <Field label="Plan wyjazdu">
                <textarea rows={2} className={cn(inputCls, "resize-y")} value={form.trip_plan}
                  onChange={(e) => setForm({ ...form, trip_plan: e.target.value })} />
              </Field>
              <Field label="Uwagi klienta">
                <textarea rows={2} className={cn(inputCls, "resize-y")} value={form.trip_notes}
                  onChange={(e) => setForm({ ...form, trip_notes: e.target.value })} />
              </Field>
            </TabsContent>

            {/* C — Kalkulacja */}
            <TabsContent value="kalkulacja" className="space-y-3 pt-4">
              <label className="flex items-center gap-2 text-sm rounded-lg border border-border bg-muted/30 p-3">
                <Checkbox checked={form.manual_override}
                  onCheckedChange={(c) => setForm({ ...form, manual_override: !!c })} />
                <span className="font-medium">Ręczna korekta kwot</span>
                <span className="text-xs text-muted-foreground">
                  (jeśli wyłączone — kwoty z cennika)
                </span>
              </label>
              {form.manual_override && (
                <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                  Kwota została zmieniona ręcznie przez administratora.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sezon">
                  <input className={cn(inputCls, "bg-muted")} readOnly value={season ? SEASON_LABEL[season as keyof typeof SEASON_LABEL] : "—"} />
                </Field>
                <Field label="Liczba dób">
                  <input className={cn(inputCls, "bg-muted")} readOnly value={nights} />
                </Field>
                <Field label="Cena za dobę (PLN)">
                  <input type="number" min={0} className={inputCls}
                    disabled={!form.manual_override}
                    value={form.manual_override ? form.price_per_day : suggestedPrice}
                    onChange={(e) => setForm({ ...form, price_per_day: Number(e.target.value) })} />
                </Field>
                <Field label="Wartość wynajmu (baza)">
                  <input className={cn(inputCls, "bg-muted")} readOnly value={formatPln(baseCost)} />
                </Field>
                <Field label="Opłata serwisowa (PLN)">
                  <input type="number" min={0} className={inputCls} value={form.service_fee}
                    onChange={(e) => setForm({ ...form, service_fee: Number(e.target.value) })} />
                </Field>
                <Field label="Rabat (PLN)">
                  <input type="number" min={0} className={inputCls} value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                </Field>
                <Field label="Kod rabatowy">
                  <input className={inputCls} value={form.discount_code}
                    onChange={(e) => setForm({ ...form, discount_code: e.target.value })} />
                </Field>
                <Field label="Kaucja zwrotna (PLN)">
                  <input type="number" min={0} className={inputCls}
                    value={deposit.required_amount}
                    onChange={(e) => setDeposit({ ...deposit, required_amount: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-1.5 text-sm">
                <Row label="Koszt wynajmu" value={formatPln(rentalTotal)} highlight />
                <Row label="+ Kaucja zwrotna" value={formatPln(deposit.required_amount)} />
                <Row label="Razem do wpłaty" value={formatPln(rentalTotal + deposit.required_amount)} highlight />
              </div>
            </TabsContent>

            {/* D — Dodatki */}
            <TabsContent value="dodatki" className="space-y-3 pt-4">
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                Dodatki (zwierzę, grill, krzesła, stolik…) zarządzane są wyłącznie w sekcji
                <strong className="mx-1 text-foreground">Dodatki z cennika</strong>poniżej.
                Edytuj listę w <em>Ustawienia → Dodatki / Cennik</em>.
              </div>
              <Field label="Inne dodatki (opis)">
                <input className={inputCls} value={form.other_addons}
                  onChange={(e) => setForm({ ...form, other_addons: e.target.value })} />
              </Field>
              <Field label="Kwota innych dodatków (PLN)">
                <input type="number" min={0} className={inputCls} value={form.other_addons_fee}
                  onChange={(e) => setForm({ ...form, other_addons_fee: Number(e.target.value) })} />
              </Field>

              {catalogAddonList && catalogAddonList.length > 0 && (
                <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <div className="text-sm font-semibold">
                    Dodatki z cennika
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (zarządzane w Ustawienia → Dodatki / Cennik)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {catalogAddonList.map((a) => {
                      const qty = catalogAddons[a.id] ?? 0;
                      const checked = qty > 0;
                      const multiplier = a.unit === "doba" ? Math.max(1, nights) * Math.max(1, qty) : Math.max(1, qty);
                      const sub = checked ? Number(a.price) * multiplier : 0;
                      return (
                        <div key={a.id} className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              setCatalogAddons((prev) => {
                                const next = { ...prev };
                                if (c) next[a.id] = next[a.id] || 1;
                                else delete next[a.id];
                                return next;
                              })
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{a.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPln(Number(a.price))} / {a.unit}
                              {a.description ? ` · ${a.description}` : ""}
                            </div>
                          </div>
                          {checked && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Ilość:</Label>
                              <input
                                type="number"
                                min={1}
                                className={cn(inputCls, "w-20")}
                                value={qty}
                                onChange={(e) =>
                                  setCatalogAddons((prev) => ({
                                    ...prev,
                                    [a.id]: Math.max(1, Number(e.target.value) || 1),
                                  }))
                                }
                              />
                            </div>
                          )}
                          <div className="w-24 text-right text-sm font-medium tabular-nums">
                            {formatPln(sub)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-medium">
                Razem dodatki: {formatPln(addonsTotal)}
              </div>
            </TabsContent>

            {/* E — Płatności */}
            <TabsContent value="platnosci" className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">Lista wpłat za wynajem</div>
                  <div className="text-xs text-muted-foreground">
                    Wpłacono: {formatPln(paidForRental)} / {formatPln(rentalTotal)} —
                    pozostało: <span className="font-semibold">{formatPln(remaining)}</span>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={addPayment}>
                  <Plus className="h-4 w-4" /> Dodaj wpłatę
                </Button>
              </div>
              {payments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Brak wpłat. Kliknij „Dodaj wpłatę".
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p, idx) => (
                    <div key={idx} className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-5">
                        <Select value={p.type} onValueChange={(v) => updatePayment(idx, { type: v })}>
                          <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PAYMENT_TYPE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input type="number" placeholder="Kwota" className={inputCls}
                          value={p.amount}
                          onChange={(e) => updatePayment(idx, { amount: Number(e.target.value) })} />
                        <input type="date" className={inputCls}
                          value={p.paid_at ?? ""}
                          onChange={(e) => updatePayment(idx, { paid_at: e.target.value })} />
                        <Select value={p.method} onValueChange={(v) => updatePayment(idx, { method: v })}>
                          <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHOD_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={p.status} onValueChange={(v) => updatePayment(idx, { status: v })}>
                          <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PAYMENT_STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <input placeholder="Notatka (opcjonalnie)" className={cn(inputCls, "flex-1")}
                          value={p.note ?? ""}
                          onChange={(e) => updatePayment(idx, { note: e.target.value })} />
                        <Button type="button" size="sm" variant="ghost"
                          className="text-destructive"
                          onClick={() => removePayment(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* F — Kaucja */}
            <TabsContent value="kaucja" className="space-y-3 pt-4">
              <Field label="Wymagana kaucja (PLN)">
                <input type="number" min={0} className={inputCls}
                  value={deposit.required_amount}
                  onChange={(e) => setDeposit({ ...deposit, required_amount: Number(e.target.value) })} />
              </Field>

              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={deposit.collected}
                    onCheckedChange={(c) => setDeposit({ ...deposit, collected: !!c })} />
                  Kaucja pobrana
                </label>
                {deposit.collected && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input type="number" placeholder="Kwota" className={inputCls}
                      value={deposit.collected_amount ?? deposit.required_amount}
                      onChange={(e) => setDeposit({ ...deposit, collected_amount: Number(e.target.value) })} />
                    <input type="date" className={inputCls}
                      value={deposit.collected_at?.slice(0, 10) ?? ""}
                      onChange={(e) => setDeposit({ ...deposit, collected_at: e.target.value })} />
                    <Select value={deposit.collected_method ?? "gotowka"}
                      onValueChange={(v) => setDeposit({ ...deposit, collected_method: v })}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Forma" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={deposit.returned}
                    onCheckedChange={(c) => setDeposit({ ...deposit, returned: !!c })} />
                  Kaucja zwrócona
                </label>
                {deposit.returned && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input type="number" placeholder="Kwota zwrotu" className={inputCls}
                      value={deposit.returned_amount ?? deposit.required_amount}
                      onChange={(e) => setDeposit({ ...deposit, returned_amount: Number(e.target.value) })} />
                    <input type="date" className={inputCls}
                      value={deposit.returned_at?.slice(0, 10) ?? ""}
                      onChange={(e) => setDeposit({ ...deposit, returned_at: e.target.value })} />
                    <Select value={deposit.returned_method ?? "przelew"}
                      onValueChange={(v) => setDeposit({ ...deposit, returned_method: v })}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Forma" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={deposit.deduction}
                    onCheckedChange={(c) => setDeposit({ ...deposit, deduction: !!c })} />
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Potrącenie z kaucji
                </label>
                {deposit.deduction && (
                  <div className="space-y-2">
                    <input type="number" placeholder="Kwota potrącenia" className={inputCls}
                      value={deposit.deduction_amount ?? 0}
                      onChange={(e) => setDeposit({ ...deposit, deduction_amount: Number(e.target.value) })} />
                    <textarea placeholder="Powód potrącenia" rows={2} className={cn(inputCls, "resize-y")}
                      value={deposit.deduction_reason ?? ""}
                      onChange={(e) => setDeposit({ ...deposit, deduction_reason: e.target.value })} />
                  </div>
                )}
              </div>

              <Field label="Uwagi do kaucji">
                <textarea rows={2} className={cn(inputCls, "resize-y")}
                  value={deposit.notes ?? ""}
                  onChange={(e) => setDeposit({ ...deposit, notes: e.target.value })} />
              </Field>
            </TabsContent>

            {/* G — Podsumowanie */}
            <TabsContent value="podsumowanie" className="space-y-2 pt-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-1.5 text-sm">
                <Row label="Termin" value={`${form.start_date || "—"} → ${form.end_date || "—"}`} />
                <Row label="Liczba dób" value={nights.toString()} />
                <Row label="Sezon" value={season ? SEASON_LABEL[season as keyof typeof SEASON_LABEL] : "—"} />
                <Row label="Cena za dobę" value={formatPln(pricePerDay)} />
                <Row label="Wartość wynajmu (baza)" value={formatPln(baseCost)} />
                <Row label="Opłata serwisowa" value={formatPln(form.service_fee)} />
                <Row label="Dodatki" value={formatPln(addonsTotal)} />
                <Row label="Rabat" value={`− ${formatPln(form.discount)}`} />
                <Row label="Koszt wynajmu razem" value={formatPln(rentalTotal)} highlight />
                <div className="h-px bg-border my-1" />
                <Row label="Suma wpłat" value={formatPln(paidForRental)} />
                <Row label="Pozostało do zapłaty" value={formatPln(remaining)} highlight />
                <div className="h-px bg-border my-1" />
                <Row label="Wymagana kaucja" value={formatPln(deposit.required_amount)} />
                <Row label="Kaucja pobrana" value={deposit.collected ? formatPln(deposit.collected_amount ?? deposit.required_amount) : "nie"} />
                <Row label="Kaucja zwrócona" value={deposit.returned ? formatPln(deposit.returned_amount ?? 0) : "nie"} />
                <Row label="Potrącenia" value={deposit.deduction ? formatPln(deposit.deduction_amount ?? 0) : "—"} />
              </div>
              <Field label="Końcowy status rozliczenia">
                <Select value={form.settlement_status}
                  onValueChange={(v) => setForm({ ...form, settlement_status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SETTLEMENT_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="text-xs text-muted-foreground">
                Auto-sugestia: <strong>
                  {SETTLEMENT_STATUS_OPTIONS.find((o) => o.value === autoSettlement)?.label}
                </strong>{" "}
                <button type="button"
                  className="text-primary underline hover:no-underline"
                  onClick={() => setForm({ ...form, settlement_status: autoSettlement })}>
                  zastosuj
                </button>
              </div>
            </TabsContent>

            {/* H — Notatki admina */}
            <TabsContent value="notatki" className="space-y-3 pt-4">
              <Field label="Notatka wewnętrzna (widoczna w kalendarzu)">
                <textarea rows={3} className={cn(inputCls, "resize-y")}
                  value={form.internal_note}
                  onChange={(e) => setForm({ ...form, internal_note: e.target.value })} />
              </Field>
              <Field label="Notatki admina (dodatkowe)">
                <textarea rows={4} className={cn(inputCls, "resize-y")}
                  value={form.admin_notes}
                  onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} />
              </Field>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button type="button" disabled={saving || loading}
            className="bg-gradient-sunset text-primary-foreground hover:opacity-90"
            onClick={handleSave}>
            {saving ? "Zapisywanie…" : "Zapisz rezerwację"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== helpers =====
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3",
      highlight && "font-semibold text-base")}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

