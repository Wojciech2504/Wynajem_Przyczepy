import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { Trash2, CalendarPlus } from "lucide-react";


export const Route = createFileRoute("/admin/wiadomosci")({
  component: MessagesAdmin,
});

function MessagesAdmin() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: "nowa" | "odczytana" | "zamknieta") => {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "messages"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Usunąć?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "messages"] });
    toast.success("Usunięto");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Wiadomości</h1>
        <p className="text-sm text-muted-foreground">Wiadomości z formularza kontaktowego</p>
      </div>

      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{m.name} <span className="ml-2 text-xs font-normal text-muted-foreground">{m.email}{m.phone ? ` • ${m.phone}` : ""}</span></div>
                <div className="text-xs text-muted-foreground">{format(parseISO(m.created_at), "d MMM yyyy, HH:mm", { locale: pl })}</div>
              </div>
              <div className="flex items-center gap-2">
                <select value={m.status} onChange={(e) => setStatus(m.id, e.target.value as any)} className="rounded-lg border border-input bg-background px-2 py-1 text-xs">
                  <option value="nowa">nowa</option>
                  <option value="odczytana">odczytana</option>
                  <option value="zamknieta">zamknieta</option>
                </select>
                <Link
                  to="/admin/kalendarz"
                  search={{ prefillFromMessage: m.id }}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Utwórz rezerwację
                </Link>
                <button onClick={() => remove(m.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>

            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">Brak wiadomości</div>}
      </div>
    </div>
  );
}
