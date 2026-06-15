import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, ExternalLink, Download } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ – CampGo" }] }),
  component: FaqPage,
});

const CATEGORY_LABEL: Record<string, string> = {
  umowa: "Umowy",
  regulamin: "Regulaminy",
  polityka: "Polityka prywatności",
  inne: "Inne",
};
const CATEGORY_ORDER = ["umowa", "regulamin", "polityka", "inne"];

function formatBytes(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function FaqPage() {
  const { data: items = [] } = useQuery({
    queryKey: ["faq"],
    queryFn: async () => {
      const { data } = await supabase.from("faq_items").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: docs.filter((d: any) => d.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-3xl px-4 py-12 lg:py-20">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Najczęstsze pytania</h1>
        <p className="mt-3 text-muted-foreground">Nie znalazłeś odpowiedzi? Napisz do nas.</p>

        <Accordion type="single" collapsible className="mt-8">
          {items.map((it) => (
            <AccordionItem key={it.id} value={it.id}>
              <AccordionTrigger className="text-left font-semibold">{it.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {docs.length > 0 && (
          <div id="dokumenty-do-pobrania" className="mt-16 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Dokumenty do pobrania</h2>
            <p className="mt-2 text-sm text-muted-foreground">Umowy, regulaminy i polityka prywatności w PDF.</p>

            <div className="mt-6 space-y-8">
              {grouped.map(({ cat, items: list }) => (
                <div key={cat}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_LABEL[cat]}</h3>
                  <ul className="mt-3 space-y-2">
                    {list.map((d: any) => (
                      <li key={d.id}>
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-sunset text-primary-foreground">
                            {d.source === "upload" ? <FileText className="h-5 w-5" /> : <ExternalLink className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-base font-semibold leading-tight">{d.title}</div>
                            {d.description && <div className="mt-0.5 text-sm text-muted-foreground">{d.description}</div>}
                            <div className="mt-1 text-xs text-muted-foreground">
                              {d.source === "upload" ? `PDF${d.file_size ? ` · ${formatBytes(d.file_size)}` : ""}` : "Link zewnętrzny"}
                            </div>
                          </div>
                          <Download className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
