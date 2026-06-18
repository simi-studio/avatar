# Release Runbook

> The repeatable flow for shipping Simi Avatar: local gate → deploy → smoke check
> → rollback, plus how to read production logs without exposing secrets. Deploy
> mechanics live in [cloudflare-deploy.md](./cloudflare-deploy.md); the trust model
> lives in [security.md](./security.md).

## 1. Local gate (before every release)

Run the full quality gate and stop on the first failure:

```bash
make check     # guard:secrets + lint + typecheck + test + build
```

`make check` is the same gate CI runs. Do not tag or deploy on a red gate.

For browser-level confidence, run the E2E smoke suite (auto-starts a dev server and
mocks generation, so no key is needed):

```bash
make e2e        # or: npm run test:e2e
```

| Step           | Command               | Must show                          |
| -------------- | --------------------- | ---------------------------------- |
| Secret guard   | `npm run guard:secrets` | `Secret-logging guard passed.`     |
| Lint           | `npm run lint`        | no errors (ESLint CLI, flat config) |
| Types          | `npm run typecheck`   | no errors                          |
| Unit tests     | `npm run test`        | all green                          |
| Build          | `npm run build`       | OpenNext build succeeds            |

## 2. Deploy

```bash
npm run deploy        # *.workers.dev (forks, staging)
# or
npm run deploy:prod   # custom domain via gitignored wrangler.prod.jsonc
```

See [cloudflare-deploy.md](./cloudflare-deploy.md) for first-time auth, env vars,
and custom-domain setup.

## 3. Smoke check (after every deploy)

Confirm the live URL is healthy:

```bash
curl -sI https://<your-domain>/zh-CN | head -1   # expect HTTP/2 200
```

Then walk the functional post-deploy checklist in
[cloudflare-deploy.md](./cloudflare-deploy.md#post-deploy-checklist): home + generate
load, locale switch, one real generation per provider, team preset hydration on a
second browser, and **no key/image in logs**.

## 4. Rollback (if the smoke check fails)

```bash
npx wrangler deployments list
npx wrangler rollback --message "reason"
```

Rolling back is preferred over hot-fixing forward when a release is visibly broken.
After rollback, reproduce locally, fix, and re-run from step 1.

## Production observability (without leaking secrets)

The app never logs keys, prompts, or images, and [`lib/redaction.ts`](../lib/redaction.ts)
masks anything key-like as defense-in-depth. Keep that guarantee when investigating
production:

- **Tail live logs** with `npx wrangler tail`. Requests show method, path, status,
  and timing — not request bodies. Do **not** add logging that prints `FormData`,
  the `apiKey` field, the compiled prompt, uploaded image bytes, or full upstream
  error bodies.
- **Surface errors by code, not content.** The API returns normalized
  [error codes](./prd.md#112-error-codes); diagnose from the code plus status, not
  by echoing upstream payloads (which can contain prompt or key fragments).
- **If you must add a log line**, route any free-form upstream text through
  `redactText()` first, and confirm `npm run guard:secrets` still passes — the CI
  guard ([scripts/check-no-secret-logs.mjs](../scripts/check-no-secret-logs.mjs))
  fails the build on risky logging patterns.
- **Metrics over payloads.** Prefer counts (success/failure by error code, latency)
  to request contents. There is no database in MVP, so nothing is persisted server-side
  by design — keep it that way.

See [security.md](./security.md) for the full hard constraints and acceptance checklist.
