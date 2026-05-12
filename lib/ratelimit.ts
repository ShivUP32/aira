import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type LimitWindow = "hour" | "day";

let redis: Redis | null = null;
const ratelimits = new Map<LimitWindow, Ratelimit>();

const hourlyLimit = Number(process.env.AIRA_RATE_LIMIT_HOURLY || 30);
const dailyLimit = Number(process.env.AIRA_RATE_LIMIT_DAILY || 200);

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

function getRatelimit(window: LimitWindow): Ratelimit {
  const cached = ratelimits.get(window);
  if (cached) return cached;

  const limit = window === "hour" ? hourlyLimit : dailyLimit;
  const duration = window === "hour" ? "1 h" : "1 d";
  const ratelimit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, duration),
    analytics: true,
    prefix: `aira:ratelimit:${window}`,
  });
  ratelimits.set(window, ratelimit);
  return ratelimit;
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwarded ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(identity: {
  route: string;
  userId?: string;
  ip?: string;
}): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  window: LimitWindow;
}> {
  const key = `${identity.route}:${identity.userId || `ip:${identity.ip || "unknown"}`}`;
  const [hour, day] = await Promise.all([
    getRatelimit("hour").limit(key),
    getRatelimit("day").limit(key),
  ]);
  const failedWindow: LimitWindow = !hour.success ? "hour" : "day";
  const result = hour.success ? day : hour;
  return {
    success: hour.success && day.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    window: failedWindow,
  };
}
