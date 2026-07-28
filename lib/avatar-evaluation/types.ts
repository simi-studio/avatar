import type { AvatarIntent } from "@/lib/avatar-intent";
import type { GenerationMode, ProviderId } from "@/lib/constants";

export const EVALUATION_RUBRIC_DIMENSIONS = [
  "likeness",
  "promptAdherence",
  "editPreservation",
  "smallSizeReadability",
  "coupleIdentitySeparation",
  "visualIntegrity",
] as const;

export type EvaluationRubricDimension =
  (typeof EVALUATION_RUBRIC_DIMENSIONS)[number];

export type EvaluationScore = 1 | 2 | 3 | 4 | 5;

export type EvaluationReference = {
  id: string;
  person: "A" | "B";
  role: "front" | "profile" | "expression";
  provenance: "synthetic" | "consented" | "redistributable";
  license: string;
  /** Repo-relative path. Omitted for a specification-only fixture. */
  path?: string;
};

export type EvaluationScenario = {
  id: string;
  pairId?: string;
  locale: "en" | "zh-CN";
  category:
    | "professional"
    | "social"
    | "realistic"
    | "stylized"
    | "themed"
    | "couple"
    | "edit";
  mode: GenerationMode;
  brief: string;
  expectedIntent: Pick<
    AvatarIntent,
    "goal" | "composition" | "background" | "likeness" | "creativity"
  > &
    Partial<Pick<AvatarIntent, "styleId" | "themeId" | "variantId">>;
  references: EvaluationReference[];
  requiredDimensions: EvaluationRubricDimension[];
  change?: string[];
  preserve?: string[];
  /** Live generation is blocked until every required reference has a committed path. */
  liveEligible: boolean;
};

export type EvaluationRunMetadata = {
  schemaVersion: 1;
  runId: string;
  createdAt: string;
  fixtureVersion: string;
  provider: ProviderId;
  model: string;
  modelVersion?: string;
  capabilityVerifiedAt: string;
  configurationLabel: string;
};

export type EvaluationResult = {
  fixtureId: string;
  /** Non-sensitive structured intent snapshot; never includes the free-text brief. */
  normalizedIntent: EvaluationScenario["expectedIntent"];
  scores: Partial<
    Record<EvaluationRubricDimension, EvaluationScore | null>
  >;
  latencyMs: number | null;
  callCount: number | null;
  estimatedCostUsd: number | null;
};

export type EvaluationRun = {
  metadata: EvaluationRunMetadata;
  results: EvaluationResult[];
};

export type DimensionSummary = {
  dimension: EvaluationRubricDimension;
  mean: number | null;
  scoredCount: number;
};

export type EvaluationSummary = {
  runId: string;
  fixtureVersion: string;
  resultCount: number;
  fullyScoredCount: number;
  dimensions: DimensionSummary[];
  meanLatencyMs: number | null;
  totalCalls: number | null;
  totalEstimatedCostUsd: number | null;
};

export type RegressionFinding = {
  kind: "critical-regression" | "improvement" | "operational-change";
  metric: string;
  /** Set when the finding is a paired per-fixture delta rather than an aggregate mean. */
  fixtureId?: string;
  baseline: number;
  candidate: number;
  delta: number;
};

/**
 * A rubric dimension a run was expected to score but did not. Unscored
 * dimensions must fail the gate: a dimension with no data cannot show a
 * regression, so silently skipping it would report a false pass.
 */
export type CoverageGap = {
  dimension: EvaluationRubricDimension;
  expectedFixtureCount: number;
  scoredFixtureCount: number;
};

export type EvaluationComparison = {
  baselineRunId: string;
  candidateRunId: string;
  findings: RegressionFinding[];
  coverageGaps: CoverageGap[];
  passesCriticalGate: boolean;
};
