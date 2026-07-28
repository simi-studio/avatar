import {
  AVATAR_EVALUATION_FIXTURE_VERSION,
  AVATAR_EVALUATION_SCENARIOS,
} from "@/lib/avatar-evaluation/fixtures";
import {
  EVALUATION_RUBRIC_DIMENSIONS,
  type CoverageGap,
  type EvaluationComparison,
  type EvaluationRubricDimension,
  type EvaluationRun,
  type EvaluationRunMetadata,
  type EvaluationScenario,
  type EvaluationSummary,
  type RegressionFinding,
} from "@/lib/avatar-evaluation/types";
import { PROVIDERS } from "@/lib/constants";

export const CRITICAL_SCORE_REGRESSION = -0.35;
export const SCORE_IMPROVEMENT = 0.35;
export const LATENCY_REGRESSION_RATIO = 0.25;
/**
 * A single fixture dropping this far on one dimension fails the gate on its
 * own. Aggregate means dilute a severe per-fixture failure below the mean
 * threshold, so identity/edit regressions need a paired floor as well.
 */
export const CRITICAL_FIXTURE_REGRESSION = -2;

const SENSITIVE_FIELD_PATTERN =
  /(api.?key|authorization|bearer|image(base64|bytes|url)?|prompt|brief|continuation|response.?id|secret|token|password)/i;

/** Key-like or payload-like values, checked against every string in a run. */
const SENSITIVE_VALUE_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/\bsk-[A-Za-z0-9_-]{16,}/, "an OpenAI-style key"],
  [/\bBearer\s+[A-Za-z0-9._-]{16,}/i, "an Authorization header"],
  [/\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, "a JWT"],
  [/^data:image\//i, "an inline image"],
  [/[A-Za-z0-9+/]{512,}={0,2}/, "a base64 payload"],
];

const MAX_SCAN_DEPTH = 12;

/**
 * Schema keys that are fixed enum names rather than free-form containers.
 * `promptAdherence` is a rubric dimension, not a stored prompt, so it must not
 * trip the sensitive-key pattern.
 */
const ALLOWED_SCHEMA_KEYS: ReadonlySet<string> = new Set<string>(
  EVALUATION_RUBRIC_DIMENSIONS,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Walk an entire run and reject sensitive keys or key-like values at any
 * depth. A shallow key scan would miss both a nested debug object and a key
 * pasted into a free-text label.
 */
function scanForSensitiveData(
  value: unknown,
  errors: string[],
  path: string,
  depth = 0,
): void {
  if (depth > MAX_SCAN_DEPTH) {
    errors.push(`${path}: nested too deeply to verify as privacy-safe.`);
    return;
  }
  if (typeof value === "string") {
    for (const [pattern, label] of SENSITIVE_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        errors.push(`${path}: value looks like ${label}; remove it.`);
        return;
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanForSensitiveData(item, errors, `${path}[${index}]`, depth + 1),
    );
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = path ? `${path}.${key}` : key;
    if (!ALLOWED_SCHEMA_KEYS.has(key) && SENSITIVE_FIELD_PATTERN.test(key)) {
      errors.push(`Sensitive field is forbidden: ${nestedPath}.`);
      continue;
    }
    scanForSensitiveData(nested, errors, nestedPath, depth + 1);
  }
}

function finiteOrNull(value: number | null): number | null {
  return value !== null && Number.isFinite(value) ? value : null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function validateFixtureSet(
  scenarios: readonly EvaluationScenario[] = AVATAR_EVALUATION_SCENARIOS,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (scenarios.length < 20 || scenarios.length > 30) {
    errors.push(`Expected 20–30 scenarios; received ${scenarios.length}.`);
  }

  for (const scenario of scenarios) {
    if (ids.has(scenario.id)) errors.push(`Duplicate fixture id: ${scenario.id}.`);
    ids.add(scenario.id);

    if (scenario.requiredDimensions.length === 0) {
      errors.push(`${scenario.id}: at least one rubric dimension is required.`);
    }

    const referenceIds = new Set<string>();
    for (const reference of scenario.references) {
      if (referenceIds.has(reference.id)) {
        errors.push(`${scenario.id}: duplicate reference id ${reference.id}.`);
      }
      referenceIds.add(reference.id);
      if (!reference.license.trim()) {
        errors.push(`${scenario.id}: reference ${reference.id} has no license.`);
      }
    }

    const hasMissingPath = scenario.references.some((reference) => !reference.path);
    if (scenario.liveEligible && hasMissingPath) {
      errors.push(`${scenario.id}: live fixture has a reference without a path.`);
    }
  }

  const bilingualPairs = new Map<string, Set<string>>();
  for (const scenario of scenarios) {
    if (!scenario.pairId) continue;
    const locales = bilingualPairs.get(scenario.pairId) ?? new Set<string>();
    locales.add(scenario.locale);
    bilingualPairs.set(scenario.pairId, locales);
  }
  for (const [pairId, locales] of bilingualPairs) {
    if (!locales.has("en") || !locales.has("zh-CN")) {
      errors.push(`${pairId}: bilingual pair must include en and zh-CN.`);
    }
  }

  return errors;
}

export type FixtureCoverage = {
  dimension: EvaluationRubricDimension;
  fixtureCount: number;
  liveEligibleFixtureCount: number;
};

/**
 * Report how many fixtures can actually exercise each rubric dimension. A
 * dimension carried only by fixtures without committed reference assets is
 * unreachable in a live run, and the fixture set cannot support a release
 * claim about it.
 */
export function describeFixtureCoverage(
  scenarios: readonly EvaluationScenario[] = AVATAR_EVALUATION_SCENARIOS,
): FixtureCoverage[] {
  return EVALUATION_RUBRIC_DIMENSIONS.map((dimension) => {
    const covering = scenarios.filter((scenario) =>
      scenario.requiredDimensions.includes(dimension),
    );
    return {
      dimension,
      fixtureCount: covering.length,
      liveEligibleFixtureCount: covering.filter((scenario) => scenario.liveEligible)
        .length,
    };
  });
}

/** Dimensions no live run can score, because every covering fixture is blocked. */
export function unreachableLiveDimensions(
  scenarios: readonly EvaluationScenario[] = AVATAR_EVALUATION_SCENARIOS,
): EvaluationRubricDimension[] {
  return describeFixtureCoverage(scenarios)
    .filter((item) => item.fixtureCount > 0 && item.liveEligibleFixtureCount === 0)
    .map((item) => item.dimension);
}

export function createEvaluationTemplate(
  metadata: Omit<EvaluationRunMetadata, "schemaVersion" | "fixtureVersion">,
  scenarios: readonly EvaluationScenario[] = AVATAR_EVALUATION_SCENARIOS,
): EvaluationRun {
  return {
    metadata: {
      schemaVersion: 1,
      fixtureVersion: AVATAR_EVALUATION_FIXTURE_VERSION,
      ...metadata,
    },
    results: scenarios.map((scenario) => ({
      fixtureId: scenario.id,
      normalizedIntent: scenario.expectedIntent,
      scores: Object.fromEntries(
        scenario.requiredDimensions.map((dimension) => [dimension, null]),
      ),
      latencyMs: null,
      callCount: null,
      estimatedCostUsd: null,
    })),
  };
}

export function validateEvaluationRun(
  value: unknown,
  scenarios: readonly EvaluationScenario[] = AVATAR_EVALUATION_SCENARIOS,
): string[] {
  const errors: string[] = [];
  if (!isRecord(value) || !isRecord(value.metadata) || !Array.isArray(value.results)) {
    return ["Evaluation run must contain metadata and a results array."];
  }

  const metadata = value.metadata;
  if (metadata.schemaVersion !== 1) errors.push("Unsupported schemaVersion.");
  if (metadata.fixtureVersion !== AVATAR_EVALUATION_FIXTURE_VERSION) {
    errors.push("Run fixtureVersion does not match the current fixture set.");
  }
  if (
    typeof metadata.provider !== "string" ||
    !(PROVIDERS as readonly string[]).includes(metadata.provider)
  ) {
    errors.push("Unknown provider.");
  }

  scanForSensitiveData(value, errors, "");

  const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const seen = new Set<string>();
  for (const rawResult of value.results) {
    if (!isRecord(rawResult) || typeof rawResult.fixtureId !== "string") {
      errors.push("Every result must have a fixtureId.");
      continue;
    }
    const fixtureId = rawResult.fixtureId;
    if (seen.has(fixtureId)) errors.push(`Duplicate result: ${fixtureId}.`);
    seen.add(fixtureId);
    const scenario = scenarioById.get(fixtureId);
    if (!scenario) {
      errors.push(`Unknown fixture result: ${fixtureId}.`);
      continue;
    }
    if (!isRecord(rawResult.scores)) {
      errors.push(`${fixtureId}: scores must be an object.`);
      continue;
    }
    if (!isRecord(rawResult.normalizedIntent)) {
      errors.push(`${fixtureId}: normalizedIntent must be an object.`);
    }
    for (const [dimension, score] of Object.entries(rawResult.scores)) {
      if (!(EVALUATION_RUBRIC_DIMENSIONS as readonly string[]).includes(dimension)) {
        errors.push(`${fixtureId}: unknown score dimension ${dimension}.`);
      } else if (
        score !== null &&
        (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 5)
      ) {
        errors.push(`${fixtureId}: ${dimension} must be null or an integer from 1 to 5.`);
      }
    }
    for (const dimension of scenario.requiredDimensions) {
      if (!(dimension in rawResult.scores)) {
        errors.push(`${fixtureId}: missing required score ${dimension}.`);
      }
    }
  }

  // A run covering only part of the fixture set produces means that are not
  // comparable to a full baseline, so treat missing fixtures as invalid rather
  // than letting an easy subset report a clean verdict.
  const missing = scenarios
    .filter((scenario) => !seen.has(scenario.id))
    .map((scenario) => scenario.id);
  if (missing.length > 0) {
    errors.push(
      `Run is missing ${missing.length} fixture result(s): ${missing.join(", ")}.`,
    );
  }

  return errors;
}

export function summarizeEvaluationRun(
  run: EvaluationRun,
  scenarios: readonly EvaluationScenario[] = AVATAR_EVALUATION_SCENARIOS,
): EvaluationSummary {
  const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const dimensions = EVALUATION_RUBRIC_DIMENSIONS.map((dimension) => {
    const values = run.results.flatMap((result) => {
      const score = result.scores[dimension];
      return typeof score === "number" ? [score] : [];
    });
    const average = mean(values);
    return {
      dimension,
      mean: average === null ? null : round(average),
      scoredCount: values.length,
    };
  });
  const fullyScoredCount = run.results.filter((result) => {
    const scenario = scenarioById.get(result.fixtureId);
    return scenario?.requiredDimensions.every(
      (dimension) => typeof result.scores[dimension] === "number",
    );
  }).length;
  const latencies = run.results.flatMap((result) =>
    typeof result.latencyMs === "number" ? [result.latencyMs] : [],
  );
  const callCounts = run.results.flatMap((result) =>
    typeof result.callCount === "number" ? [result.callCount] : [],
  );
  const costs = run.results.flatMap((result) =>
    typeof result.estimatedCostUsd === "number"
      ? [result.estimatedCostUsd]
      : [],
  );

  return {
    runId: run.metadata.runId,
    fixtureVersion: run.metadata.fixtureVersion,
    resultCount: run.results.length,
    fullyScoredCount,
    dimensions,
    meanLatencyMs: finiteOrNull(mean(latencies)),
    totalCalls:
      callCounts.length === 0
        ? null
        : callCounts.reduce((total, value) => total + value, 0),
    totalEstimatedCostUsd:
      costs.length === 0
        ? null
        : round(costs.reduce((total, value) => total + value, 0)),
  };
}

function dimensionMean(
  summary: EvaluationSummary,
  dimension: EvaluationRubricDimension,
): number | null {
  return summary.dimensions.find((item) => item.dimension === dimension)?.mean ?? null;
}

function assertComparable(baseline: EvaluationRun, candidate: EvaluationRun): void {
  if (baseline.metadata.fixtureVersion !== candidate.metadata.fixtureVersion) {
    throw new Error("Cannot compare runs from different fixture versions.");
  }
  const baselineIds = new Set(baseline.results.map((result) => result.fixtureId));
  const candidateIds = new Set(candidate.results.map((result) => result.fixtureId));
  const onlyBaseline = [...baselineIds].filter((id) => !candidateIds.has(id));
  const onlyCandidate = [...candidateIds].filter((id) => !baselineIds.has(id));
  if (onlyBaseline.length > 0 || onlyCandidate.length > 0) {
    throw new Error(
      "Cannot compare runs scored on different fixtures; means are only comparable across an identical fixture set. " +
        `Missing from candidate: ${onlyBaseline.join(", ") || "none"}. ` +
        `Missing from baseline: ${onlyCandidate.join(", ") || "none"}.`,
    );
  }
}

/**
 * Find dimensions the fixture set expects but the pair of runs did not score.
 * These cannot be compared, and an unscored dimension must not read as "no
 * regression found".
 */
function findCoverageGaps(
  baseline: EvaluationRun,
  candidate: EvaluationRun,
  scenarios: readonly EvaluationScenario[],
): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  for (const dimension of EVALUATION_RUBRIC_DIMENSIONS) {
    const expected = scenarios.filter((scenario) =>
      scenario.requiredDimensions.includes(dimension),
    );
    if (expected.length === 0) continue;
    const scoredIn = (run: EvaluationRun) =>
      run.results.filter(
        (result) => typeof result.scores[dimension] === "number",
      ).length;
    const scored = Math.min(scoredIn(baseline), scoredIn(candidate));
    if (scored < expected.length) {
      gaps.push({
        dimension,
        expectedFixtureCount: expected.length,
        scoredFixtureCount: scored,
      });
    }
  }
  return gaps;
}

/** Paired per-fixture deltas, which aggregate means would dilute away. */
function findFixtureRegressions(
  baseline: EvaluationRun,
  candidate: EvaluationRun,
): RegressionFinding[] {
  const findings: RegressionFinding[] = [];
  const baselineById = new Map(
    baseline.results.map((result) => [result.fixtureId, result]),
  );
  for (const candidateResult of candidate.results) {
    const baselineResult = baselineById.get(candidateResult.fixtureId);
    if (!baselineResult) continue;
    for (const dimension of EVALUATION_RUBRIC_DIMENSIONS) {
      const before = baselineResult.scores[dimension];
      const after = candidateResult.scores[dimension];
      if (typeof before !== "number" || typeof after !== "number") continue;
      const delta = after - before;
      if (delta <= CRITICAL_FIXTURE_REGRESSION) {
        findings.push({
          kind: "critical-regression",
          metric: dimension,
          fixtureId: candidateResult.fixtureId,
          baseline: before,
          candidate: after,
          delta,
        });
      }
    }
  }
  return findings;
}

export function compareEvaluationRuns(
  baseline: EvaluationRun,
  candidate: EvaluationRun,
  scenarios: readonly EvaluationScenario[] = AVATAR_EVALUATION_SCENARIOS,
): EvaluationComparison {
  assertComparable(baseline, candidate);
  const baselineSummary = summarizeEvaluationRun(baseline, scenarios);
  const candidateSummary = summarizeEvaluationRun(candidate, scenarios);
  const findings: RegressionFinding[] = [];

  for (const dimension of EVALUATION_RUBRIC_DIMENSIONS) {
    const before = dimensionMean(baselineSummary, dimension);
    const after = dimensionMean(candidateSummary, dimension);
    if (before === null || after === null) continue;
    const delta = round(after - before);
    if (delta <= CRITICAL_SCORE_REGRESSION) {
      findings.push({ kind: "critical-regression", metric: dimension, baseline: before, candidate: after, delta });
    } else if (delta >= SCORE_IMPROVEMENT) {
      findings.push({ kind: "improvement", metric: dimension, baseline: before, candidate: after, delta });
    }
  }

  findings.push(...findFixtureRegressions(baseline, candidate));

  if (
    baselineSummary.meanLatencyMs !== null &&
    candidateSummary.meanLatencyMs !== null &&
    baselineSummary.meanLatencyMs > 0
  ) {
    const ratio =
      (candidateSummary.meanLatencyMs - baselineSummary.meanLatencyMs) /
      baselineSummary.meanLatencyMs;
    if (Math.abs(ratio) >= LATENCY_REGRESSION_RATIO) {
      findings.push({
        kind: "operational-change",
        metric: "meanLatencyMs",
        baseline: baselineSummary.meanLatencyMs,
        candidate: candidateSummary.meanLatencyMs,
        delta: round(candidateSummary.meanLatencyMs - baselineSummary.meanLatencyMs),
      });
    }
  }

  const coverageGaps = findCoverageGaps(baseline, candidate, scenarios);

  return {
    baselineRunId: baseline.metadata.runId,
    candidateRunId: candidate.metadata.runId,
    findings,
    coverageGaps,
    // An unscored dimension cannot show a regression, so incomplete coverage
    // fails the gate rather than passing for lack of evidence.
    passesCriticalGate:
      coverageGaps.length === 0 &&
      !findings.some((finding) => finding.kind === "critical-regression"),
  };
}

export function renderEvaluationMarkdown(
  run: EvaluationRun,
  comparison?: EvaluationComparison,
): string {
  const summary = summarizeEvaluationRun(run);
  const lines = [
    `# Avatar evaluation — ${run.metadata.configurationLabel}`,
    "",
    `- Run: \`${run.metadata.runId}\``,
    `- Fixture version: \`${run.metadata.fixtureVersion}\``,
    `- Provider/model: ${run.metadata.provider} / ${run.metadata.model}${run.metadata.modelVersion ? ` (${run.metadata.modelVersion})` : ""}`,
    `- Capability verified: ${run.metadata.capabilityVerifiedAt}`,
    `- Fully scored: ${summary.fullyScoredCount}/${summary.resultCount}`,
    "",
    "## Rubric summary",
    "",
    "| Dimension | Mean (1–5) | Scored |",
    "| --------- | ---------- | ------ |",
    ...summary.dimensions.map(
      (item) => `| ${item.dimension} | ${item.mean ?? "—"} | ${item.scoredCount} |`,
    ),
    "",
    "## Operations",
    "",
    `- Mean latency: ${summary.meanLatencyMs === null ? "—" : `${Math.round(summary.meanLatencyMs)} ms`}`,
    `- Total calls: ${summary.totalCalls ?? "—"}`,
    `- Total estimated cost: ${summary.totalEstimatedCostUsd === null ? "—" : `$${summary.totalEstimatedCostUsd.toFixed(3)}`}`,
  ];

  if (comparison) {
    lines.push(
      "",
      "## Regression comparison",
      "",
      `Critical gate: **${comparison.passesCriticalGate ? "PASS" : "FAIL"}**`,
      "",
      "| Kind | Metric | Scope | Baseline | Candidate | Delta |",
      "| ---- | ------ | ----- | -------- | --------- | ----- |",
      ...(comparison.findings.length
        ? comparison.findings.map(
            (finding) =>
              `| ${finding.kind} | ${finding.metric} | ${finding.fixtureId ?? "all fixtures (mean)"} | ${finding.baseline} | ${finding.candidate} | ${finding.delta} |`,
          )
        : ["| — | No material changes | — | — | — | — |"]),
    );
    if (comparison.coverageGaps.length > 0) {
      lines.push(
        "",
        "### Coverage gaps",
        "",
        "These dimensions were not fully scored, so this comparison cannot clear them.",
        "",
        "| Dimension | Scored | Expected |",
        "| --------- | ------ | -------- |",
        ...comparison.coverageGaps.map(
          (gap) =>
            `| ${gap.dimension} | ${gap.scoredFixtureCount} | ${gap.expectedFixtureCount} |`,
        ),
      );
    }
  }

  lines.push(
    "",
    "> This fixture set informs release decisions; it does not prove universal demographic, cultural, or accessibility quality.",
    "",
  );
  return lines.join("\n");
}
