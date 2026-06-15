import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Car,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Gauge,
  AlertTriangle,
  Info,
  Mail,
  ArrowRight,
  ExternalLink,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DmcCalculatorForm } from "@/components/dmc/DmcCalculatorForm";
import { DmcResultCard } from "@/components/dmc/DmcResultCard";
import { DmcFaq } from "@/components/dmc/DmcFaq";
import {
  calculateDmcEligibility,
  type DmcInput,
  type DmcResult,
  TRAILER_DMC,
} from "@/lib/dmc-calculator";
import { saveVehicleCheck, clearVehicleCheck } from "@/lib/vehicle-check";
import dowodPrzyklad from "@/assets/dowod-przyklad.jpg";

export const Route = createFileRoute("/kalkulator-dmc")({
  head: () => ({
    meta: [
      { title: "Sprawdź swoje auto – czy pociągnie naszą przyczepę | CampGo" },
      {
        name: "description",
        content:
          "Sprawdź, czy Twój samochód może holować naszą przyczepę kempingową Hobby 495 WFB o DMC 1800 kg.",
      },
      { property: "og:title", content: "Sprawdź swoje auto – CampGo" },
      {
        property: "og:description",
        content:
          "Wpisz dane z dowodu rejestracyjnego i sprawdź, czy Twój samochód może holować naszą przyczepę 1800 kg.",
      },
    ],
  }),
  component: KalkulatorDMCPage,
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
    addons: typeof search.addons === "string" ? search.addons : undefined,
  }),
});

function KalkulatorDMCPage() {
  const search = Route.useSearch();
  const [result, setResult] = useState<DmcResult | null>(null);
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showRequiredError, setShowRequiredError] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const licenseSectionRef = useRef<HTMLDivElement | null>(null);

  const handleCalculate = (input: DmcInput) => {
    const r = calculateDmcEligibility(input);
    setResult(r);
    setLicenseConfirmed(false);
    setShowRequiredError(false);
    if (typeof window !== "undefined") clearVehicleCheck();
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Auto-scroll to license section + pulse when vehicle passes
  useEffect(() => {
    if (result && result.technicalOk && !licenseConfirmed) {
      const t = setTimeout(() => {
        licenseSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setShowPulse(true);
      }, 450);
      const t2 = setTimeout(() => setShowPulse(false), 5500);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
    setShowPulse(false);
  }, [result, licenseConfirmed]);

  // Sync license confirmation -> vehicle-check session state
  useEffect(() => {
    if (!result) return;
    if (result.technicalOk && licenseConfirmed) {
      saveVehicleCheck({
        technicalOk: true,
        licenseConfirmed: true,
        totalSet: result.totalSet,
        license: result.license,
        savedAt: Date.now(),
      });
      setShowRequiredError(false);
    } else {
      clearVehicleCheck();
    }
  }, [result, licenseConfirmed]);

  const { data: vignettes = [] } = useQuery({
    queryKey: ["vignette_links_public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vignette_links" as any)
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return (data as any[]) ?? [];
    },
  });

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto max-w-6xl px-4 py-14 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Gauge className="h-3.5 w-3.5" />
                Narzędzie dla podróżników
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Sprawdź, czy Twoje auto może holować naszą przyczepę
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Wpisz dane z dowodu rejestracyjnego samochodu. System sprawdzi, czy auto może
                holować naszą przyczepę <strong className="text-foreground">Hobby 495 WFB</strong>{" "}
                o DMC <strong className="text-foreground">1800 kg</strong>.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-sm text-foreground/80">
                  Nasza przyczepa ma DMC <strong>1800 kg</strong>. Kalkulator zakłada przyczepę z
                  hamulcem, dlatego kluczowe będzie pole <strong>O.1</strong> z dowodu
                  rejestracyjnego.
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative mx-auto aspect-square max-w-md rounded-3xl bg-gradient-sunset p-8 shadow-glow">
                <div className="grid h-full place-items-center rounded-2xl bg-background/95">
                  <div className="text-center">
                    <Car className="mx-auto h-12 w-12 text-primary" />
                    <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                      DMC przyczepy
                    </div>
                    <div className="mt-1 font-display text-6xl font-bold">{TRAILER_DMC}</div>
                    <div className="text-sm text-muted-foreground">kilogramów</div>
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Z hamulcem
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KALKULATOR */}
      <section className="container mx-auto max-w-4xl px-4 py-12">
        <DmcCalculatorForm onCalculate={handleCalculate} onReset={() => { setResult(null); setLicenseConfirmed(false); clearVehicleCheck(); }} />

        <div ref={resultRef} className="mt-8 scroll-mt-24 space-y-6">
          {result && <DmcResultCard result={result} />}

          {result && result.technicalOk && (
            <div
              ref={licenseSectionRef}
              className={`scroll-mt-24 rounded-3xl border-4 p-6 sm:p-8 transition-colors ${
                licenseConfirmed
                  ? "border-success bg-success/5"
                  : "border-[oklch(0.7_0.2_40)] bg-[oklch(0.7_0.2_40/0.08)]"
              } ${showPulse && !licenseConfirmed ? "animate-pulse-attention" : ""}`}
            >
              <h3 className="flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
                <ShieldAlert className="h-6 w-6 text-[oklch(0.65_0.22_35)]" />
                Krok 2: Potwierdź uprawnienia kierowcy
              </h3>
              <p className="mt-2 text-sm text-foreground/85">
                Aby przejść dalej, potwierdź, że kierowca posiada odpowiednie prawo jazdy do
                prowadzenia zestawu z naszą przyczepą.
              </p>

              <button
                type="button"
                onClick={() => setLicenseConfirmed((v) => !v)}
                className={`mt-5 flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                  licenseConfirmed
                    ? "border-success bg-success/10"
                    : "border-border bg-background hover:border-[oklch(0.7_0.2_40)] hover:bg-[oklch(0.7_0.2_40/0.05)]"
                }`}
                aria-pressed={licenseConfirmed}
              >
                <span
                  className={`mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border-2 transition-colors ${
                    licenseConfirmed
                      ? "border-success bg-success text-success-foreground"
                      : "border-foreground/40 bg-background"
                  }`}
                  aria-hidden
                >
                  {licenseConfirmed && <CheckCircle2 className="h-5 w-5" />}
                </span>
                <span className="flex-1 text-sm sm:text-base">
                  Oświadczam, że kierowca zestawu posiada odpowiednie uprawnienia do prowadzenia
                  samochodu z naszą przyczepą, w tym kategorię B, kod 96 / B96 lub B+E, jeżeli są
                  wymagane dla tego zestawu.
                </span>
              </button>

              <p className="mt-3 text-xs text-muted-foreground">
                Jeżeli osoba rezerwująca nie będzie kierowcą, potwierdzenie dotyczy faktycznego
                kierowcy zestawu.
              </p>

              {licenseConfirmed && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-success/40 bg-success/10 p-3 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  Uprawnienia kierowcy potwierdzone.
                </div>
              )}

              {showRequiredError && !licenseConfirmed && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Musisz potwierdzić uprawnienia kierowcy, aby przejść dalej z rezerwacją.
                </div>
              )}

              <div className="mt-5">
                {licenseConfirmed ? (
                  <Link
                    to="/rezerwacja"
                    search={{ from: search.from, to: search.to, addons: search.addons }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
                  >
                    Przejdź dalej <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRequiredError(true)}
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-muted px-6 py-3 text-sm font-semibold text-muted-foreground"
                    aria-disabled="true"
                  >
                    Przejdź dalej <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer e-TOLL */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-foreground" />
          <p className="text-warning-foreground">
            <strong>Ważne:</strong> kalkulator ma charakter wyłącznie pomocniczy. W razie
            wątpliwości zawsze sprawdź dane techniczne swojego pojazdu w dowodzie rejestracyjnym
            oraz upewnij się, że posiadasz odpowiednią kategorię prawa jazdy.
          </p>
        </div>
      </section>

      {/* WINIETY ZAGRANICZNE */}
      <section
        className={`container mx-auto max-w-4xl px-4 py-10 transition-opacity ${
          result && result.technicalOk && !licenseConfirmed ? "opacity-50" : "opacity-100"
        }`}
      >
        <ContentBlock
          title="Wyjazd za granicę i winiety"
          icon={<Globe className="h-5 w-5" />}
        >
          <p>
            Jeżeli planujesz wyjazd za granicę, sprawdź wcześniej zasady opłat drogowych i winiet w
            krajach, przez które będziesz jechać. W wielu krajach winiety najlepiej kupować
            bezpośrednio na oficjalnych stronach operatorów, bez prowizji pośredników.
          </p>
          <p className="text-xs text-muted-foreground">
            Poniżej znajdziesz linki dodane przez administratora do stron, na których można
            sprawdzić lub kupić winiety.
          </p>

          {vignettes.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
              Lista linków do winiet nie została jeszcze uzupełniona. Przed wyjazdem sprawdź
              aktualne zasady opłat drogowych dla krajów, przez które będziesz jechać.
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {vignettes.map((v: any) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {v.country}
                  </div>
                  <div className="mt-1 font-semibold">{v.title}</div>
                  {v.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                  )}
                  <a
                    href={v.url}
                    target={v.open_in_new_tab !== false ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Przejdź do strony
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </ContentBlock>
      </section>

      {/* CO TO JEST DMC */}
      <section className="container mx-auto max-w-4xl px-4 py-10">
        <ContentBlock
          title="Co to jest DMC i dlaczego jest ważne?"
          icon={<FileText className="h-5 w-5" />}
        >
          <p>
            DMC, czyli <strong>dopuszczalna masa całkowita</strong>, to maksymalna masa, z jaką
            pojazd lub przyczepa może legalnie poruszać się po drodze – razem z pasażerami,
            bagażem i ładunkiem. Wartość ta jest zapisana w dowodzie rejestracyjnym i nie wolno
            jej przekraczać.
          </p>
          <p>
            Trzymanie się DMC ma znaczenie dla <strong>bezpieczeństwa</strong>: wpływa na
            stabilność jazdy, drogę hamowania, zachowanie pojazdu w zakrętach oraz na zgodność z
            przepisami. Pomaga również dobrze zaplanować obciążenie zestawu samochód + przyczepa.
          </p>
        </ContentBlock>
      </section>

      {/* JAK SPRAWDZIĆ */}
      <section className="container mx-auto max-w-4xl px-4 py-10">
        <ContentBlock
          title="Jak sprawdzić, czy możesz ciągnąć naszą przyczepę?"
          icon={<Gauge className="h-5 w-5" />}
        >
          <ol className="grid gap-3 sm:grid-cols-2">
            {[
              "Sprawdź DMC samochodu w dowodzie rejestracyjnym (pole F.2).",
              "Sprawdź pole O.1 – maksymalną masę przyczepy z hamulcem.",
              "Porównaj O.1 z DMC naszej przyczepy (1800 kg).",
              "Suma DMC samochodu i 1800 kg to suma DMC zestawu (pole F.3).",
              "Sprawdź, czy mieścisz się w odpowiednim limicie uprawnień (B, B96, B+E).",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-gradient-sunset text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </ContentBlock>
      </section>

      {/* POLA Z DOWODU */}
      <section className="container mx-auto max-w-4xl px-4 py-10">
        <ContentBlock
          title="Co oznaczają pola z dowodu rejestracyjnego?"
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FieldExplain code="F.2" title="DMC samochodu" desc="Dopuszczalna masa całkowita Twojego auta." />
            <FieldExplain
              code="O.1"
              title="Przyczepa z hamulcem"
              desc="Maksymalna masa przyczepy z hamulcem, jaką może ciągnąć auto."
              highlight
            />
            <FieldExplain
              code="O.2"
              title="Przyczepa bez hamulca"
              desc="Maksymalna masa przyczepy bez własnego układu hamulcowego."
            />
            <FieldExplain
              code="F.3"
              title="Suma zestawu"
              desc="Dopuszczalna masa całkowita zestawu pojazdów (samochód + przyczepa)."
            />
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <p>
              W tym kalkulatorze korzystamy z <strong>O.1</strong>, ponieważ nasza przyczepa jest
              traktowana jako przyczepa z hamulcem. <strong>Suma zestawu</strong> to pole <strong>F.3</strong> w dowodzie
              rejestracyjnym – oznacza dopuszczalną masę całkowitą całego zestawu pojazdów.
            </p>
          </div>
        </ContentBlock>
      </section>

      {/* JAK ZNALEŹĆ */}
      <section className="container mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-display text-xl font-bold">
            <Info className="h-5 w-5 text-primary" />
            Jak znaleźć te dane w dowodzie?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Wszystkie istotne pola znajdziesz w dowodzie rejestracyjnym (część II – tabela z
            literami). DMC samochodu to <strong>F.2</strong>, a maksymalna masa przyczepy z
            hamulcem to <strong>O.1</strong>. Suma DMC zestawu pojazdów to pole <strong>F.3</strong>.
            Jeśli posiadasz starszy dowód, dane mogą również
            być wpisane w rubryce wskazującej dopuszczalną masę zestawu – w razie wątpliwości
            sprawdź wszystkie pola w sekcji „masy”.
          </p>

          <figure className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
              <img
                src={dowodPrzyklad}
                alt="Przykładowy dowód rejestracyjny z zaznaczonymi polami F.2 i O.1 – wzór, dane fikcyjne"
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-sunset text-[10px] font-bold text-primary-foreground">1</span>
                Pole <strong className="text-foreground">F.2</strong> – DMC samochodu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-sunset text-[10px] font-bold text-primary-foreground">2</span>
                Pole <strong className="text-foreground">O.1</strong> – masa przyczepy z hamulcem
              </span>
              <span className="basis-full italic">
                Wzór poglądowy – wszystkie dane osobowe na grafice są fikcyjne.
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* DLACZEGO NIE PRZEKRACZAĆ */}
      <section className="container mx-auto max-w-4xl px-4 py-10">
        <ContentBlock
          title="Dlaczego nie warto przekraczać DMC?"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              "Gorsze prowadzenie pojazdu i mniejsza stabilność.",
              "Wydłużona droga hamowania.",
              "Większe ryzyko niebezpiecznych sytuacji na drodze.",
              "Możliwe konsekwencje prawne i mandaty.",
              "Problemy podczas kontroli drogowej.",
              "Potencjalne problemy z odpowiedzialnością i ubezpieczeniem.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </ContentBlock>
      </section>

      {/* CZY KAŻDA PRZYCZEPA */}
      <section className="container mx-auto max-w-4xl px-4 py-10">
        <ContentBlock
          title="Czy każda przyczepa liczy się tak samo?"
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          <p>
            Nie. Sposób, w jaki obliczamy możliwość holowania, zależy od kilku rzeczy:
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              "Typu przyczepy (kempingowa, towarowa, lekka).",
              "Jej dopuszczalnej masy całkowitej (DMC).",
              "Tego, czy ma własny układ hamulcowy.",
              "Danych technicznych Twojego pojazdu (pola F.2, O.1, O.2).",
              "Rodzaju posiadanych przez Ciebie uprawnień.",
            ].map((i, k) => (
              <li key={k} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                {i}
              </li>
            ))}
          </ul>
        </ContentBlock>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-4xl px-4 py-10">
        <DmcFaq />
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-4xl px-4 py-12">
        <div className="overflow-hidden rounded-3xl bg-gradient-sunset p-8 text-primary-foreground shadow-glow sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="font-display text-2xl font-bold sm:text-3xl">
                Masz wątpliwości?
              </h3>
              <p className="mt-2 text-primary-foreground/90">
                Skontaktuj się z nami, a pomożemy sprawdzić, czy Twoje auto nadaje się do
                holowania naszej przyczepy.
              </p>
            </div>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-soft transition-transform hover:scale-[1.02]"
            >
              <Mail className="h-4 w-4" />
              Napisz do nas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function ContentBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </div>
  );
}

function FieldExplain({
  code,
  title,
  desc,
  highlight,
}: {
  code: string;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-background"
      }`}
    >
      <div
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
          highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        {code}
      </div>
      <div className="mt-2 font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
