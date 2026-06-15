import { CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink } from "lucide-react";
import type { DmcResult, DmcStatus } from "@/lib/dmc-calculator";
import { useSettings } from "@/lib/use-settings";

const STATUS_STYLES: Record<
  DmcStatus,
  { wrap: string; badge: string; icon: typeof CheckCircle2; label: string }
> = {
  success: {
    wrap: "border-success/40 bg-success/10",
    badge: "bg-success text-success-foreground",
    icon: CheckCircle2,
    label: "Możesz ciągnąć",
  },
  warning: {
    wrap: "border-warning/40 bg-warning/10",
    badge: "bg-warning text-warning-foreground",
    icon: AlertTriangle,
    label: "Uwaga – potrzebne uprawnienia",
  },
  info: {
    wrap: "border-primary/40 bg-primary/5",
    badge: "bg-primary text-primary-foreground",
    icon: Info,
    label: "Potrzebne uprawnienia B+E",
  },
  error: {
    wrap: "border-destructive/40 bg-destructive/10",
    badge: "bg-destructive text-destructive-foreground",
    icon: XCircle,
    label: "Brak możliwości holowania",
  },
};

export function DmcResultCard({ result }: { result: DmcResult }) {
  const style = STATUS_STYLES[result.status];
  const Icon = style.icon;
  const settings = useSettings();
  const showEtoll = settings.etollEnabled !== false;
  const etollHigh = result.totalSet > 3500;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-in fade-in slide-in-from-bottom-3 rounded-3xl border-2 p-6 shadow-soft transition-all sm:p-8 ${style.wrap}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {style.label}
        </span>
        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
          Uprawnienia: <strong className="ml-1">{result.license}</strong>
        </span>
      </div>

      <h3 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">
        {result.title}
      </h3>

      {result.reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {result.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" />
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="DMC samochodu" value={`${result.carDmc} kg`} />
        <Stat label="O.1" value={`${result.towLimit} kg`} />
        <Stat label="DMC naszej przyczepy" value={`${result.trailerDmc} kg`} />
        <Stat
          label="Suma DMC zestawu: auto + nasza przyczepa"
          value={`${result.totalSet} kg`}
          highlight
        />
        <Stat
          label="Ocena techniczna"
          value={result.technicalOk ? "Spełnia" : "Nie spełnia"}
        />
        <Stat label="Uprawnienia" value={result.license} />
      </div>

      <div className="mt-3 rounded-2xl border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
        To jest wyliczona suma DMC samochodu i DMC naszej przyczepy. Pole <strong>F.3</strong> w
        dowodzie rejestracyjnym oznacza dopuszczalną masę całkowitą zespołu pojazdów i należy je
        sprawdzić osobno, jeżeli występuje w dowodzie.
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-4">
        <h4 className="text-sm font-semibold">Co oznacza ten wynik?</h4>
        <p className="mt-1.5 text-sm text-muted-foreground">{result.explanation}</p>
      </div>

      {result.license === "B96" && <LicenseInfoB96 />}
      {result.license === "B+E" && <LicenseInfoBE />}

      {showEtoll && (
        <div className={`mt-4 rounded-2xl border p-4 ${etollHigh ? "border-warning/40 bg-warning/10" : "border-primary/30 bg-primary/5"}`}>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4" />
            Opłaty drogowe w Polsce – e-TOLL
          </h4>
          <p className="mt-2 text-sm text-foreground/80">
            {etollHigh
              ? "Jeżeli DMC zestawu, czyli samochód + nasza przyczepa, przekracza 3500 kg, przejazd po wybranych drogach płatnych w Polsce może wymagać korzystania z systemu e-TOLL. Przed wyjazdem sprawdź trasę i obowiązujące opłaty."
              : "Dla zestawu do 3500 kg e-TOLL zwykle nie będzie wymagany, ale przed wyjazdem zawsze warto sprawdzić aktualne zasady dla planowanej trasy."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ta informacja nie blokuje rezerwacji, ale jest ważna przy planowaniu trasy.
          </p>
          {settings.etollUrl && (
            <a
              href={settings.etollUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              {settings.etollButtonLabel || "Sprawdź e-TOLL"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-background/60"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`mt-0.5 font-display text-lg font-bold ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function LicenseInfoB96() {
  return (
    <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Info className="h-4 w-4" />
        Co to jest kod 96 (B96)?
      </h4>
      <div className="mt-2 space-y-2 text-sm text-foreground/80">
        <p>
          <strong>Kod 96</strong> to rozszerzenie kategorii B prawa jazdy. Pozwala kierować zestawem
          samochód + przyczepa o dopuszczalnej masie całkowitej (DMC) zestawu{" "}
          <strong>powyżej 3500 kg, ale nie więcej niż 4250 kg</strong>.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Nie jest to osobna kategoria – to wpis dodawany do kategorii B.</li>
          <li>
            Aby go uzyskać, wystarczy ukończyć krótkie szkolenie praktyczne (ok. 7 godzin) i zdać
            egzamin praktyczny w WORD – bez egzaminu teoretycznego.
          </li>
          <li>Nie ma egzaminu teoretycznego, koszt szkolenia to ok. 1000–1500 zł.</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Po zdaniu egzaminu w polu „kody” prawa jazdy pojawia się liczba <strong>96</strong>.
        </p>
      </div>
    </div>
  );
}

function LicenseInfoBE() {
  return (
    <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Info className="h-4 w-4" />
        Co to jest kategoria B+E?
      </h4>
      <div className="mt-2 space-y-2 text-sm text-foreground/80">
        <p>
          <strong>Kategoria B+E</strong> uprawnia do kierowania zestawem pojazdów: samochód (kat. B)
          + przyczepa o DMC <strong>powyżej 750 kg</strong>. Suma DMC zestawu może przekraczać 4250 kg
          (do 7000 kg).
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Jest to osobna kategoria prawa jazdy – wymaga oddzielnego egzaminu praktycznego.</li>
          <li>Nie ma egzaminu teoretycznego, jeśli posiadasz już kat. B.</li>
          <li>Szkolenie obejmuje ok. 15 godzin praktyki, koszt to zwykle 1800–2500 zł.</li>
        </ul>
      </div>
    </div>
  );
}
