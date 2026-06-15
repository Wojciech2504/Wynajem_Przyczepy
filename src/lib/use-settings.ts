import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  bankAccount: string;
  bankName: string;
  bankRecipient: string;
  nip: string;
  regon: string;
  companyName: string;
  slackWebhook: string;
  notifyEmail: string;
  phoneReservationHours: number;
  pickupAfter: string;
  returnBefore: string;
  etollUrl: string;
  etollButtonLabel: string;
  etollEnabled: boolean;
  heroImage: string;
  heroExtraImages: string[];
  heroSliderEnabled: boolean;
  heroSliderIntervalMs: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  siteName: "Camp-Go",
  contactEmail: "",
  contactPhone: "",
  address: "",
  bankAccount: "",
  bankName: "",
  bankRecipient: "",
  nip: "",
  regon: "",
  companyName: "",
  slackWebhook: "",
  notifyEmail: "",
  phoneReservationHours: 48,
  pickupAfter: "14:00",
  returnBefore: "14:00",
  etollUrl: "https://etoll.gov.pl/",
  etollButtonLabel: "Sprawdź e-TOLL",
  etollEnabled: true,
  heroImage: "",
  heroExtraImages: [],
  heroSliderEnabled: false,
  heroSliderIntervalMs: 4500,
};

// Fields stored in admin-only `app_settings_secrets` table.
const SECRET_KEYS = ["slackWebhook", "notifyEmail"] as const;
type SecretKey = (typeof SECRET_KEYS)[number];

export const SETTINGS_KEY = "campgo.settings"; // local cache only

function readCache(): Partial<AppSettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function writeCache(s: AppSettings) {
  try {
    // Never persist admin-only secrets to localStorage.
    const safe = { ...s } as Partial<AppSettings>;
    for (const k of SECRET_KEYS) delete safe[k];
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
  } catch {}
}

export async function loadSettingsFromDb(): Promise<AppSettings> {
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...readCache() };
  try {
    const { data: pub } = (await (supabase as any)
      .from("app_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle()) as { data: { data: Partial<AppSettings> } | null };
    if (pub?.data) Object.assign(merged, pub.data);
  } catch {}
  // Try to load secrets — only succeeds for admin (RLS).
  try {
    const { data: sec } = (await (supabase as any)
      .from("app_settings_secrets")
      .select("data")
      .eq("id", 1)
      .maybeSingle()) as { data: { data: Partial<AppSettings> } | null };
    if (sec?.data) Object.assign(merged, sec.data);
  } catch {}
  writeCache(merged);
  return merged;
}

export function useSettings(): AppSettings {
  const [s, setS] = useState<AppSettings>(() => ({ ...DEFAULT_SETTINGS, ...readCache() }));

  useEffect(() => {
    let alive = true;
    loadSettingsFromDb().then((next) => {
      if (alive) setS(next);
    });
    const onCustom = () => {
      loadSettingsFromDb().then((next) => {
        if (alive) setS(next);
      });
    };
    window.addEventListener("campgo:settings-updated", onCustom);
    return () => {
      alive = false;
      window.removeEventListener("campgo:settings-updated", onCustom);
    };
  }, []);

  return s;
}

export async function saveSettings(s: AppSettings) {
  const publicData: Record<string, unknown> = {};
  const secretData: Record<string, unknown> = {};
  for (const k of Object.keys(s) as (keyof AppSettings)[]) {
    if ((SECRET_KEYS as readonly string[]).includes(k as string)) {
      secretData[k] = s[k];
    } else {
      publicData[k] = s[k];
    }
  }

  const { error: pubErr } = await (supabase as any)
    .from("app_settings")
    .upsert({ id: 1, data: publicData, updated_at: new Date().toISOString() });
  if (pubErr) throw pubErr;

  const { error: secErr } = await (supabase as any)
    .from("app_settings_secrets")
    .upsert({ id: 1, data: secretData, updated_at: new Date().toISOString() });
  if (secErr) throw secErr;

  writeCache(s);
  window.dispatchEvent(new Event("campgo:settings-updated"));
}
