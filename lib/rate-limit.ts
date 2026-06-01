/**
 * Minimal in-memory, per-identifier rate limiter for the public demo
 * deployment. It is deployment-instance-local (no shared store) and is meant as
 * a lightweight guard, not a strong abuse-prevention system. Disabled unless
 * `RATE_LIMIT_PER_MINUTE` is set to a positive integer.
 */

export type RateLimitState = Map<string, number[]>;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const WINDOW_MS = 60_000;

/**
 * Pure, testable sliding-window check. Mutates `state` to record the hit when
 * allowed. `now` is injectable for deterministic tests.
 */
export function checkRateLimit(
  state: RateLimitState,
  identifier: string,
  limitPerMinute: number,
  now: number = Date.now(),
): RateLimitResult {
  if (!Number.isFinite(limitPerMinute) || limitPerMinute <= 0) {
    return { allowed: true, remaining: Infinity, retryAfterSeconds: 0 };
  }

  const windowStart = now - WINDOW_MS;
  const hits = (state.get(identifier) ?? []).filter((ts) => ts > windowStart);

  if (hits.length >= limitPerMinute) {
    const oldest = hits[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + WINDOW_MS - now) / 1000),
    );
    state.set(identifier, hits);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  hits.push(now);
  state.set(identifier, hits);
  return {
    allowed: true,
    remaining: limitPerMinute - hits.length,
    retryAfterSeconds: 0,
  };
}

/** Configured limit from the environment (0 disables rate limiting). */
export function configuredLimit(): number {
  const raw = process.env.RATE_LIMIT_PER_MINUTE;
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Best-effort client identifier from forwarding headers. */
export function clientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("cf-connecting-ip") ?? "anonymous";
}
