import { useState } from "react";
import { Calculator, Eraser, Info } from "lucide-react";
import {
  parseWeight,
  isUnrealisticCarDmc,
  isUnrealisticTowLimit,
  TRAILER_DMC,
  type DmcInput,
} from "@/lib/dmc-calculator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  onCalculate: (input: DmcInput) => void;
  onReset: () => void;
};

export function DmcCalculatorForm({ onCalculate, onReset }: Props) {
  const [carDmcRaw, setCarDmcRaw] = useState("");
  const [towLimitRaw, setTowLimitRaw] = useState("");
  const [f3Raw, setF3Raw] = useState("");
  const [errors, setErrors] = useState<{ carDmc?: string; towLimit?: string; f3?: string }>({});
  const [warnings, setWarnings] = useState<{ carDmc?: string; towLimit?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const carDmc = parseWeight(carDmcRaw);
    const towLimit = parseWeight(towLimitRaw);
    const f3 = f3Raw.trim() === "" ? null : parseWeight(f3Raw);

    const newErrors: typeof errors = {};
    if (carDmc === null) newErrors.carDmc = "Wpisz poprawną liczbę dodatnią (np. 2100).";
    if (towLimit === null) newErrors.towLimit = "Wpisz poprawną liczbę dodatnią (np. 1800).";
    if (f3Raw.trim() !== "" && f3 === null)
      newErrors.f3 = "Wpisz poprawną liczbę dodatnią lub pozostaw puste.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const newWarnings: typeof warnings = {};
    if (carDmc !== null && isUnrealisticCarDmc(carDmc))
      newWarnings.carDmc = "Ta wartość wygląda nietypowo – sprawdź, czy nie ma pomyłki.";
    if (towLimit !== null && isUnrealisticTowLimit(towLimit))
      newWarnings.towLimit = "Ta wartość wygląda nietypowo – sprawdź, czy nie ma pomyłki.";
    setWarnings(newWarnings);

    onCalculate({ carDmc: carDmc!, towLimit: towLimit!, f3 });
  };

  const handleClear = () => {
    setCarDmcRaw("");
    setTowLimitRaw("");
    setF3Raw("");
    setErrors({});
    setWarnings({});
    onReset();
  };

  return (
    <TooltipProvider delayDuration={150}>
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="carDmc"
            label="DMC samochodu"
            tooltip="Sprawdź pole F.2 w dowodzie rejestracyjnym. Niektórzy kojarzą tę wartość również z polem F.1."
            helper="Dopuszczalna masa całkowita Twojego samochodu (w kg) z dowodu rejestracyjnego – pole F.2."
            value={carDmcRaw}
            onChange={setCarDmcRaw}
            placeholder="np. 2100"
            error={errors.carDmc}
            warning={warnings.carDmc}
          />
          <Field
            id="towLimit"
            label="Pole O.1"
            tooltip="O.1 to maksymalna masa przyczepy z hamulcem, jaką może ciągnąć Twój samochód."
            helper="Maksymalna masa przyczepy z hamulcem (w kg) – pole O.1 z dowodu rejestracyjnego."
            value={towLimitRaw}
            onChange={setTowLimitRaw}
            placeholder="np. 1800"
            error={errors.towLimit}
            warning={warnings.towLimit}
          />

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">DMC naszej przyczepy</label>
            <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Stała wartość – przyczepa z hamulcem
              </span>
              <span className="font-display text-xl font-bold text-primary">{TRAILER_DMC} kg</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Field
              id="f3"
              label="F.3 z dowodu rejestracyjnego (opcjonalnie)"
              tooltip="F.3 to dopuszczalna masa całkowita zespołu pojazdów (samochód + przyczepa)."
              helper="Dopuszczalna masa całkowita zespołu pojazdów. Jeżeli pole jest puste w dowodzie, pozostaw puste i skontaktuj się z nami w razie wątpliwości."
              value={f3Raw}
              onChange={setF3Raw}
              placeholder="np. 4250 (opcjonalnie)"
              error={errors.f3}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-sunset px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]"
          >
            <Calculator className="h-4 w-4" />
            Sprawdź
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Eraser className="h-4 w-4" />
            Wyczyść
          </button>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Wpisuj wartości w kilogramach. Możesz wkleić wartości typu „1 800” – spacje zostaną
          automatycznie usunięte.
        </p>
      </form>
    </TooltipProvider>
  );
}

function Field({
  id,
  label,
  helper,
  tooltip,
  value,
  onChange,
  placeholder,
  error,
  warning,
}: {
  id: string;
  label: string;
  helper: string;
  tooltip: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  warning?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Wskazówka – ${label}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          // Zablokuj litery, zostaw cyfry, spacje, kropki, przecinki
          const filtered = e.target.value.replace(/[^\d\s.,\u00A0]/g, "");
          onChange(filtered);
        }}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-helper`}
        className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
          error ? "border-destructive focus:border-destructive" : "border-input focus:border-primary"
        }`}
      />
      <p id={`${id}-helper`} className="mt-1.5 text-xs text-muted-foreground">
        {helper}
      </p>
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
      {!error && warning && (
        <p className="mt-1 text-xs font-medium text-warning-foreground">{warning}</p>
      )}
    </div>
  );
}
