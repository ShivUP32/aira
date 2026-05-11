import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/aira/env";

export type ApiSource = "supabase" | "openrouter" | "seed" | "local" | "empty";

export function jsonOk<T extends Record<string, unknown>>(
  payload: T,
  init?: ResponseInit
) {
  return Response.json({ ok: true, ...payload }, init);
}

export async function readBody(request: Request) {
  const body = await request.json().catch(() => ({}));
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

export function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function cleanLimit(value: unknown, fallback = 5, max = 10) {
  const limit = Number(value || fallback);
  if (!Number.isFinite(limit)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(limit)));
}

export function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function numericDocumentId(value: unknown) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function getAuthedSupabase() {
  if (!hasSupabaseEnv()) return { supabase: null, user: null };

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}
