# Epic 10.1 — Public Demo Abuse Protection

> Upstream: [plan.md](../plan.md) (M10 candidates) / [prd.md](../../prd.md) (§12.4 Interface protection, §17 Environment variables, §22.1 Risk register) / [security.md](../../security.md)

| Field | Value |
| ----- | ----- |
| Milestone | M10 |
| Status | Planned |
| Priority | P0 |
| Depends on | M4 (origin check, request-size limit, in-memory rate-limit fallback) |

## Goal

Give the public demo a real application-layer abuse control. Today `/api/generate` has an Origin
check, a streamed request-size cap, and an **instance-local** rate limiter
([app/api/generate/route.ts](../../../app/api/generate/route.ts)). On Cloudflare Workers that
`Map` lives per isolate, so attackers spread naturally across isolates and the limiter is
best-effort only — it must not be treated as the primary control. Add an **optional** Cloudflare
Turnstile challenge, verified server-side before any provider call, **disabled by default** so
self-hosters need no extra configuration.

## Checklist

### Client widget (optional)
- [ ] Render the Turnstile widget only when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set; otherwise the
      form behaves exactly as today (no widget, no token).
- [ ] Pass the obtained token to `/api/generate` as a non-secret field; never log it.
- [ ] i18n copy for the challenge area in `i18n/en.json` / `i18n/zh-CN.json`.

### Server verification
- [ ] In `/api/generate`, when `TURNSTILE_SECRET_KEY` is set, verify the token via Cloudflare
      `siteverify` (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) **before** any
      provider call, size parsing, or image handling beyond what is needed to read the token.
- [ ] The siteverify host is a fixed constant — never user-controlled — consistent with the
      "providers from a fixed allowlist" rule in `AGENTS.md`.
- [ ] When the secret is unset, skip verification entirely (self-host default path, no regression).
- [ ] Add an error code (e.g. `CHALLENGE_FAILED` → HTTP 403) and a normalized message; reuse the
      existing `errorResponse` flow. Missing/invalid token when enabled → reject before provider call.

### Documentation
- [ ] Document the env vars and the demo-vs-self-host behavior in [cloudflare-deploy.md](../../cloudflare-deploy.md)
      and cross-reference PRD §12.4. Make explicit that WAF / Rate Limiting + Turnstile are the
      real controls and the in-memory limiter is only a per-isolate fallback.

### Tests
- [ ] Mocked-fetch tests: siteverify success → request proceeds; failure / missing token → 403.
- [ ] Disabled path (no secret) → verification skipped, existing behavior unchanged.
- [ ] `guard:secrets` proves the token and secret never reach logs.

## Acceptance

- [ ] With `TURNSTILE_SECRET_KEY` unset, the demo and self-host flow are byte-for-byte unchanged
      (regression-safe default-off).
- [ ] With the secret set, a missing or invalid token returns 403 **before** any provider call.
- [ ] siteverify is called server-side against the fixed Cloudflare host only.
- [ ] No key, token, or secret appears in logs or error bodies; full gate green
      (`lint`, `typecheck`, `test`, `build`, `guard:secrets`).

## Notes

- Keeps BYOK / no-login / no-database red lines: the challenge is stateless and the token is not
  persisted.
- See decision log D16: in-memory rate limiting is a per-isolate fallback, not the primary control.
</content>
