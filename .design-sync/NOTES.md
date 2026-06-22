# design-sync notes — Simi Avatar UI

Repo-specific gotchas for syncing this design system to claude.ai/design.
Project: **Simi Avatar Design System** — `5ef23fd5-ad12-4c87-9dea-3ac9d7f7a771`.

## What this DS is

- This repo is a **Next.js app**, not a published component library — there is **no `dist/`**.
  The design system is the **Shadcn UI primitives in `components/ui/`** only (9 exports:
  Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Select, Textarea).
- `srcDir: components/ui` keeps discovery off `lib/` (which would be the default source
  root since there is no `src/` and `lib/` sorts first — it holds app/business logic).
- `node_modules/simi-avatar` does not exist (a package is never self-installed), so the
  converter is anchored via **`cfg.entry: .design-sync/ds-entry.ts`** — a hand-written
  re-export barrel. Its parent dir walk lands `PKG_DIR` on the repo root. Because `entry`
  is set, synth-discovery is off, so **`componentSrcMap` pins all 9 components explicitly**.
  If a new primitive is added to `components/ui/`, add it to BOTH `ds-entry.ts` and
  `componentSrcMap`.

## CSS — compiled, not shipped (IMPORTANT for re-sync)

- The repo's `app/globals.css` uses uncompiled `@tailwind` directives, so it can't be the
  `cssEntry`. Instead `cfg.cssEntry: .design-sync/compiled.css` is a **generated** static
  stylesheet (gitignored). **Regenerate it before every build:**
  ```sh
  node_modules/.bin/tailwindcss -c .design-sync/tailwind.compile.cjs -i app/globals.css -o .design-sync/compiled.css
  ```
  `tailwind.compile.cjs` mirrors the repo's `tailwind.config.ts` theme and adds
  `.design-sync/previews/**` to the content scan.
- The shipped `_ds_bundle.css` is therefore a **compiled SUBSET of Tailwind** — only the
  utility classes the components (and previews) actually use are present. Arbitrary
  utilities like `bg-muted`/`p-8`/`gap-4` are NOT in it. This is documented for the design
  agent in `conventions.md` (the `readmeHeader`).
- Tokens (`--primary`, `--card`, … + `.dark` overrides) come from the `:root`/`.dark`
  blocks in `app/globals.css`, carried through into `compiled.css`.

## Previews

- Authored previews use **inline `style` for layout glue**, not Tailwind utilities — so
  `compiled.css` only ever needs the component classes, and previews stay robust if the
  content scan misses a layout class. Keep new previews to this convention.
- Card subcomponents (CardHeader/Title/Content) are previewed **inside a full Card** —
  that's the only composition where their spacing reads true.
- Content is drawn from the app's own domain (providers OpenAI/MiniMax, modes
  single/couple/themed, API-key/prompt fields).

## Misc

- `guidelinesGlob: []` — the default glob would ship `docs/*.md` (prd, architecture,
  providers…) as "design guidelines", which would mislead the design agent. Shipped none.
- Render check: 9/9 clean. One token referenced-but-undefined (below threshold,
  non-blocking) — no action.

## Known render warns

(none)

## Build / validate / re-sync commands

```sh
# 0. regenerate the compiled stylesheet (cfg.cssEntry) — required every time
node_modules/.bin/tailwindcss -c .design-sync/tailwind.compile.cjs -i app/globals.css -o .design-sync/compiled.css
# 1. re-stage scripts (instant) + ensure deps once: (cd .ds-sync && npm i esbuild ts-morph @types/react)
# 2. first sync / full build:
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules "$PWD/node_modules" --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
# 3. driver (re-sync): fetch _ds_sync.json -> .design-sync/.cache/remote-sync.json, then
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules "$PWD/node_modules" --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```

## Re-sync risks (watch-list)

- **`compiled.css` is gitignored and regenerated.** On a fresh clone it won't exist; the
  build's `cssEntry` will be missing. Always run the tailwind compile (step 0) first.
- **Manual entry + componentSrcMap.** New `components/ui/` primitives are invisible to the
  sync until added to `ds-entry.ts` AND `componentSrcMap` — there's no automatic discovery
  (because `cfg.entry` is set).
- **Token drift.** Editing the `:root`/`.dark` token values in `app/globals.css` only
  reaches the bundle after recompiling `compiled.css`. The conventions header enumerates
  token names — if a token is renamed/removed, re-validate the header against the build.
- **Tailwind major bump.** `tailwind.compile.cjs` is a v3-style config; a Tailwind v4 bump
  in the repo would need it rewritten.
- Verdict/grades carry forward via the uploaded `_ds_sync.json`; grades are gitignored
  (`.cache/`). Authored previews + config are the durable inputs in git.
