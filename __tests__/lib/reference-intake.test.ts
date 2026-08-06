import { describe, expect, it } from "vitest";

import {
  assessReferenceGeometry,
  canAcceptMultiReference,
  canAcceptSameFrameComposite,
  compileReferenceRoleGuidance,
  defaultSinglePersonReferenceRoles,
  fitsReferenceBudget,
  maxReferencesForCapabilities,
  MAX_REFERENCE_ASPECT_RATIO,
  MAX_TOTAL_REFERENCE_BYTES,
  normalizeReferenceRole,
} from "@/lib/reference-intake";
import type { ProviderCapabilitiesV2 } from "@/lib/provider-capabilities";

const baseCaps = {
  maxReferenceImages: 1,
  maxReferencePeople: 1,
  identityPreservation: "none",
  supportsMultiImageComposite: false,
} as Pick<
  ProviderCapabilitiesV2,
  | "maxReferenceImages"
  | "maxReferencePeople"
  | "identityPreservation"
  | "supportsMultiImageComposite"
>;

describe("reference intake", () => {
  it("rejects too-small and extreme-aspect geometry", () => {
    expect(assessReferenceGeometry(100, 100).acceptable).toBe(false);
    expect(assessReferenceGeometry(100, 100).hardIssues).toContain("too-small");

    const extreme = assessReferenceGeometry(3000, 200);
    expect(extreme.acceptable).toBe(false);
    expect(extreme.hardIssues).toContain("extreme-aspect");
    expect(MAX_REFERENCE_ASPECT_RATIO).toBeGreaterThan(2);
  });

  it("accepts passport-like squares and soft-warns smaller recommended crops", () => {
    const good = assessReferenceGeometry(1024, 1024);
    expect(good.acceptable).toBe(true);
    expect(good.hardIssues).toHaveLength(0);

    const soft = assessReferenceGeometry(400, 400);
    expect(soft.acceptable).toBe(true);
    expect(soft.softIssues).toContain("below-recommended-size");
  });

  it("enforces a total reference byte budget under the generate ceiling", () => {
    expect(fitsReferenceBudget([1_000_000, 2_000_000])).toBe(true);
    expect(
      fitsReferenceBudget([MAX_TOTAL_REFERENCE_BYTES + 1]),
    ).toBe(false);
  });

  it("gates multi-reference and same-frame composite on capability truth", () => {
    expect(canAcceptMultiReference(baseCaps)).toBe(false);
    expect(maxReferencesForCapabilities(baseCaps)).toBe(1);
    expect(canAcceptSameFrameComposite(baseCaps)).toBe(false);

    const multi = {
      ...baseCaps,
      maxReferenceImages: 3,
      maxReferencePeople: 2,
      identityPreservation: "multi-reference" as const,
      supportsMultiImageComposite: true,
    };
    expect(canAcceptMultiReference(multi)).toBe(true);
    expect(maxReferencesForCapabilities(multi)).toBe(3);
    expect(canAcceptSameFrameComposite(multi)).toBe(true);
  });

  it("compiles explicit front/profile roles for multi-reference prompts", () => {
    const guidance = compileReferenceRoleGuidance([
      { role: "front", personLabel: "A" },
      { role: "profile", personLabel: "A" },
    ]);
    expect(guidance).toContain("Image 1");
    expect(guidance).toContain("frontal");
    expect(guidance).toContain("profile");
    expect(guidance).toContain("same identity");
    expect(normalizeReferenceRole(" FRONT ")).toBe("front");
    expect(normalizeReferenceRole("nope")).toBeUndefined();
  });

  it("asks for distinct people when labels include person B", () => {
    const guidance = compileReferenceRoleGuidance([
      { role: "front", personLabel: "A" },
      { role: "front", personLabel: "B" },
    ]);
    expect(guidance).toContain("distinct identity");
    expect(guidance).toContain("do not blend");
  });

  it("assigns ordered default roles for N single-person references", () => {
    expect(defaultSinglePersonReferenceRoles(2).map((d) => d.role)).toEqual([
      "front",
      "profile",
    ]);
    expect(defaultSinglePersonReferenceRoles(0)).toEqual([]);
  });
});
