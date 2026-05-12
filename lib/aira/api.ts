import { createClient } from "@/lib/supabase/server";
import { allowDemoAuth, allowLocalTestLogin, allowMissingEnvLocalFallback, hasSupabaseEnv, hasUpstashEnv, isProduction } from "@/lib/aira/env";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";

export type ApiSource = "supabase" | "groq" | "local" | "empty";

export function jsonOk<T extends Record<string, unknown>>(
  payload: T,
  init?: ResponseInit
) {
  return Response.json({ ok: true, ...payload }, init);
}

export function jsonError(message: string, status: number, details?: Record<string, unknown>) {
  return Response.json({ ok: false, error: message, ...details }, { status });
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

export function canUseLocalFallback() {
  return allowMissingEnvLocalFallback();
}

export function canUseDemoAuth() {
  return allowDemoAuth();
}

function hasLocalTestSession(request: Request) {
  if (!allowLocalTestLogin(request.headers.get("host"))) return false;
  const cookie = request.headers.get("cookie") || "";
  return (
    /(?:^|;\s*)aira_demo_session=1(?:;|$)/.test(cookie) &&
    /(?:^|;\s*)aira_test_email=test%40test\.com(?:;|$)/.test(cookie)
  );
}

export function productionAuthError(unavailableMessage: string) {
  return hasSupabaseEnv()
    ? jsonError("Authentication required.", 401)
    : jsonError(unavailableMessage, 503);
}

export async function requireApiUser(
  request: Request,
  options: { rateLimit?: boolean; route?: string } = {}
) {
  const route = options.route || new URL(request.url).pathname;

  if (!hasSupabaseEnv()) {
    if (options.rateLimit && hasUpstashEnv()) {
      const limited = await enforceRateLimit(request, route, undefined);
      if (limited) return limited;
    }
    return {
      ok: false as const,
      localFallback: canUseLocalFallback(),
      authConfigMissing: true,
      response: jsonError("Authentication is not configured.", 503),
    };
  }

  if (hasLocalTestSession(request)) {
    if (options.rateLimit && hasUpstashEnv()) {
      const limited = await enforceRateLimit(request, route, "local-test-user");
      if (limited) return limited;
    }
    return {
      ok: false as const,
      localFallback: true,
      authConfigMissing: true,
      response: jsonError("Local test session active.", 200),
    };
  }

  const { supabase, user } = await getAuthedSupabase();
  if (!supabase || !user) {
    return {
      ok: false as const,
      localFallback: canUseLocalFallback(),
      authConfigMissing: false,
      response: jsonError("Authentication required.", 401),
    };
  }

  if (options.rateLimit) {
    if (!hasUpstashEnv()) {
      if (isProduction()) {
        return {
          ok: false as const,
          localFallback: false,
          authConfigMissing: false,
          response: jsonError("Rate limiting is not configured.", 503),
        };
      }
    } else {
      const limited = await enforceRateLimit(request, route, user.id);
      if (limited) return limited;
    }
  }

  return { ok: true as const, supabase, user };
}

async function enforceRateLimit(request: Request, route: string, userId: string | undefined) {
  try {
    const result = await checkRateLimit({
      route,
      userId,
      ip: clientIp(request),
    });
    if (!result.success) {
      return {
        ok: false as const,
        localFallback: false,
        authConfigMissing: false,
        response: jsonError("Rate limit exceeded.", 429, {
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          window: result.window,
        }),
      };
    }
  } catch (error) {
    console.error("Rate limit check failed", error);
    if (isProduction()) {
      return {
        ok: false as const,
        localFallback: false,
        authConfigMissing: false,
        response: jsonError("Rate limiting is unavailable.", 503),
      };
    }
  }
  return null;
}
