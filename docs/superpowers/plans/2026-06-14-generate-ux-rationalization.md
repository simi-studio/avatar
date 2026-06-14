# Generate UX Rationalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the generate flow truthful about provider capabilities, easier to complete, and clearer when generation partially succeeds or fails.

**Architecture:** Add a small provider-capabilities module shared by UI and tests, then update the generate form as focused UI behavior changes. Keep provider adapters under `lib/providers/` and preserve the existing `/api/generate` contract unless a task explicitly adds response metadata.

**Tech Stack:** Next.js App Router, React, TypeScript strict mode, Tailwind CSS, next-intl, Vitest, Testing Library.

---

## File Structure

- Modify `lib/providers/openai.ts`: remove the misleading OpenAI 512 mapping behavior after UI no longer offers it.
- Create `lib/provider-capabilities.ts`: source of truth for provider-supported sizes and generation-count labels.
- Modify `components/generation-form.tsx`: quick/advanced grouping, provider-aware size options, contextual preset visibility, retry plumbing, and preview source inputs.
- Modify `components/result-preview.tsx`: ready/source previews, retry action, and partial pair status display.
- Modify `i18n/en.json` and `i18n/zh-CN.json`: all new copy.
- Modify `__tests__/components/generation-form.test.tsx`: user-flow tests for the updated behavior.
- Modify `__tests__/lib/providers.test.ts` and add `__tests__/lib/provider-capabilities.test.ts`: provider size truth tests.
- Modify `docs/planning/plan.md`: record the new M8 implementation queue after code lands.

## Task 1: Provider-Aware Size Selector

**Files:**
- Create: `lib/provider-capabilities.ts`
- Test: `__tests__/lib/provider-capabilities.test.ts`
- Modify: `components/generation-form.tsx`
- Modify: `lib/providers/openai.ts`
- Modify: `__tests__/lib/providers.test.ts`

- [ ] Write failing tests proving OpenAI exposes only `1024x1024`, MiniMax exposes `512x512` and `1024x1024`, and switching from MiniMax `512x512` to OpenAI coerces the selected size to `1024x1024`.
- [ ] Run `npm run test -- __tests__/lib/provider-capabilities.test.ts __tests__/components/generation-form.test.tsx __tests__/lib/providers.test.ts` and verify the new tests fail for missing behavior.
- [ ] Implement `PROVIDER_CAPABILITIES`, `sizesForProvider(provider)`, and `defaultSizeForProvider(provider)` in `lib/provider-capabilities.ts`.
- [ ] Update the size selector to render only the current provider's supported sizes and coerce invalid current selections in a `useEffect`.
- [ ] Update `mapOpenAISize` to accept only `1024x1024` and adjust provider tests.
- [ ] Run targeted tests, then `npm run lint`, `npm run typecheck`, and `npm run test`.
- [ ] Commit as `feat(provider): expose truthful size capabilities`.

## Task 2: Quick And Advanced Generate Flow

**Files:**
- Modify: `components/generation-form.tsx`
- Modify: `components/intent-controls.tsx`
- Modify: `i18n/en.json`
- Modify: `i18n/zh-CN.json`
- Test: `__tests__/components/generation-form.test.tsx`

- [ ] Write failing tests proving advanced controls are hidden by default, can be expanded, and still affect the submitted intent.
- [ ] Run `npm run test -- __tests__/components/generation-form.test.tsx` and verify the tests fail for currently visible controls.
- [ ] Add an advanced settings toggle in `GenerationForm` around `IntentControls`, size, and advanced text fields while keeping required quick controls visible.
- [ ] Keep the primary description/prompt and style/theme controls outside the advanced block so first-time generation remains short.
- [ ] Run targeted component tests, then lint/typecheck/test.
- [ ] Commit as `feat(generate): split quick and advanced settings`.

## Task 3: Preview Workspace And Error Recovery

**Files:**
- Modify: `components/result-preview.tsx`
- Modify: `components/generation-form.tsx`
- Modify: `i18n/en.json`
- Modify: `i18n/zh-CN.json`
- Test: `__tests__/components/generation-form.test.tsx`

- [ ] Write failing tests proving uploaded source previews appear in the preview panel before generation and a failed generation displays a retry button.
- [ ] Run `npm run test -- __tests__/components/generation-form.test.tsx` and verify the tests fail for missing preview/retry behavior.
- [ ] Pass uploaded image previews and readiness state from `GenerationForm` to `ResultPreview`.
- [ ] Render idle, ready, generating, success, and error states distinctly in `ResultPreview`.
- [ ] Add retry action that reruns the last attempted intent without forcing the user to re-enter inputs.
- [ ] Run targeted component tests, then lint/typecheck/test.
- [ ] Commit as `feat(generate): improve preview and retry states`.

## Task 4: Couple Partial Result Handling

**Files:**
- Modify: `components/result-preview.tsx`
- Modify: `i18n/en.json`
- Modify: `i18n/zh-CN.json`
- Test: `__tests__/components/generation-form.test.tsx`

- [ ] Write failing tests proving a one-image A/B result shows a partial pair notice and labels the missing paired item.
- [ ] Run `npm run test -- __tests__/components/generation-form.test.tsx` and verify the tests fail for missing partial-pair UI.
- [ ] Detect expected pair modes from the current mode and render success cards for returned labels plus a missing-item placeholder.
- [ ] Keep download actions only on images that exist.
- [ ] Run targeted component tests, then lint/typecheck/test.
- [ ] Commit as `feat(generate): clarify partial couple results`.

## Task 5: Contextual Team Presets And Cost Copy

**Files:**
- Modify: `components/generation-form.tsx`
- Modify: `i18n/en.json`
- Modify: `i18n/zh-CN.json`
- Test: `__tests__/components/generation-form.test.tsx`

- [ ] Write failing tests proving the team preset button is hidden in default text mode, appears for themed/team/couple contexts, and cost copy reflects one generation versus two generations.
- [ ] Run `npm run test -- __tests__/components/generation-form.test.tsx` and verify the tests fail for current always-visible preset behavior.
- [ ] Show `TeamPresetShare` only for `themed`, couple modes, or `team-character` goal.
- [ ] Replace the single couple-only cost note with provider/mode-aware cost copy near the Generate button.
- [ ] Run targeted component tests, then lint/typecheck/test.
- [ ] Commit as `feat(generate): contextualize presets and cost cues`.

## Task 6: Planning Snapshot

**Files:**
- Modify: `docs/planning/plan.md`

- [ ] Add an M8 snapshot listing the UX rationalization work that shipped.
- [ ] Run `npm run guard:secrets` and `git diff --check`.
- [ ] Commit as `docs(planning): record generate ux rationalization`.

## Final Gate

- [ ] Run `npm run guard:secrets`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Report every commit hash and any remaining risks.
