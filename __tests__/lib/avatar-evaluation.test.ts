import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

import {
  AVATAR_EVALUATION_FIXTURE_VERSION,
  AVATAR_EVALUATION_SCENARIOS,
} from "@/lib/avatar-evaluation/fixtures";
import {
  compareEvaluationRuns,
  createEvaluationTemplate,
  describeFixtureCoverage,
  renderEvaluationMarkdown,
  summarizeEvaluationRun,
  unreachableLiveDimensions,
  validateEvaluationRun,
  validateFixtureSet,
} from "@/lib/avatar-evaluation/harness";
import {
  renderSmallSizeReviewSheet,
  SMALL_SIZE_REVIEW_PIXELS,
} from "@/lib/avatar-evaluation/review-sheet";
import type {
  EvaluationRun,
  EvaluationScore,
} from "@/lib/avatar-evaluation/types";

function scoredRun(runId: string, score: EvaluationScore): EvaluationRun {
  const run = createEvaluationTemplate({
    runId,
    createdAt: "2026-07-12T00:00:00.000Z",
    provider: "openai",
    model: "gpt-image-2",
    modelVersion: "gpt-image-2-2026-04-21",
    capabilityVerifiedAt: "2026-07-12",
    configurationLabel: runId,
  });
  return {
    ...run,
    results: run.results.map((result) => ({
      ...result,
      scores: Object.fromEntries(
        Object.keys(result.scores).map((dimension) => [dimension, score]),
      ),
      latencyMs: 1_000,
      callCount: 1,
      estimatedCostUsd: 0.01,
    })),
  };
}

describe("avatar evaluation fixtures", () => {
  it("contains a valid versioned 20–30 scenario matrix", () => {
    expect(validateFixtureSet()).toEqual([]);
    expect(AVATAR_EVALUATION_SCENARIOS).toHaveLength(25);
    expect(AVATAR_EVALUATION_FIXTURE_VERSION).toBe("1.1.0");
  });

  it("covers the required modes, categories, languages, and reference shapes", () => {
    const modes = new Set(AVATAR_EVALUATION_SCENARIOS.map((item) => item.mode));
    const categories = new Set(
      AVATAR_EVALUATION_SCENARIOS.map((item) => item.category),
    );
    const locales = new Set(
      AVATAR_EVALUATION_SCENARIOS.map((item) => item.locale),
    );
    expect(modes).toEqual(
      new Set(["text", "single", "couple", "couple-text", "themed"]),
    );
    expect(categories).toEqual(
      new Set([
        "professional",
        "social",
        "realistic",
        "stylized",
        "themed",
        "couple",
        "edit",
      ]),
    );
    expect(locales).toEqual(new Set(["en", "zh-CN"]));
    expect(
      AVATAR_EVALUATION_SCENARIOS.some((item) => item.references.length > 1),
    ).toBe(true);
    const editScenarios = AVATAR_EVALUATION_SCENARIOS.filter(
      (item) => item.category === "edit",
    );
    expect(editScenarios.length).toBeGreaterThan(0);
    expect(
      editScenarios.every(
        (item) =>
          (item.change?.length ?? 0) > 0 && (item.preserve?.length ?? 0) > 0,
      ),
    ).toBe(true);
    const referenceCountGroup = AVATAR_EVALUATION_SCENARIOS.filter(
      (item) => item.comparisonGroup === "photo-reference-count",
    );
    expect(referenceCountGroup).toHaveLength(2);
    expect(new Set(referenceCountGroup.map((item) => item.brief)).size).toBe(1);
    expect(referenceCountGroup.map((item) => item.references.length)).toEqual([
      1, 2,
    ]);
  });

  it("blocks specification-only references from live generation", () => {
    const source = AVATAR_EVALUATION_SCENARIOS.find(
      (scenario) => scenario.references.length > 0,
    )!;
    const invalid = {
      ...source,
      liveEligible: true,
      references: source.references.map((reference) => ({
        ...reference,
        path: undefined,
      })),
    };
    expect(validateFixtureSet([invalid])).toEqual(
      expect.arrayContaining([
        expect.stringContaining("live fixture has a reference without a path"),
      ]),
    );
  });

  it("rejects comparison variants that change the task as well as the factor", () => {
    const variants = AVATAR_EVALUATION_SCENARIOS.filter(
      (scenario) => scenario.comparisonGroup === "photo-reference-count",
    );
    const changedTask = [
      variants[0]!,
      { ...variants[1]!, brief: "A different portrait task" },
    ];
    expect(validateFixtureSet(changedTask)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "variants must share locale, category, mode, brief, intent",
        ),
      ]),
    );
  });

  it("keeps every declared reference inside the reviewed fixture directory", () => {
    const references = AVATAR_EVALUATION_SCENARIOS.flatMap(
      (scenario) => scenario.references,
    );
    for (const reference of references) {
      expect(reference.path).toMatch(
        /^fixtures\/avatar-evaluation\/references\/[a-z0-9-]+\.jpg$/,
      );
      expect(existsSync(reference.path!)).toBe(true);
    }
  });
});

describe("avatar evaluation harness", () => {
  it("creates a privacy-safe blank template", () => {
    const run = createEvaluationTemplate({
      runId: "baseline",
      createdAt: "2026-07-12T00:00:00.000Z",
      provider: "openai",
      model: "gpt-image-2",
      capabilityVerifiedAt: "2026-07-12",
      configurationLabel: "Configuration A",
    });
    expect(run.results).toHaveLength(25);
    expect(validateEvaluationRun(run)).toEqual([]);
    expect(JSON.stringify(run)).not.toContain("Approachable startup founder");
    expect(JSON.stringify(run)).not.toMatch(/apiKey|base64|continuation/i);
  });

  it("rejects secret/image-like fields and invalid scores", () => {
    const run = scoredRun("unsafe", 4) as EvaluationRun & {
      metadata: EvaluationRun["metadata"] & { apiKey?: string };
    };
    run.metadata.apiKey = "not-a-real-key";
    run.results[0]!.scores.promptAdherence = 6 as EvaluationScore;
    expect(validateEvaluationRun(run)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Sensitive field is forbidden: metadata.apiKey"),
        expect.stringContaining("must be null or an integer"),
      ]),
    );
  });

  it("rejects a sensitive field nested at any depth", () => {
    const run = scoredRun("nested", 4) as EvaluationRun & {
      metadata: EvaluationRun["metadata"] & { debug?: unknown };
    };
    run.metadata.debug = { session: { apiKey: "nested-not-a-real-key" } };
    expect(validateEvaluationRun(run)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("metadata.debug.session.apiKey"),
      ]),
    );
  });

  it("rejects a key-like value pasted into a free-text field", () => {
    const run = scoredRun("leaky", 4);
    run.metadata.configurationLabel = "sk-abcdefghijklmnopqrstuvwxyz012345";
    expect(validateEvaluationRun(run)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("metadata.configurationLabel"),
      ]),
    );
  });

  it("keeps rubric dimension names out of the sensitive-key pattern", () => {
    expect(validateEvaluationRun(scoredRun("clean", 4))).toEqual([]);
  });

  it("rejects a run that scores only a subset of the fixture set", () => {
    const run = scoredRun("partial", 5);
    run.results = run.results.slice(0, 1);
    expect(validateEvaluationRun(run)).toEqual(
      expect.arrayContaining([expect.stringContaining("missing 24 fixture result(s)")]),
    );
  });

  it("summarizes scored dimensions and operational metadata", () => {
    const summary = summarizeEvaluationRun(scoredRun("summary", 4));
    expect(summary.fullyScoredCount).toBe(25);
    expect(summary.totalCalls).toBe(25);
    expect(summary.totalEstimatedCostUsd).toBe(0.25);
    expect(
      summary.dimensions.find((item) => item.dimension === "promptAdherence")
        ?.mean,
    ).toBe(4);
  });

  it("fails the critical gate on a material quality regression", () => {
    const comparison = compareEvaluationRuns(
      scoredRun("baseline", 4),
      scoredRun("candidate", 3),
    );
    expect(comparison.passesCriticalGate).toBe(false);
    expect(comparison.findings).toContainEqual(
      expect.objectContaining({
        kind: "critical-regression",
        metric: "likeness",
        delta: -1,
      }),
    );
  });

  it("fails the gate on a single fixture collapsing, which the mean would dilute", () => {
    const baseline = scoredRun("baseline", 5);
    const candidate = scoredRun("candidate", 5);
    candidate.results[0]!.scores.promptAdherence = 1;
    const comparison = compareEvaluationRuns(baseline, candidate);
    expect(comparison.passesCriticalGate).toBe(false);
    expect(comparison.findings).toContainEqual(
      expect.objectContaining({
        kind: "critical-regression",
        metric: "promptAdherence",
        fixtureId: candidate.results[0]!.fixtureId,
        delta: -4,
      }),
    );
  });

  it("refuses to compare runs scored on different fixtures", () => {
    const baseline = scoredRun("baseline", 5);
    const candidate = scoredRun("candidate", 5);
    candidate.results = candidate.results.slice(0, 1);
    expect(() => compareEvaluationRuns(baseline, candidate)).toThrow(
      /different fixtures/,
    );
  });

  it("fails the gate when a rubric dimension was never scored", () => {
    const blank = (runId: string): EvaluationRun => {
      const run = scoredRun(runId, 5);
      return {
        ...run,
        results: run.results.map((result) => ({
          ...result,
          scores: Object.fromEntries(
            Object.entries(result.scores).map(([dimension, score]) => [
              dimension,
              dimension === "likeness" ? null : score,
            ]),
          ),
        })),
      };
    };
    const comparison = compareEvaluationRuns(blank("baseline"), blank("candidate"));
    expect(comparison.passesCriticalGate).toBe(false);
    expect(comparison.coverageGaps).toContainEqual(
      expect.objectContaining({ dimension: "likeness", scoredFixtureCount: 0 }),
    );
  });

  it("reports the dimensions no live-eligible fixture can reach", () => {
    expect(unreachableLiveDimensions()).toEqual([]);
    expect(
      describeFixtureCoverage().find((item) => item.dimension === "likeness"),
    ).toEqual({ dimension: "likeness", fixtureCount: 9, liveEligibleFixtureCount: 7 });
  });

  it("renders a concise Markdown report with the evidence limit", () => {
    const run = scoredRun("report", 5);
    const markdown = renderEvaluationMarkdown(run);
    expect(markdown).toContain("# Avatar evaluation");
    expect(markdown).toContain("| promptAdherence | 5 |");
    expect(markdown).toContain("does not prove universal demographic");
    expect(markdown).not.toContain("Approachable startup founder");
  });

  it("renders deterministic 48px and 32px review previews", () => {
    const html = renderSmallSizeReviewSheet("test-run", [
      { fixtureId: "professional-founder-en", outputs: ["avatar.png"] },
    ]);
    expect(SMALL_SIZE_REVIEW_PIXELS).toEqual([48, 32]);
    expect(html).toContain('width="48" height="48"');
    expect(html).toContain('width="32" height="32"');
    expect(html).toContain('src="avatar.png"');
    expect(html).not.toContain("http");
  });
});
