import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  reservationId: z.string().uuid(),
});

const SLACK_CHANNEL = "#rezerwacje_hobby";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function pln(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Number(n).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;
}

async function notifySlack(r: any, paid: number) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  if (!lovableKey || !slackKey) {
    console.error(
      "[reservation-notify] Slack env vars missing: LOVABLE_API_KEY or SLACK_API_KEY",
    );
    return false;
  }

  const rental = Number(r.rental_total ?? r.total_amount ?? 0);
  const due = Math.max(0, rental - paid);

  const lines: string[] = [
    `:tada: *Nowe zapytanie rezerwacyjne*`,
    ``,
    `*Klient:* ${r.first_name ?? ""} ${r.last_name ?? ""}`,
    `*Email:* ${r.email ?? "—"}`,
    `*Telefon:* ${r.phone ?? "—"}`,
    `*Termin:* ${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}` +
      (r.nights ? ` (${r.nights} dób)` : r.days ? ` (${r.days} dni)` : ""),
    `*Osoby:* ${r.people_count ?? "—"}` +
      (r.is_abroad ? `  • :earth_africa: zagranica${r.country ? ` (${r.country})` : ""}` : ""),
    ``,
    `*Sezon:* ${r.season ?? "—"}  • *Cena/doba:* ${pln(r.price_per_day)}`,
    `*Koszt wynajmu:* ${pln(r.base_cost)}` +
      (r.service_fee ? `  • Serwis: ${pln(r.service_fee)}` : "") +
      (r.addons_total ? `  • Dodatki: ${pln(r.addons_total)}` : "") +
      (r.discount ? `  • Rabat: -${pln(r.discount)}` : ""),
    `*Razem wynajem:* ${pln(rental)}  • *Kaucja:* ${pln(r.deposit)}`,
    `*Wpłacono:* ${pln(paid)}  • *Pozostało:* ${pln(due)}`,
    `*Status rozliczenia:* ${r.settlement_status ?? "brak_wplat"}`,
  ];

  const extras: string[] = [];
  if (r.has_pet) extras.push(`:paw_prints: zwierzę${r.pets_count ? ` (${r.pets_count})` : ""}`);
  if (r.has_grill) extras.push("grill");
  if (r.extra_chairs) extras.push("krzesła");
  if (r.extra_table) extras.push("stolik");
  if (extras.length) lines.push(`*Dodatki:* ${extras.join(", ")}`);

  if (r.trip_plan || r.trip_notes) lines.push(`*Plan:* ${r.trip_plan ?? r.trip_notes}`);
  if (r.terms_accepted) lines.push(`:white_check_mark: regulamin zaakceptowany`);
  if (r.driver_license_confirmed) lines.push(`:white_check_mark: prawo jazdy potwierdzone`);
  if (r.dmc_result) lines.push(`*DMC:* ${typeof r.dmc_result === "string" ? r.dmc_result : JSON.stringify(r.dmc_result)}`);

  lines.push(``, `<https://camp-go.live/admin/rezerwacje|Otwórz panel admina>`);

  const text = lines.join("\n");

  const res = await fetch(
    "https://connector-gateway.lovable.dev/slack/api/chat.postMessage",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": slackKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    console.error("[reservation-notify] Slack send failed", res.status, data);
    return false;
  }
  return true;
}

export const Route = createFileRoute("/api/public/reservation-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.errors[0].message },
            { status: 400 },
          );
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        // Atomically claim the notification: only proceed if notified_at is NULL.
        // This prevents flooding the Slack channel by replaying the endpoint with a known reservation ID.
        const { data: claimed, error: claimError } = await supabase
          .from("reservations")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", parsed.data.reservationId)
          .is("notified_at", null)
          .select("id")
          .maybeSingle();

        if (claimError) {
          console.error("[reservation-notify] claim failed", claimError);
          return Response.json({ ok: true, slack: "skipped" });
        }
        if (!claimed) {
          // Either the reservation does not exist or it has already been notified.
          // Return a generic OK so the endpoint cannot be used as an existence oracle.
          return Response.json({ ok: true, slack: "skipped" });
        }

        const { data: reservation, error } = await supabase
          .from("reservations")
          .select(
            "id, first_name, last_name, email, phone, start_date, end_date, people_count, days, nights, season, price_per_day, base_cost, service_fee, addons_total, discount, rental_total, total_amount, deposit, settlement_status, has_pet, pets_count, has_grill, extra_chairs, extra_table, is_abroad, country, trip_plan, trip_notes, terms_accepted, driver_license_confirmed, dmc_result, status",
          )
          .eq("id", parsed.data.reservationId)
          .single();

        if (error || !reservation) {
          console.error("[reservation-notify] reservation not found", error);
          return Response.json({ ok: true, slack: "skipped" });
        }

        const { data: pays } = await supabase
          .from("reservation_payments")
          .select("amount, status")
          .eq("reservation_id", parsed.data.reservationId);
        const paid = (pays ?? [])
          .filter((p: any) => p.status === "wplacono")
          .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

        let slack: "sent" | "failed" | "skipped" = "skipped";
        try {
          const ok = await notifySlack(reservation, paid);
          slack = ok ? "sent" : "failed";
        } catch (e) {
          console.error("[reservation-notify] notifySlack threw", e);
          slack = "failed";
        }


        return Response.json({ ok: true, slack });
      },
    },
  },
});
