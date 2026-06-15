import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/winiety")({
  component: WinietyPage,
});

type VignetteLink = {
  id: string;
  country: string;
  title: string;
  url: string;
  description: string | null;
  active: boolean;
  open_in_new_tab: boolean;
  sort_order: number;
};

type Draft = Omit<VignetteLink, "id"> & { id?: string };

const empty: Draft = {
  country: "",
  title: "",
  url: "",
  description: "",
  active: true,
  open_in_new_tab: true,
  sort_order: 0,
};

function WinietyPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(empty);

  const { data: rows = [] } = useQuery({
    queryKey: ["admin_vignette_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vignette_links" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any[]) as VignetteLink[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin_vignette_links"] });
    qc.invalidateQueries({ queryKey: ["vignette_links_public"] });
  };

  const save = async () => {
    if (!draft.country.trim() || !draft.title.trim() || !draft.url.trim()) {
      toast.error("Kraj, tytuł i URL są wymagane");
      return;
    }
    const payload: any = {
      country: draft.country.trim(),
      title: draft.title.trim(),
      url: draft.url.trim(),
      description: draft.description?.trim() || null,
      active: draft.active,
      open_in_new_tab: draft.open_in_new_tab,
      sort_order: Number(draft.sort_order) || 0,
    };
    if (draft.id) {
      const { error } = await supabase.from("vignette_links" as any).update(payload).eq("id", draft.id);
      if (error) return toast.error(error.message);
      toast.success("Zapisano");
    } else {
      const { error } = await supabase.from("vignette_links" as any).insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Dodano link");
    }
    setDraft(empty);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Usunąć ten link?")) return;
    const { error } = await supabase.from("vignette_links" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Usunięto");
    refresh();
  };

  const toggle = async (row: VignetteLink) => {
    const { error } = await supabase
      .from("vignette_links" as any)
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Winiety zagraniczne</h1>
        <p className="text-sm text-muted-foreground">
          Linki do oficjalnych stron z winietami i opłatami drogowymi, widoczne dla klientów w
          sekcji „Sprawdź swoje auto".
        </p>
      </div>

      {/* Formularz */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">
          {draft.id ? "Edytuj link" : "Dodaj nowy link"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Kraj *</Label>
            <Input
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              placeholder="np. Czechy"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nazwa linku *</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Oficjalna strona zakupu winiety"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">URL *</Label>
            <Input
              type="url"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Opis (opcjonalnie)</Label>
            <Textarea
              rows={2}
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Zakup bezpośrednio u operatora, bez prowizji."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Kolejność</Label>
            <Input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="flex flex-col gap-2 pt-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Aktywny
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.open_in_new_tab}
                onChange={(e) => setDraft({ ...draft, open_in_new_tab: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Otwieraj w nowej karcie
            </label>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={save} className="bg-gradient-sunset text-primary-foreground hover:opacity-90">
            <Save className="mr-2 h-4 w-4" />
            {draft.id ? "Zapisz zmiany" : "Dodaj link"}
          </Button>
          {draft.id && (
            <Button variant="outline" onClick={() => setDraft(empty)}>
              Anuluj
            </Button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Wszystkie linki ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Brak linków. Dodaj pierwszy za pomocą formularza powyżej.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between ${
                  row.active ? "border-border bg-background" : "border-dashed border-border bg-muted/30 opacity-70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      {row.country}
                    </span>
                    <span className="text-muted-foreground">#{row.sort_order}</span>
                    {!row.active && <span className="text-xs text-muted-foreground">(wyłączony)</span>}
                  </div>
                  <div className="mt-1 font-semibold">{row.title}</div>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-primary hover:underline"
                  >
                    {row.url}
                  </a>
                  {row.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{row.description}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(row)}>
                    {row.active ? "Wyłącz" : "Włącz"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({
                        id: row.id,
                        country: row.country,
                        title: row.title,
                        url: row.url,
                        description: row.description ?? "",
                        active: row.active,
                        open_in_new_tab: row.open_in_new_tab,
                        sort_order: row.sort_order,
                      })
                    }
                  >
                    Edytuj
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(row.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
