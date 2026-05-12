import { canUseLocalFallback, getAuthedSupabase, jsonOk, productionAuthError, readBody } from "@/lib/aira/api";

const languages = new Set(["en", "hi", "both"]);

export async function POST(request: Request) {
  const body = await readBody(request);
  const profile = {
    subjects: Array.isArray(body.subjects)
      ? body.subjects.map(String).filter(Boolean).slice(0, 8)
      : ["physics", "chemistry", "mathematics"],
    preferred_language: languages.has(String(body.preferred_language))
      ? String(body.preferred_language)
      : "en",
    onboarding_completed: true,
  };

  try {
    const { supabase, user } = await getAuthedSupabase();
    if (supabase && user) {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        subjects: profile.subjects,
        preferred_language: profile.preferred_language,
        onboarding_completed: profile.onboarding_completed,
        updated_at: new Date().toISOString(),
      });
      if (!error) {
        return jsonOk({ profile, source: "supabase" });
      }
    }
  } catch (error) {
    console.error("Profile upsert failed", error);
  }

  if (!canUseLocalFallback()) return productionAuthError("Profile persistence is not configured.");
  return jsonOk({ profile, source: "local" });
}
