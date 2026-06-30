/**
 * Optional Cloudflare Turnstile verification for the public demo (Epic 10.1).
 *
 * Disabled by default: when `TURNSTILE_SECRET_KEY` is unset the challenge is
 * skipped entirely, so self-hosters need no extra configuration. The siteverify
 * host is a fixed constant — never user-controlled — consistent with the
 * "fixed upstream allowlist" rule in AGENTS.md. The token and secret are never
 * logged or persisted.
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function turnstileSecret(): string | undefined {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  return secret ? secret : undefined;
}

/** True when an app-level Turnstile challenge should be enforced. */
export function isTurnstileEnabled(): boolean {
  return Boolean(turnstileSecret());
}

type SiteVerifyResponse = { success?: boolean };

/**
 * Verify a Turnstile token against Cloudflare siteverify.
 *
 * Returns `true` when the challenge is disabled (no secret configured). When
 * enabled, a missing token, a non-2xx response, a network error, or a
 * `success: false` body all resolve to `false` so the caller rejects before any
 * provider call.
 */
export async function verifyTurnstileToken(
  token: string | undefined,
): Promise<boolean> {
  const secret = turnstileSecret();
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as SiteVerifyResponse;
    return data.success === true;
  } catch {
    return false;
  }
}
