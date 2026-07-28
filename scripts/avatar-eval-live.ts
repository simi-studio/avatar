import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createAvatarIntent } from "../lib/avatar-intent";
import { AVATAR_EVALUATION_SCENARIOS } from "../lib/avatar-evaluation/fixtures";
import { unreachableLiveDimensions } from "../lib/avatar-evaluation/harness";
import { compileAvatarPrompt } from "../lib/prompt-compiler";
import { modelLabelForProvider } from "../lib/provider-capabilities";
import { getProvider } from "../lib/providers";
import { getStyleById } from "../styles/avatar-styles";
import { getThemeById, getVariant } from "../styles/avatar-themes";
import type { EvaluationReference } from "../lib/avatar-evaluation/types";
import { renderSmallSizeReviewSheet } from "../lib/avatar-evaluation/review-sheet";
import {
  PROVIDERS,
  type MiniMaxRegion,
  type ProviderId,
} from "../lib/constants";

const OUTPUT_DIR = "avatar-eval-results/live";

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function required(args: string[], name: string): string {
  const value = valueAfter(args, name);
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function keyFor(provider: ProviderId): string | undefined {
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  if (provider === "minimax") return process.env.MINIMAX_API_KEY;
  if (provider === "fal") return process.env.FAL_KEY;
  if (provider === "xai") return process.env.XAI_API_KEY;
  return undefined;
}

function extension(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function mimeTypeForReference(referencePath: string): string {
  const extension = path.extname(referencePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".png") return "image/png";
  throw new Error(`Unsupported reference type: ${extension || "(none)"}.`);
}

async function loadReferenceFiles(
  references: readonly EvaluationReference[],
): Promise<File[]> {
  return Promise.all(
    references.map(async (reference) => {
      if (!reference.path) {
        throw new Error(`${reference.id} has no reviewed fixture path.`);
      }
      const absolutePath = path.resolve(reference.path);
      const workspaceRoot = `${path.resolve(".")}${path.sep}`;
      if (!absolutePath.startsWith(workspaceRoot)) {
        throw new Error(`${reference.id} resolves outside the workspace.`);
      }
      const bytes = await readFile(absolutePath);
      return new File([new Uint8Array(bytes)], path.basename(absolutePath), {
        type: mimeTypeForReference(absolutePath),
      });
    }),
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (!args.includes("--confirm-cost")) {
    throw new Error(
      "Live evaluation can incur provider charges. Re-run with --confirm-cost after reviewing the selected fixtures.",
    );
  }
  const providerValue = required(args, "--provider");
  if (!(PROVIDERS as readonly string[]).includes(providerValue)) {
    throw new Error(`Unknown provider: ${providerValue}.`);
  }
  const providerId = providerValue as ProviderId;

  // Resolve fixtures before asking for a key, so a blocked selection fails
  // without the operator exporting a key first.
  const fixtureIds = required(args, "--fixtures").split(",");
  const selected = fixtureIds.map((fixtureId) => {
    const scenario = AVATAR_EVALUATION_SCENARIOS.find(
      (candidate) => candidate.id === fixtureId,
    );
    if (!scenario) throw new Error(`Unknown fixture: ${fixtureId}.`);
    if (!scenario.liveEligible) {
      throw new Error(
        `${fixtureId} is blocked from live evaluation until its reviewed reference assets have paths.`,
      );
    }
    return scenario;
  });

  const unreachable = unreachableLiveDimensions();
  if (unreachable.length > 0) {
    process.stderr.write(
      `Warning: no live-eligible fixture covers ${unreachable.join(", ")}. This run cannot support a release claim about those dimensions.\n`,
    );
  }

  const apiKey = keyFor(providerId);
  if (!apiKey) {
    throw new Error(
      `Set ${
        providerId === "fal"
          ? "FAL_KEY"
          : providerId === "xai"
            ? "XAI_API_KEY"
            : `${providerId.toUpperCase()}_API_KEY`
      } in the command environment. The value is never logged or written.`,
    );
  }
  const runId = required(args, "--run-id");
  const runDirectory = path.join(OUTPUT_DIR, runId);
  await mkdir(runDirectory, { recursive: true });
  const adapter = getProvider(providerId);
  const manifest: Array<{
    fixtureId: string;
    latencyMs: number;
    imageCount: number;
    upstreamRequestCount: number;
    outputs: string[];
  }> = [];

  // Count real upstream requests instead of inferring them from the number of
  // returned images; a provider may poll or retry, so the two differ.
  const baseFetch = globalThis.fetch;
  let upstreamRequests = 0;
  globalThis.fetch = ((input: Parameters<typeof baseFetch>[0], init?: Parameters<typeof baseFetch>[1]) => {
    upstreamRequests += 1;
    return baseFetch(input, init);
  }) as typeof baseFetch;

  for (const scenario of selected) {
    const intent = createAvatarIntent({
      mode: scenario.mode,
      ...scenario.expectedIntent,
      subjectDescription: scenario.brief,
      pairedConsistency: scenario.mode === "couple-text",
      sameFrame: scenario.mode === "couple-text",
    });
    const compiled = compileAvatarPrompt({
      provider: providerId,
      intent,
      style: getStyleById(intent.styleId),
      theme: getThemeById(intent.themeId),
      variant: getVariant(intent.themeId, intent.variantId),
    });
    const requestsBefore = upstreamRequests;
    const started = Date.now();
    const referenceImages = await loadReferenceFiles(scenario.references);
    const images = await adapter.generateAvatar({
      apiKey,
      region:
        providerId === "minimax"
          ? ((valueAfter(args, "--region") ?? "global") as MiniMaxRegion)
          : undefined,
      mode: intent.mode,
      images: referenceImages,
      prompt: compiled.prompt,
      negativePrompt: compiled.negativePrompt,
      referenceStrength: compiled.referenceStrength,
      sameFrame: intent.sameFrame,
      styleId: intent.styleId,
      themeId: intent.themeId,
      variantId: intent.variantId,
      size: intent.size,
    });
    const outputs: string[] = [];
    for (const [index, image] of images.entries()) {
      if (!image.base64) throw new Error(`${scenario.id} returned no image bytes.`);
      const filename = `${scenario.id}-${index + 1}.${extension(image.mimeType)}`;
      await writeFile(path.join(runDirectory, filename), Buffer.from(image.base64, "base64"));
      outputs.push(filename);
    }
    manifest.push({
      fixtureId: scenario.id,
      latencyMs: Date.now() - started,
      imageCount: images.length,
      upstreamRequestCount: upstreamRequests - requestsBefore,
      outputs,
    });
  }
  globalThis.fetch = baseFetch;

  await writeFile(
    path.join(runDirectory, "manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        runId,
        createdAt: new Date().toISOString(),
        provider: providerId,
        model: modelLabelForProvider(providerId),
        fixtures: manifest,
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(runDirectory, "review.html"),
    renderSmallSizeReviewSheet(runId, manifest),
  );
  process.stdout.write(
    `Live outputs and review.html written to ${runDirectory}. Add rubric scores with npm run eval:avatar -- template/report; never commit this directory.\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Live evaluation failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
