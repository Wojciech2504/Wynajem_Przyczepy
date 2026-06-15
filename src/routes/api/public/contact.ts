import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(1000),
});

const SLACK_CHANNEL = "#rezerwacje_hobby";

async function notifySlack(d: z.infer<typeof schema>): Promise<boolean> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  if (!lovableKey || !slackKey) {
    console.error("[contact] Slack env vars missing: LOVABLE_API_KEY or SLACK_API_KEY");
    return false;
  }

  const text =
    `:incoming_envelope: *Nowa wiadomość z formularza*\n\n` +
    `*Imię:* ${d.name}\n` +
    `*Email:* ${d.email}\n` +
    (d.phone ? `*Telefon:* ${d.phone}\n` : "") +
    `\n*Wiadomość:*\n${d.message}`;

  const res = await fetch("https://connector-gateway.lovable.dev/slack/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": slackKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    console.error("[contact] Slack send failed", res.status, data);
    return false;
  }
  return true;
}


export const Route = createFileRoute("/api/public/contact")({
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
          return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
        }
        const data = parsed.data;

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        const { error } = await supabase.from("contact_messages").insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: data.message,
        });
        if (error) {
          console.error("DB insert failed", error);
          return Response.json({ error: "Nie udało się zapisać wiadomości" }, { status: 500 });
        }

        try {
          await notifySlack(data);
        } catch (e) {
          console.error("notifySlack threw", e);
        }


        return Response.json({ ok: true });
      },
    },
  },
});
