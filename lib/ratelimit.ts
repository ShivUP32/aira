import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (!_ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      analytics: true,
      prefix: 'aira:ratelimit',
    });
  }
  return _ratelimit;
}

export async function checkRateLimit(userId: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const { success, limit, remaining, reset } = await getRatelimit().limit(userId);
  return { success, limit, remaining, reset };
}
