# Epic 9.3 — Engineering Health & Confidence

> Upstream: [plan.md](../plan.md) (Recommended next implementation queue) / [prd.md](../../prd.md) (§15) / [security.md](../../security.md)

| Field | Value |
| ----- | ----- |
| Milestone | M9 (candidate) |
| Status | Draft |
| Depends on | M5 (CI, deploy), existing unit suite |

## Goal

Make the already-shipped feature set more trustworthy and cheaper to maintain. No new product
surface — these are the items from the plan's "Recommended next implementation queue" plus the
test gap that single-page complexity has opened.

## Checklist

### E2E browser smoke tests
- [ ] Choose a runner (Playwright recommended) wired into CI as a separate job
- [ ] Cover: home → generate, locale switch, source/mode changes, team preset hydration,
      invalid-key error display — all with **mocked** generation (no real provider calls, no keys)
- [ ] Ensure mocks assert no API key is ever sent to a real upstream

### Lint migration (before Next.js 16)
- [ ] Replace deprecated `next lint` with the ESLint CLI flow
- [ ] Keep `npm run lint` contract stable so Makefile/CI are unaffected

### Release checklist + rollback
- [ ] Document the repeatable flow: local gate → deploy → smoke check → rollback
- [ ] Note how to verify the live demo (`avatar.simi.studio`) returns 200 post-deploy

### Production observability notes
- [ ] Document how maintainers read Cloudflare logs **without** exposing keys, prompts, or images
- [ ] Cross-check against `lib/redaction.ts` and the CI secret guard

## Acceptance

- CI runs unit + E2E smoke green; E2E proves no key leaves the browser to a real host.
- `npm run lint` passes on the ESLint CLI flow with no `next lint` deprecation warning.
- A maintainer can follow the release checklist to deploy and roll back unaided.
- Observability notes reviewed against `security.md`; no logging path can surface secrets.

## Notes

- Lowest product risk, highest "sleep at night" value. Good candidate to interleave with 9.1/9.2
  rather than block on it.
