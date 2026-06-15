import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/tresci")({
  component: ContentAdmin,
});

function ContentAdmin() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold">Treści, cennik i FAQ</h1>
        <p className="text-sm text-muted-foreground">Edytuj opis przyczepy, cennik i FAQ</p>
      </div>
      <TrailerEditor />
      <GalleryEditor />
      <SeasonDescriptionsEditor />
      <PriceListEditor />
      <RentalTermsEditor />
      <AddonFeesEditor />
      <DocumentsEditor />
      <FaqEditor />
    </div>
  );
}

function RentalTermsEditor() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "rental_terms"],
    queryFn: async () => {
      const { data } = await supabase.from("rental_terms" as any).select("*").order("sort_order");
      return (data as any[]) ?? [];
    },
  });
  const [newItem, setNewItem] = useState({ label: "", value: "" });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["rental_terms"] });
    qc.invalidateQueries({ queryKey: ["admin", "rental_terms"] });
  };

  const add = async () => {
    if (!newItem.label.trim() || !newItem.value.trim()) { toast.error("Uzupełnij etykietę i treść"); return; }
    const nextOrder = (items.reduce((m: number, x: any) => Math.max(m, x.sort_order ?? 0), 0)) + 1;
    const { error } = await supabase.from("rental_terms" as any).insert({ ...newItem, sort_order: nextOrder });
    if (error) toast.error(error.message);
    else { toast.success("Dodano"); setNewItem({ label: "", value: "" }); invalidate(); }
  };
  const update = async (id: string, patch: any) => {
    await supabase.from("rental_terms" as any).update(patch).eq("id", id);
    invalidate();
  };
  const remove = async (id: string) => {
    if (!confirm("Usunąć pozycję?")) return;
    await supabase.from("rental_terms" as any).delete().eq("id", id);
    invalidate();
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">Warunki wynajmu (widoczne na stronie Oferta)</h2>
      <p className="mt-1 text-sm text-muted-foreground">Dowolne pozycje typu „Kaucja: 2500 zł". Aktywne wyświetlają się w sekcji „Warunki wynajmu" na /oferta w kolejności sortowania.</p>
      <ul className="mt-4 space-y-2">
        {items.map((p: any) => (
          <li key={p.id} className="grid items-center gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_2fr_80px_auto_auto]">
            <input defaultValue={p.label} onBlur={(e) => update(p.id, { label: e.target.value })} className={inputCls} placeholder="Etykieta" />
            <input defaultValue={p.value} onBlur={(e) => update(p.id, { value: e.target.value })} className={inputCls} placeholder="Treść" />
            <input type="number" defaultValue={p.sort_order ?? 0} onBlur={(e) => update(p.id, { sort_order: +e.target.value })} className={inputCls} title="Kolejność" />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} />
              aktywna
            </label>
            <button onClick={() => remove(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">Brak pozycji – dodaj poniżej.</li>}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input placeholder="Etykieta (np. Kaucja)" value={newItem.label} onChange={(e) => setNewItem({ ...newItem, label: e.target.value })} className={inputCls} />
        <input placeholder="Treść (np. 2500 zł, zwrotna po wynajmie)" value={newItem.value} onChange={(e) => setNewItem({ ...newItem, value: e.target.value })} className={inputCls} />
        <button onClick={add} className="rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground">Dodaj</button>
      </div>
    </section>
  );
}



const DOC_CATEGORIES = [
  { value: "umowa", label: "Umowa" },
  { value: "regulamin", label: "Regulamin" },
  { value: "polityka", label: "Polityka prywatności" },
  { value: "inne", label: "Inne" },
] as const;

function DocumentsEditor() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "documents"],
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [form, setForm] = useState({ title: "", description: "", category: "regulamin", file_url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setForm({ title: "", description: "", category: "regulamin", file_url: "" });
    setFile(null);
  };

  const add = async () => {
    if (!form.title.trim()) { toast.error("Podaj tytuł"); return; }
    setBusy(true);
    try {
      let payload: any = { title: form.title, description: form.description || null, category: form.category };
      if (mode === "upload") {
        if (!file) { toast.error("Wybierz plik PDF"); return; }
        if (file.type !== "application/pdf") { toast.error("Tylko pliki PDF"); return; }
        if (file.size > 10 * 1024 * 1024) { toast.error("Plik większy niż 10 MB"); return; }
        const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "dokument";
        const path = `${Date.now()}-${slug}.pdf`;
        const up = await supabase.storage.from("documents").upload(path, file, { contentType: "application/pdf" });
        if (up.error) { toast.error(up.error.message); return; }
        const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
        payload = { ...payload, file_url: pub.publicUrl, file_size: file.size, source: "upload" };
      } else {
        if (!/^https?:\/\/.+/i.test(form.file_url)) { toast.error("Podaj poprawny URL (https://...)"); return; }
        payload = { ...payload, file_url: form.file_url, source: "link" };
      }
      const { error } = await supabase.from("documents").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Dodano dokument");
      reset();
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["admin", "documents"] });
    } finally {
      setBusy(false);
    }
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("documents").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["documents"] });
    qc.invalidateQueries({ queryKey: ["admin", "documents"] });
  };

  const remove = async (item: any) => {
    if (!confirm("Usunąć dokument?")) return;
    if (item.source === "upload" && item.file_url) {
      const path = item.file_url.split("/documents/").pop();
      if (path) await supabase.storage.from("documents").remove([path]);
    }
    await supabase.from("documents").delete().eq("id", item.id);
    qc.invalidateQueries({ queryKey: ["documents"] });
    qc.invalidateQueries({ queryKey: ["admin", "documents"] });
    toast.success("Usunięto");
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">Dokumenty do pobrania</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pojawią się w sekcji „Dokumenty do pobrania" na stronie FAQ.</p>

      <ul className="mt-4 space-y-2">
        {items.map((d: any) => (
          <li key={d.id} className="grid items-center gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_2fr_1fr_auto_auto_auto]">
            <input defaultValue={d.title} onBlur={(e) => update(d.id, { title: e.target.value })} className={inputCls} />
            <input defaultValue={d.description ?? ""} placeholder="Opis" onBlur={(e) => update(d.id, { description: e.target.value || null })} className={inputCls} />
            <select defaultValue={d.category} onChange={(e) => update(d.id, { category: e.target.value })} className={inputCls}>
              {DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{d.source === "upload" ? "PDF" : "link"}</a>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={d.active} onChange={(e) => update(d.id, { active: e.target.checked })} />
              aktywny
            </label>
            <button onClick={() => remove(d)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">Brak dokumentów.</li>}
      </ul>

      <div className="mt-6 rounded-xl border border-dashed border-border p-4">
        <div className="mb-3 flex gap-2">
          <button onClick={() => setMode("upload")} className={`rounded-full px-3 py-1 text-xs font-medium ${mode === "upload" ? "bg-foreground text-background" : "bg-muted"}`}>Wgraj PDF</button>
          <button onClick={() => setMode("link")} className={`rounded-full px-3 py-1 text-xs font-medium ${mode === "link" ? "bg-foreground text-background" : "bg-muted"}`}>Wklej link</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input placeholder="Tytuł" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
            {DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input placeholder="Krótki opis (opcjonalny)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls + " sm:col-span-2"} />
          {mode === "upload" ? (
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={inputCls + " sm:col-span-2"} />
          ) : (
            <input placeholder="https://..." value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} className={inputCls + " sm:col-span-2"} />
          )}
        </div>
        <button onClick={add} disabled={busy} className="mt-3 rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Dodawanie..." : "Dodaj dokument"}
        </button>
      </div>
    </section>
  );
}


function SeasonDescriptionsEditor() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "season_descriptions"],
    queryFn: async () => {
      const { data } = await supabase.from("season_descriptions").select("*");
      const order: Record<string, number> = { high: 1, mid: 2, low: 3 };
      return (data ?? []).sort((a: any, b: any) => (order[a.season] ?? 9) - (order[b.season] ?? 9));
    },
  });

  const labels: Record<string, string> = { high: "Sezon wysoki", mid: "Sezon średni", low: "Sezon niski" };

  const save = async (season: string, description: string) => {
    const { error } = await supabase.from("season_descriptions").update({ description }).eq("season", season);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano"); qc.invalidateQueries({ queryKey: ["season_descriptions"] }); qc.invalidateQueries({ queryKey: ["admin", "season_descriptions"] }); }
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">Opisy sezonów (cennik – tooltip)</h2>
      <p className="mt-1 text-sm text-muted-foreground">Tekst wyświetlany w cenniku po najechaniu na kartę sezonu. Dodaj tutaj dokładne daty obowiązywania.</p>
      <ul className="mt-4 space-y-3">
        {items.map((s: any) => (
          <li key={s.season} className="rounded-xl border border-border p-3">
            <div className="text-sm font-semibold">{labels[s.season] ?? s.season}</div>
            <textarea
              rows={3}
              defaultValue={s.description}
              onBlur={(e) => save(s.season, e.target.value)}
              className={inputCls + " mt-2 resize-none"}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}


function TrailerEditor() {
  const qc = useQueryClient();
  const { data: trailer } = useQuery({
    queryKey: ["admin", "trailer"],
    queryFn: async () => {
      const { data } = await supabase.from("trailers").select("*").eq("slug", "premium").maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState({
    name: "",
    short_description: "",
    full_description: "",
    image_url: "",
    sleeping_places: 4,
    dlugosc: "",
    dmc: "",
    rok: "",
    equipment: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (trailer) {
      const specs = (trailer.specifications ?? {}) as Record<string, string>;
      const equip = (trailer.equipment ?? []) as string[];
      setForm({
        name: trailer.name,
        short_description: trailer.short_description ?? "",
        full_description: trailer.full_description ?? "",
        image_url: (trailer as any).image_url ?? "",
        sleeping_places: trailer.sleeping_places ?? 4,
        dlugosc: specs.dlugosc ?? "",
        dmc: specs.dmc ?? "",
        rok: specs.rok ?? "",
        equipment: equip.join("\n"),
      });
    }
  }, [trailer]);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Wybierz obraz"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Plik większy niż 8 MB"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `trailers/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("documents").upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) { toast.error(up.error.message); return; }
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: pub.publicUrl }));
      toast.success("Zdjęcie wgrane (kliknij Zapisz)");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!trailer) return;
    const payload: any = {
      name: form.name,
      short_description: form.short_description,
      full_description: form.full_description,
      image_url: form.image_url || null,
      sleeping_places: Number(form.sleeping_places) || 4,
      specifications: { dlugosc: form.dlugosc, dmc: form.dmc, rok: form.rok },
      equipment: form.equipment.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("trailers").update(payload).eq("id", trailer.id);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano"); qc.invalidateQueries({ queryKey: ["trailer"] }); qc.invalidateQueries({ queryKey: ["admin", "trailer"] }); }
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">Oferta – opis i zdjęcie przyczepy</h2>
      <p className="mt-1 text-sm text-muted-foreground">Treści widoczne na stronie /oferta.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nazwa" />
          <textarea rows={2} className={inputCls + " resize-none"} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Krótki opis" />
          <textarea rows={5} className={inputCls + " resize-none"} value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} placeholder="Pełny opis (widoczny na /oferta)" />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">Miejsca
              <input type="number" className={inputCls} value={form.sleeping_places} onChange={(e) => setForm({ ...form, sleeping_places: +e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">Rok produkcji
              <input className={inputCls} value={form.rok} onChange={(e) => setForm({ ...form, rok: e.target.value })} placeholder="2026" />
            </label>
            <label className="text-xs text-muted-foreground">Długość
              <input className={inputCls} value={form.dlugosc} onChange={(e) => setForm({ ...form, dlugosc: e.target.value })} placeholder="np. 5,5 m" />
            </label>
            <label className="text-xs text-muted-foreground">DMC
              <input className={inputCls} value={form.dmc} onChange={(e) => setForm({ ...form, dmc: e.target.value })} placeholder="np. 1300 kg" />
            </label>
          </div>
          <label className="block text-xs text-muted-foreground">Wyposażenie (jedna pozycja na linię)
            <textarea rows={6} className={inputCls + " mt-1 resize-none"} value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder={"Lodówka\nKuchenka gazowa\n..."} />
          </label>
        </div>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Zdjęcie na stronie Oferta</div>
          {form.image_url ? (
            <img src={form.image_url} alt="Podgląd" className="aspect-[4/3] w-full rounded-2xl object-cover" />
          ) : (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">Brak zdjęcia (zostanie użyte domyślne)</div>
          )}
          <input type="file" accept="image/*" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} className={inputCls} />
          {form.image_url && (
            <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="text-xs text-destructive hover:underline">Usuń zdjęcie</button>
          )}
        </div>
      </div>
      <button onClick={save} disabled={busy} className="mt-5 rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">Zapisz</button>
    </section>
  );
}

function GalleryEditor() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "gallery_images"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery_images").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["gallery_images"] });
    qc.invalidateQueries({ queryKey: ["admin", "gallery_images"] });
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Wybierz obraz"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Plik większy niż 8 MB"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const up = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
      if (up.error) { toast.error(up.error.message); return; }
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      const nextOrder = (items.reduce((m: number, x: any) => Math.max(m, x.sort_order ?? 0), 0)) + 1;
      const { error } = await supabase.from("gallery_images").insert({
        image_url: pub.publicUrl,
        title: title || null,
        sort_order: nextOrder,
        active: true,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Dodano zdjęcie");
      setTitle("");
      invalidate();
    } finally {
      setBusy(false);
    }
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("gallery_images").update(patch).eq("id", id);
    invalidate();
  };

  const remove = async (item: any) => {
    if (!confirm("Usunąć zdjęcie?")) return;
    const marker = "/documents/";
    const idx = item.image_url.indexOf(marker);
    if (idx >= 0) {
      const path = item.image_url.slice(idx + marker.length);
      await supabase.storage.from("documents").remove([path]);
    }
    await supabase.from("gallery_images").delete().eq("id", item.id);
    invalidate();
    toast.success("Usunięto");
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">Galeria</h2>
      <p className="mt-1 text-sm text-muted-foreground">Zdjęcia wyświetlane na stronie /galeria. Jeśli lista jest pusta, pokażą się zdjęcia domyślne.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g: any) => (
          <div key={g.id} className="rounded-xl border border-border p-2">
            <img src={g.image_url} alt={g.title ?? ""} className="aspect-[4/3] w-full rounded-lg object-cover" />
            <input
              defaultValue={g.title ?? ""}
              placeholder="Podpis (opcjonalny)"
              onBlur={(e) => update(g.id, { title: e.target.value || null })}
              className={inputCls + " mt-2"}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" defaultChecked={g.active} onChange={(e) => update(g.id, { active: e.target.checked })} />
                aktywne
              </label>
              <label className="flex items-center gap-1 text-xs">
                kolejność
                <input
                  type="number"
                  defaultValue={g.sort_order ?? 0}
                  onBlur={(e) => update(g.id, { sort_order: +e.target.value })}
                  className="w-16 rounded-md border border-input bg-background px-2 py-1 text-xs"
                />
              </label>
              <button onClick={() => remove(g)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-muted-foreground">Brak zdjęć – dodaj pierwsze poniżej.</div>}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border p-4">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <input placeholder="Podpis (opcjonalny)" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <input type="file" accept="image/*" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} className={inputCls} />
        </div>
        {busy && <div className="mt-2 text-xs text-muted-foreground">Wgrywanie...</div>}
      </div>
    </section>
  );
}

function PriceListEditor() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "prices"],
    queryFn: async () => {
      const { data } = await supabase.from("price_list").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const [newItem, setNewItem] = useState({ name: "", description: "", price: 0, unit: "doba" });

  const add = async () => {
    if (!newItem.name || !newItem.price) return;
    const { error } = await supabase.from("price_list").insert(newItem);
    if (error) toast.error(error.message);
    else { toast.success("Dodano"); setNewItem({ name: "", description: "", price: 0, unit: "doba" }); qc.invalidateQueries({ queryKey: ["price_list"] }); qc.invalidateQueries({ queryKey: ["admin", "prices"] }); }
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("price_list").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["price_list"] });
    qc.invalidateQueries({ queryKey: ["admin", "prices"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Usunąć?")) return;
    await supabase.from("price_list").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["price_list"] });
    qc.invalidateQueries({ queryKey: ["admin", "prices"] });
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">Cennik</h2>
      <ul className="mt-4 space-y-2">
        {items.map((p) => (
          <li key={p.id} className="grid items-center gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto_auto]">
            <input defaultValue={p.name} onBlur={(e) => update(p.id, { name: e.target.value })} className={inputCls} />
            <input defaultValue={p.description ?? ""} onBlur={(e) => update(p.id, { description: e.target.value })} className={inputCls} />
            <input type="number" defaultValue={p.price} onBlur={(e) => update(p.id, { price: +e.target.value })} className={inputCls} />
            <input defaultValue={p.unit} onBlur={(e) => update(p.id, { unit: e.target.value })} className={inputCls} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} />
              aktywny
            </label>
            <button onClick={() => remove(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]">
        <input placeholder="Nazwa" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className={inputCls} />
        <input placeholder="Opis" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className={inputCls} />
        <input type="number" placeholder="Cena" value={newItem.price || ""} onChange={(e) => setNewItem({ ...newItem, price: +e.target.value })} className={inputCls} />
        <input placeholder="Jednostka" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} className={inputCls} />
        <button onClick={add} className="rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground">Dodaj</button>
      </div>
    </section>
  );
}

function FaqEditor() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "faq"],
    queryFn: async () => {
      const { data } = await supabase.from("faq_items").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const [newItem, setNewItem] = useState({ question: "", answer: "" });

  const add = async () => {
    if (!newItem.question || !newItem.answer) return;
    await supabase.from("faq_items").insert(newItem);
    setNewItem({ question: "", answer: "" });
    qc.invalidateQueries({ queryKey: ["faq"] });
    qc.invalidateQueries({ queryKey: ["admin", "faq"] });
    toast.success("Dodano pytanie");
  };
  const update = async (id: string, patch: any) => {
    await supabase.from("faq_items").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["faq"] });
    qc.invalidateQueries({ queryKey: ["admin", "faq"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Usunąć?")) return;
    await supabase.from("faq_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["faq"] });
    qc.invalidateQueries({ queryKey: ["admin", "faq"] });
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">FAQ</h2>
      <ul className="mt-4 space-y-3">
        {items.map((f) => (
          <li key={f.id} className="rounded-xl border border-border p-3">
            <input defaultValue={f.question} onBlur={(e) => update(f.id, { question: e.target.value })} className={inputCls + " font-semibold"} />
            <textarea rows={2} defaultValue={f.answer} onBlur={(e) => update(f.id, { answer: e.target.value })} className={inputCls + " mt-2 resize-none"} />
            <div className="mt-2 flex justify-between text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={f.active} onChange={(e) => update(f.id, { active: e.target.checked })} /> aktywne
              </label>
              <button onClick={() => remove(f.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2">
        <input placeholder="Pytanie" value={newItem.question} onChange={(e) => setNewItem({ ...newItem, question: e.target.value })} className={inputCls} />
        <textarea rows={2} placeholder="Odpowiedź" value={newItem.answer} onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })} className={inputCls + " resize-none"} />
        <button onClick={add} className="rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground">Dodaj pytanie</button>
      </div>
    </section>
  );
}

function AddonFeesEditor() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "addon_fees"],
    queryFn: async () => {
      const { data } = await supabase.from("addon_fees" as any).select("*").order("sort_order");
      return (data as any[]) ?? [];
    },
  });
  const [newItem, setNewItem] = useState({ name: "", description: "", price: 0, unit: "wynajem" });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["addon_fees"] });
    qc.invalidateQueries({ queryKey: ["admin", "addon_fees"] });
  };

  const add = async () => {
    if (!newItem.name || !newItem.price) return;
    const { error } = await supabase.from("addon_fees" as any).insert(newItem);
    if (error) toast.error(error.message);
    else { toast.success("Dodano"); setNewItem({ name: "", description: "", price: 0, unit: "wynajem" }); invalidate(); }
  };
  const update = async (id: string, patch: any) => {
    await supabase.from("addon_fees" as any).update(patch).eq("id", id);
    invalidate();
  };
  const remove = async (id: string) => {
    if (!confirm("Usunąć?")) return;
    await supabase.from("addon_fees" as any).delete().eq("id", id);
    invalidate();
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-semibold">Dodatkowe opłaty (checkboxy w kalkulatorze)</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pozycje, które klient może zaznaczyć przy rezerwacji (np. zwierzę). Aktywne pojawiają się w „Podsumowaniu kosztów" na /cennik.</p>
      <ul className="mt-4 space-y-2">
        {items.map((p) => (
          <li key={p.id} className="grid items-center gap-2 rounded-xl border border-border p-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto_auto]">
            <input defaultValue={p.name} onBlur={(e) => update(p.id, { name: e.target.value })} className={inputCls} placeholder="Nazwa" />
            <input defaultValue={p.description ?? ""} onBlur={(e) => update(p.id, { description: e.target.value })} className={inputCls} placeholder="Opis" />
            <input type="number" defaultValue={p.price} onBlur={(e) => update(p.id, { price: +e.target.value })} className={inputCls} />
            <select defaultValue={p.unit} onBlur={(e) => update(p.id, { unit: e.target.value })} className={inputCls}>
              <option value="wynajem">/ wynajem</option>
              <option value="doba">/ doba</option>
            </select>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} />
              aktywny
            </label>
            <button onClick={() => remove(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">Brak dodatków – dodaj poniżej.</li>}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]">
        <input placeholder="Nazwa (np. Zwierzę)" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className={inputCls} />
        <input placeholder="Opis (opcjonalnie)" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className={inputCls} />
        <input type="number" placeholder="Cena" value={newItem.price || ""} onChange={(e) => setNewItem({ ...newItem, price: +e.target.value })} className={inputCls} />
        <select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} className={inputCls}>
          <option value="wynajem">/ wynajem</option>
          <option value="doba">/ doba</option>
        </select>
        <button onClick={add} className="rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground">Dodaj</button>
      </div>
    </section>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
