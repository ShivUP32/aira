export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function hasSupabaseServiceEnv() {
  return Boolean(hasSupabaseEnv() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasRagEnv() {
  return Boolean(hasSupabaseServiceEnv() && process.env.HF_API_TOKEN);
}

export function hasGroqEnv() {
  return Boolean(process.env.GROQ_API_KEY);
}

export function hasUpstashEnv() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function allowDemoAuth() {
  return !isProduction() && process.env.AIRA_ALLOW_DEMO_AUTH !== "false";
}

export function isLocalhost(host: string | null | undefined) {
  const hostname = (host || "").split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function allowLocalTestLogin(host: string | null | undefined) {
  return allowDemoAuth() && isLocalhost(host);
}

export function allowMissingEnvLocalFallback() {
  return !isProduction() && !hasSupabaseEnv();
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
