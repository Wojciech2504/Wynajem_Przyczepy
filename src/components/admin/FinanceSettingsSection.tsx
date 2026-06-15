import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FinanceSettings = {
  id: number;
  default_service_fee: number;
  default_deposit: number;
  deposit_type: "amount" | "percent";
  deposit_amount: number;
  deposit_percent: number;
  deposit_due_hours: number;
  pet_enabled: boolean;
  pet_fee: number;
  grill_enabled: boolean;
  grill_fee: number;
  chairs_enabled: boolean;
  chairs_fee: number;
  table_enabled: boolean;
  table_fee: number;
};

export function FinanceSettingsSection() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "finance-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("finance_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      return data as FinanceSettings | null;
    },
  });

  const [f, setF] = useState<FinanceSettings | null>(null);
  useEffect(() => {
    if (data) setF(data);
  }, [data]);

  if (!f) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Ładowanie ustawień finansowych…
      </div>
    );
  }

  const set = <K extends keyof FinanceSettings>(k: K, v: FinanceSettings[K]) =>
    setF((p) => (p ? { ...p, [k]: v } : p));

  const save = async () => {
    const { error } = await supabase
      .from("finance_settings")
      .update({
        default_service_fee: f.default_service_fee,
        default_deposit: f.default_deposit,
        deposit_type: f.deposit_type,
        deposit_amount: f.deposit_amount,
        deposit_percent: f.deposit_percent,
        deposit_due_hours: f.deposit_due_hours,
        pet_enabled: f.pet_enabled,
        pet_fee: f.pet_fee,
        grill_enabled: f.grill_enabled,
        grill_fee: f.grill_fee,
        chairs_enabled: f.chairs_enabled,
        chairs_fee: f.chairs_fee,
        table_enabled: f.table_enabled,
        table_fee: f.table_fee,
      })
      .eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Ustawienia finansowe zapisane");
    qc.invalidateQueries({ queryKey: ["admin", "finance-settings"] });
  };

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div>
        <h2 className="font-display text-lg font-semibold">Finanse</h2>
        <p className="text-sm text-muted-foreground">
          Domyślne opłaty i zasady rozliczania używane przy tworzeniu rezerwacji.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumField
          label="Domyślna opłata serwisowa (zł)"
          value={f.default_service_fee}
          onChange={(v) => set("default_service_fee", v)}
        />
        <NumField
          label="Domyślna kaucja (zł)"
          value={f.default_deposit}
          onChange={(v) => set("default_deposit", v)}
        />
      </div>

      <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-4">
        <h3 className="text-sm font-semibold">Zadatek</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Format zadatku</Label>
            <Select
              value={f.deposit_type}
              onValueChange={(v) => set("deposit_type", v as "amount" | "percent")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Kwota stała (zł)</SelectItem>
                <SelectItem value="percent">Procent (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {f.deposit_type === "amount" ? (
            <NumField
              label="Kwota zadatku (zł)"
              value={f.deposit_amount}
              onChange={(v) => set("deposit_amount", v)}
            />
          ) : (
            <NumField
              label="Procent zadatku (%)"
              value={f.deposit_percent}
              onChange={(v) => set("deposit_percent", v)}
            />
          )}
          <NumField
            label="Termin płatności zadatku (h)"
            value={f.deposit_due_hours}
            onChange={(v) => set("deposit_due_hours", v)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Dodatki — domyślne opłaty</h3>
        <AddonRow
          label="Zwierzę"
          enabled={f.pet_enabled}
          fee={f.pet_fee}
          onEnabled={(v) => set("pet_enabled", v)}
          onFee={(v) => set("pet_fee", v)}
        />
        <AddonRow
          label="Grill"
          enabled={f.grill_enabled}
          fee={f.grill_fee}
          onEnabled={(v) => set("grill_enabled", v)}
          onFee={(v) => set("grill_fee", v)}
        />
        <AddonRow
          label="Krzesła kempingowe"
          enabled={f.chairs_enabled}
          fee={f.chairs_fee}
          onEnabled={(v) => set("chairs_enabled", v)}
          onFee={(v) => set("chairs_fee", v)}
        />
        <AddonRow
          label="Stolik"
          enabled={f.table_enabled}
          fee={f.table_fee}
          onEnabled={(v) => set("table_enabled", v)}
          onFee={(v) => set("table_fee", v)}
        />
        <p className="text-xs text-muted-foreground">
          Pełną listę dodatków z cennika (z własnymi nazwami i jednostkami) zarządzasz w zakładce{" "}
          <strong>Treści, cennik i FAQ → Dodatki</strong>.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={save}
          className="bg-gradient-sunset text-primary-foreground hover:opacity-90"
        >
          Zapisz ustawienia finansowe
        </Button>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function AddonRow({
  label,
  enabled,
  fee,
  onEnabled,
  onFee,
}: {
  label: string;
  enabled: boolean;
  fee: number;
  onEnabled: (v: boolean) => void;
  onFee: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
      <label className="flex flex-1 items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabled(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm font-medium">{label}</span>
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={fee}
          onChange={(e) => onFee(Number(e.target.value) || 0)}
          className="w-28"
          disabled={!enabled}
        />
        <span className="text-xs text-muted-foreground">zł</span>
      </div>
    </div>
  );
}
