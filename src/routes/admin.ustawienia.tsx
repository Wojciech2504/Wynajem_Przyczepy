import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AppSettings, DEFAULT_SETTINGS, saveSettings, loadSettingsFromDb } from "@/lib/use-settings";
import { FinanceSettingsSection } from "@/components/admin/FinanceSettingsSection";

export const Route = createFileRoute("/admin/ustawienia")({
  component: Ustawienia,
});

type Settings = AppSettings;
const DEFAULTS = DEFAULT_SETTINGS;

type FieldProps = {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
};

function Field({ label, value, onChange, type = "text", placeholder, className }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Ustawienia() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    loadSettingsFromDb().then((next) => setS(next)).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await saveSettings(s);
      toast.success("Ustawienia zapisane — zmiany widoczne na stronie");
    } catch (err) {
      console.error("saveSettings failed", err);
      toast.error("Nie udało się zapisać ustawień w bazie danych.");
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Ustawienia</h1>
        <p className="text-sm text-muted-foreground">
          Podstawowe ustawienia aplikacji oraz dane kontaktowe.
        </p>
      </div>

      <Section title="Strona">
        <Field label="Nazwa strony" value={s.siteName} onChange={(v) => update("siteName", v)} />
        <Field
          label="E-mail do powiadomień (admin)"
          type="email"
          value={s.notifyEmail}
          onChange={(v) => update("notifyEmail", v)}
        />
      </Section>

      <HeroImagesSection s={s} update={update} />

      <FinanceSettingsSection />




      <Section title="Dane kontaktowe (widoczne dla klientów)">
        <Field
          label="Telefon kontaktowy"
          value={s.contactPhone}
          onChange={(v) => update("contactPhone", v)}
          placeholder="+48 600 000 000"
        />
        <Field
          label="E-mail kontaktowy"
          type="email"
          value={s.contactEmail}
          onChange={(v) => update("contactEmail", v)}
          placeholder="kontakt@campgo.pl"
        />
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Adres</Label>
          <Textarea
            rows={2}
            value={s.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="ul. Przykładowa 1, 00-000 Miasto"
          />
        </div>
      </Section>

      <Section title="Dane do przelewu">
        <Field
          label="Odbiorca przelewu"
          value={s.bankRecipient}
          onChange={(v) => update("bankRecipient", v)}
          placeholder="CampGo Sp. z o.o."
          className="sm:col-span-2"
        />
        <Field
          label="Numer konta bankowego"
          value={s.bankAccount}
          onChange={(v) => update("bankAccount", v)}
          placeholder="PL00 0000 0000 0000 0000 0000 0000"
          className="sm:col-span-2"
        />
        <Field
          label="Nazwa banku"
          value={s.bankName}
          onChange={(v) => update("bankName", v)}
          placeholder="np. mBank"
        />
        <Field
          label="Nazwa firmy"
          value={s.companyName}
          onChange={(v) => update("companyName", v)}
        />
        <Field label="NIP" value={s.nip} onChange={(v) => update("nip", v)} />

        <Field label="REGON" value={s.regon} onChange={(v) => update("regon", v)} />
      </Section>

      <Section title="Operacje i powiadomienia">

        <Field
          label="Domyślna ważność rezerwacji telefonicznej (h)"
          type="number"
          value={s.phoneReservationHours}
          onChange={(v) => update("phoneReservationHours", Number(v) || 48)}
        />
        <Field
          label="Slack webhook"
          value={s.slackWebhook}
          onChange={(v) => update("slackWebhook", v)}
          placeholder="https://hooks.slack.com/services/..."
        />
        <Field
          label="Godzina odbioru przyczepy (po)"
          type="time"
          value={s.pickupAfter}
          onChange={(v) => update("pickupAfter", v)}
        />
        <Field
          label="Godzina zwrotu przyczepy (do)"
          type="time"
          value={s.returnBefore}
          onChange={(v) => update("returnBefore", v)}
        />
      </Section>

      <Section title="Podróż i opłaty drogowe">
        <Field
          label="Link do e-TOLL"
          value={s.etollUrl}
          onChange={(v) => update("etollUrl", v)}
          placeholder="https://etoll.gov.pl/"
          className="sm:col-span-2"
        />
        <Field
          label="Tekst przycisku e-TOLL"
          value={s.etollButtonLabel}
          onChange={(v) => update("etollButtonLabel", v)}
          placeholder="Sprawdź e-TOLL"
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Pokazuj informację o e-TOLL</Label>
          <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={s.etollEnabled}
              onChange={(e) => update("etollEnabled", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">{s.etollEnabled ? "Włączone" : "Wyłączone"}</span>
          </label>
        </div>
        <div className="sm:col-span-2 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Linki do winiet zagranicznych edytujesz w zakładce <strong>Winiety zagraniczne</strong> w
          menu administratora.
        </div>
      </Section>

      <div className="space-y-2 rounded-3xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        <h2 className="font-display text-lg font-semibold text-foreground">Warunki wynajmu</h2>
        <p>
          Pozycje „Warunki wynajmu" (Kaucja, Prawo jazdy, Minimalny wynajem, Ubezpieczenie itd.)
          edytujesz w zakładce <strong>Treści, cennik i FAQ → Warunki wynajmu</strong>. Możesz tam dodawać,
          usuwać i sortować dowolne pozycje.
        </p>
      </div>




      <div className="flex justify-end">
        <Button
          onClick={save}
          className="bg-gradient-sunset text-primary-foreground hover:opacity-90"
        >
          Zapisz ustawienia
        </Button>
      </div>
    </div>
  );
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB źródłowego pliku
const MAX_DIMENSION = 1600; // px (dłuższy bok po kompresji)
const TARGET_BYTES = 500 * 1024; // ~500 KB po kompresji (limit localStorage ~5 MB na 5 zdjęć)

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("decode"));
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.85;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length * 0.75 > TARGET_BYTES && quality > 0.3) {
    quality -= 0.1;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return out;
}

function ImagePicker({
  label,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onRemove?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Wybierz plik graficzny");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Maksymalny rozmiar pliku to 15 MB");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
      toast.success("Zdjęcie wczytane i zoptymalizowane");
    } catch {
      toast.error("Nie udało się wczytać pliku");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="space-y-2 rounded-2xl border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {value && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Usuń
          </button>
        )}
      </div>
      <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-muted">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            Brak zdjęcia
          </div>
        )}
      </div>
      <Input type="file" accept="image/*" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
      <p className="text-[11px] text-muted-foreground">
        {busy ? "Przetwarzanie…" : "Max 15 MB. Zdjęcie zostanie automatycznie zmniejszone i skompresowane."}
      </p>
    </div>
  );
}

function HeroImagesSection({
  s,
  update,
}: {
  s: Settings;
  update: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
}) {
  const extras = s.heroExtraImages ?? [];
  const setExtra = (idx: number, val: string | null) => {
    const next = [...extras];
    if (val === null) next.splice(idx, 1);
    else next[idx] = val;
    update("heroExtraImages", next.slice(0, 4));
  };
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...extras];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    update("heroExtraImages", next);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Strona główna – zdjęcia</h2>
          <p className="text-sm text-muted-foreground">
            Ustaw główne zdjęcie sekcji hero oraz opcjonalny slider z maks. 4 dodatkowymi zdjęciami.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImagePicker
          label="Główne zdjęcie (hero)"
          value={s.heroImage}
          onChange={(v) => update("heroImage", v)}
          onRemove={() => update("heroImage", "")}
        />
        <div className="space-y-3 rounded-2xl border border-border bg-background/60 p-3">
          <label className="flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 cursor-pointer">
            <span className="text-sm font-medium">Włącz slider zdjęć na stronie głównej</span>
            <input
              type="checkbox"
              checked={s.heroSliderEnabled}
              onChange={(e) => update("heroSliderEnabled", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
          <div className="space-y-1.5">
            <Label className="text-xs">Czas zmiany slajdu (ms)</Label>
            <Input
              type="number"
              min={1500}
              step={500}
              value={s.heroSliderIntervalMs}
              onChange={(e) =>
                update("heroSliderIntervalMs", Math.max(1500, Number(e.target.value) || 4500))
              }
            />
            <p className="text-xs text-muted-foreground">
              Domyślnie 4500 ms (4,5 sekundy). Minimum 1500 ms.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Gdy slider jest wyłączony, widoczne jest tylko główne zdjęcie. Maksymalny rozmiar
            pojedynczego pliku to 2 MB.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <ImagePicker
              label={`Dodatkowe zdjęcie ${i + 1}`}
              value={extras[i]}
              onChange={(v) => setExtra(i, v)}
              onRemove={extras[i] ? () => setExtra(i, null) : undefined}
            />
            {extras[i] && (
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded border border-border px-2 py-1 disabled:opacity-40"
                >
                  ← W lewo
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i >= extras.length - 1}
                  className="rounded border border-border px-2 py-1 disabled:opacity-40"
                >
                  W prawo →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

