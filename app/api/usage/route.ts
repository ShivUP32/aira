import { hasUpstashEnv, isProduction } from "@/lib/aira/env";
import { jsonOk, requireApiUser } from "@/lib/aira/api";

const HOURLY_LIMIT = 30;
const WINDOW = "1h";

export async function GET(request: Request) {
  const auth = await requireApiUser(request, { route: "usage" });
  if (!auth.ok) return auth.response;

  const rateLimitConfigured = hasUpstashEnv();

  return jsonOk({
    userId: auth.user.id,
    usage: {
      requests: {
        limit: HOURLY_LIMIT,
        window: WINDOW,
        enforced: rateLimitConfigured || isProduction(),
        source: rateLimitConfigured ? "upstash" : "local",
      },
    },
  });
}
