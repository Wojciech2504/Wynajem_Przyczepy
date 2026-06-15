import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Calendar, MapPin, Users, Car, ArrowRight, CheckCircle2 } from "lucide-react";
import heroAsset from "@/assets/hero-couple-lake.png.asset.json";
import { useSettings } from "@/lib/use-settings";
import { HeroSlider } from "@/components/HeroSlider";
const defaultHero = heroAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampGo – Wynajem przyczepy kempingowej" },
      { name: "description", content: "Komfortowa przyczepa kempingowa do wynajęcia. Sprawdź dostępność i zarezerwuj online." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const settings = useSettings();
  const mainImg = settings.heroImage || defaultHero;
  const extras = (settings.heroExtraImages || []).filter(Boolean);
  const sliderOn = settings.heroSliderEnabled && extras.length > 0;
  const sliderImages = sliderOn ? [mainImg, ...extras].slice(0, 5) : [mainImg];

  return (
    <PublicLayout>
      {/* HERO – split screen */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid max-w-7xl gap-10 px-4 pt-12 pb-6 md:pt-20 md:pb-8 lg:grid-cols-2 lg:items-center lg:pt-28 lg:pb-10">
          <div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Spakuj marzenia. <br />
              <span className="text-gradient-sunset">Ruszaj w drogę.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              Wynajmij komfortową przyczepę kempingową i odkrywaj świat na własnych zasadach.
              Pełne wyposażenie, sprawdzone bezpieczeństwo, gotowa do przygody.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/cennik" className="inline-flex items-center gap-2 rounded-full bg-gradient-sunset px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]">
                Sprawdź dostępność <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/kontakt" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                Wyślij zapytanie
              </Link>
            </div>

          </div>

          <div className="relative lg:-ml-12">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-sunset opacity-20 blur-2xl" />
            <div className="relative">
              {sliderOn ? (
                <HeroSlider
                  images={sliderImages}
                  intervalMs={settings.heroSliderIntervalMs}
                  alt="Przyczepa kempingowa Camp-Go"
                />
              ) : (
                <img
                  src={mainImg}
                  alt="Przyczepa kempingowa Camp-Go"
                  className="relative aspect-[16/9] w-full rounded-3xl object-cover shadow-glow"
                />
              )}
            </div>
          </div>


        </div>
      </section>

      {/* BENEFITS */}
      <section className="container mx-auto max-w-7xl px-4 pt-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calendar, title: "Łatwa rezerwacja", desc: "Sprawdź kalendarz dostępności i wyślij zapytanie w kilka minut.", to: "/cennik" },
            { icon: Users, title: "Komfort dla 4 osób", desc: "Pełne wyposażenie kuchenne, łazienka, ogrzewanie i markiza.", to: "/oferta" },
            { icon: MapPin, title: "Gotowa w drogę", desc: "Sprawdzony stan techniczny, pełne ubezpieczenie i instruktaż.", to: "/faq" },
            { icon: Car, title: "Sprawdź swoje auto", desc: "Przed rezerwacją upewnij się, czy Twój samochód może holować naszą przyczepę.", to: "/kalkulator-dmc", cta: "Sprawdź swoje auto" },
          ].map((b) => {
            const content = (
              <>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-sunset text-primary-foreground">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
                {b.cta && b.to && (
                  <Link to={b.to} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    {b.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </>
            );
            const cls = "rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-glow";
            if (b.to && !b.cta) {
              return (
                <Link key={b.title} to={b.to} className={cls}>
                  {content}
                </Link>
              );
            }
            return (
              <div key={b.title} className={cls}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-7xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-sunset p-10 text-primary-foreground sm:p-16">
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Zarezerwuj swój termin już dziś</h2>
            <p className="mt-3 text-base opacity-90">
              Zobacz, kiedy przyczepa jest wolna i zarezerwuj swoją przygodę. Odpowiadamy w ciągu 24 godzin.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/cennik" className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
                Otwórz kalendarz <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/kontakt" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-semibold">
                Skontaktuj się
              </Link>
            </div>
            <ul className="mt-8 grid gap-2 text-sm">
              {["Pełne ubezpieczenie OC/AC", "Instruktaż przy odbiorze", "Elastyczne warunki anulacji"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
