import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bed, Ruler, Weight, Calendar, Check } from "lucide-react";
import { Offer360View } from "@/components/Offer360View";
import interior from "@/assets/gallery-interior.jpg";

export const Route = createFileRoute("/oferta")({
  head: () => ({ meta: [{ title: "Oferta – CampGo" }, { name: "description", content: "Poznaj naszą przyczepę kempingową: parametry, wyposażenie i warunki wynajmu." }] }),
  component: OfferPage,
});


function OfferPage() {
  const { data: trailer } = useQuery({
    queryKey: ["trailer", "premium"],
    queryFn: async () => {
      const { data } = await supabase.from("trailers").select("*").eq("slug", "premium").maybeSingle();
      return data;
    },
  });

  const { data: rentalTerms = [] } = useQuery({
    queryKey: ["rental_terms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_terms" as any)
        .select("*")
        .eq("active", true)
        .order("sort_order");
      return (data as any[]) ?? [];
    },
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("public-content-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_terms" }, () => {
        queryClient.invalidateQueries({ queryKey: ["rental_terms"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "price_list" }, () => {
        queryClient.invalidateQueries({ queryKey: ["price_list"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "addon_fees" }, () => {
        queryClient.invalidateQueries({ queryKey: ["addon_fees"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trailers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["trailer", "premium"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const specs = (trailer?.specifications ?? {}) as Record<string, string>;
  const equipment = (trailer?.equipment ?? []) as string[];


  return (
    <PublicLayout>
      <section className="container mx-auto max-w-7xl px-4 py-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="text-sm font-medium text-primary">Nasza przyczepa</span>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {trailer?.name ?? "Przyczepa Kempingowa"}
            </h1>
            <p className="mt-4 text-base text-muted-foreground">{trailer?.full_description}</p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Bed, label: "Miejsca", value: trailer?.sleeping_places ?? 4 },
                { icon: Ruler, label: "Długość", value: specs.dlugosc ?? "—" },
                { icon: Weight, label: "DMC", value: specs.dmc ?? "—" },
                { icon: Calendar, label: "Rok produkcji", value: specs.rok ?? "2026" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <s.icon className="h-5 w-5 text-primary" />
                  <div className="mt-2 font-display text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <img src={(trailer as any)?.image_url || interior} alt="Wnętrze przyczepy" width={1280} height={960} loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-glow" />
        </div>

        <Offer360View />

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <h2 className="font-display text-2xl font-bold">Wyposażenie</h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {equipment.map((e) => (
                <li key={e} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" /> {e}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-warm p-8 shadow-soft">
            <h2 className="font-display text-2xl font-bold">Warunki wynajmu</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {rentalTerms.map((t: any) => (
                <li key={t.id}><strong>{t.label}:</strong> {t.value}</li>
              ))}
            </ul>

          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

