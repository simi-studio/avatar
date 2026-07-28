import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  compareEvaluationRuns,
  createEvaluationTemplate,
  describeFixtureCoverage,
  renderEvaluationMarkdown,
  unreachableLiveDimensions,
  validateEvaluationRun,
  validateFixtureSet,
} from "../lib/avatar-evaluation/harness";
import {
  AVATAR_EVALUATION_FIXTURE_VERSION,
  AVATAR_EVALUATION_SCENARIOS,
} from "../lib/avatar-evaluation/fixtures";
import type { EvaluationRun } from "../lib/avatar-evaluation/types";
import { PROVIDERS, type ProviderId } from "../lib/constants";

const OUTPUT_DIR = "avatar-eval-results";

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function required(args: string[], name: string): string {
  const value = valueAfter(args, name);
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function readRun(file: string): Promise<EvaluationRun> {
  const value = JSON.parse(await readFile(file, "utf8")) as unknown;
  const errors = validateEvaluationRun(value);
  if (errors.length > 0) throw new Error(errors.join("\n"));
  return value as EvaluationRun;
}

async function writeArtifacts(
  filename: string,
  run: EvaluationRun,
  markdown: string,
): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, `${filename}.json`), `${JSON.stringify(run, null, 2)}\n`);
  await writeFile(path.join(OUTPUT_DIR, `${filename}.md`), markdown);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? "validate";

  if (command === "validate") {
    const errors = validateFixtureSet();
    if (errors.length > 0) throw new Error(errors.join("\n"));
    const categories = new Set(
      AVATAR_EVALUATION_SCENARIOS.map((scenario) => scenario.category),
    );
    const locales = new Set(
      AVATAR_EVALUATION_SCENARIOS.map((scenario) => scenario.locale),
    );
    process.stdout.write(
      `Avatar fixtures ${AVATAR_EVALUATION_FIXTURE_VERSION}: ${AVATAR_EVALUATION_SCENARIOS.length} scenarios, ${categories.size} categories, locales ${[...locales].join("/")}.\n`,
    );
    for (const item of describeFixtureCoverage()) {
      process.stdout.write(
        `  ${item.dimension}: ${item.fixtureCount} fixture(s), ${item.liveEligibleFixtureCount} live-eligible\n`,
      );
    }
    const unreachable = unreachableLiveDimensions();
    if (unreachable.length > 0) {
      process.stdout.write(
        `\nCoverage gap: ${unreachable.join(", ")} have no live-eligible fixture. Add reviewed reference assets before making a release claim about them.\n`,
      );
    }
    return;
  }

  if (command === "template") {
    const provider = required(args, "--provider");
    if (!(PROVIDERS as readonly string[]).includes(provider)) {
      throw new Error(`Unknown provider: ${provider}.`);
    }
    const runId = required(args, "--run-id");
    const run = createEvaluationTemplate({
      runId,
      createdAt: new Date().toISOString(),
      provider: provider as ProviderId,
      model: required(args, "--model"),
      modelVersion: valueAfter(args, "--model-version"),
      capabilityVerifiedAt: required(args, "--verified-at"),
      configurationLabel: required(args, "--label"),
    });
    await writeArtifacts(runId, run, renderEvaluationMarkdown(run));
    process.stdout.write(`Wrote ${OUTPUT_DIR}/${runId}.{json,md}.\n`);
    return;
  }

  if (command === "report") {
    const run = await readRun(required(args, "--run"));
    await writeArtifacts(run.metadata.runId, run, renderEvaluationMarkdown(run));
    process.stdout.write(`Validated and reported ${run.metadata.runId}.\n`);
    return;
  }

  if (command === "compare") {
    const baseline = await readRun(required(args, "--baseline"));
    const candidate = await readRun(required(args, "--candidate"));
    const comparison = compareEvaluationRuns(baseline, candidate);
    const filename = `${candidate.metadata.runId}-vs-${baseline.metadata.runId}`;
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(
      path.join(OUTPUT_DIR, `${filename}.json`),
      `${JSON.stringify(comparison, null, 2)}\n`,
    );
    await writeFile(
      path.join(OUTPUT_DIR, `${filename}.md`),
      renderEvaluationMarkdown(candidate, comparison),
    );
    process.stdout.write(
      `Comparison ${comparison.passesCriticalGate ? "PASS" : "FAIL"}: ${OUTPUT_DIR}/${filename}.{json,md}.\n`,
    );
    if (!comparison.passesCriticalGate) process.exitCode = 2;
    return;
  }

  throw new Error(
    "Usage: avatar-eval <validate|template|report|compare> [options]",
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Evaluation failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
