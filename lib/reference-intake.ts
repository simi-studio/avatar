/**
 * Multi-reference identity intake helpers (Epic 11.4 foundation).
 *
 * Pure, session-only utilities: no embeddings, face templates, or persistence.
 * Geometry/budget checks are deterministic; blur/face-count ML remains out of
 * scope until a privacy-safe client heuristic is chosen.
 */

import {
  MAX_GENERATE_REQUEST_BYTES,
  MAX_IMAGE_BYTES,
  MIN_IMAGE_DIMENSION,
} from "@/lib/constants";
import type { ProviderCapabilitiesV2 } from "@/lib/provider-capabilities";

/** Roles a user can assign without storing biometric templates. */
export const REFERENCE_ROLES = ["front", "profile", "expression"] as const;
export type ReferenceRole = (typeof REFERENCE_ROLES)[number];

export const REFERENCE_PERSON_LABELS = ["A", "B"] as const;
export type ReferencePersonLabel = (typeof REFERENCE_PERSON_LABELS)[number];

export type ReferenceDescriptor = {
  role: ReferenceRole;
  personLabel?: ReferencePersonLabel;
};

/** Hard reject issues — upload should not proceed. */
export type ReferenceHardIssue =
  | "too-small"
  | "extreme-aspect"
  | "file-too-large"
  | "empty-file";

/** Soft guidance — usable but likely weaker for likeness. */
export type ReferenceSoftIssue =
  | "below-recommended-size"
  | "very-wide-or-tall"
  | "approaching-budget"
  | "underexposed"
  | "overexposed";

export type ReferenceGeometryAssessment = {
  hardIssues: ReferenceHardIssue[];
  softIssues: ReferenceSoftIssue[];
  acceptable: boolean;
};

/** Mean luma below this (0–255) is soft-flagged as too dark for identity. */
export const SOFT_UNDEREXPOSED_LUMA = 48;
/** Mean luma above this is soft-flagged as blown-out / low-detail. */
export const SOFT_OVEREXPOSED_LUMA = 225;

/** Leave headroom under the generate request ceiling for keys + form fields. */
export const MAX_TOTAL_REFERENCE_BYTES = Math.floor(
  MAX_GENERATE_REQUEST_BYTES * 0.7,
);

/** Reject extreme panoramas/strips that rarely contain a usable face crop. */
export const MAX_REFERENCE_ASPECT_RATIO = 2.75;

/** Soft warn when the shorter side is usable but below a good portrait crop. */
export const SOFT_MIN_REFERENCE_DIMENSION = 512;

export function isReferenceRole(value: string): value is ReferenceRole {
  return (REFERENCE_ROLES as readonly string[]).includes(value);
}

export function isReferencePersonLabel(
  value: string,
): value is ReferencePersonLabel {
  return (REFERENCE_PERSON_LABELS as readonly string[]).includes(value);
}

/**
 * Geometry checks for a single reference (client or pre-upload).
 * Does not attempt face detection, blur, or demographic inference.
 */
export function assessReferenceGeometry(
  width: number,
  height: number,
  byteLength = 0,
  meanLuma?: number,
): ReferenceGeometryAssessment {
  const hardIssues: ReferenceHardIssue[] = [];
  const softIssues: ReferenceSoftIssue[] = [];

  if (width <= 0 || height <= 0) {
    hardIssues.push("empty-file");
  }
  if (width > 0 && height > 0) {
    if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
      hardIssues.push("too-small");
    }
    const longest = Math.max(width, height);
    const shortest = Math.min(width, height);
    const ratio = shortest > 0 ? longest / shortest : Number.POSITIVE_INFINITY;
    if (ratio > MAX_REFERENCE_ASPECT_RATIO) {
      hardIssues.push("extreme-aspect");
    } else if (ratio > 2) {
      softIssues.push("very-wide-or-tall");
    }
    if (
      width < SOFT_MIN_REFERENCE_DIMENSION ||
      height < SOFT_MIN_REFERENCE_DIMENSION
    ) {
      softIssues.push("below-recommended-size");
    }
  }
  if (byteLength > MAX_IMAGE_BYTES) {
    hardIssues.push("file-too-large");
  } else if (byteLength > MAX_IMAGE_BYTES * 0.85) {
    softIssues.push("approaching-budget");
  }
  if (typeof meanLuma === "number" && Number.isFinite(meanLuma)) {
    if (meanLuma < SOFT_UNDEREXPOSED_LUMA) {
      softIssues.push("underexposed");
    } else if (meanLuma > SOFT_OVEREXPOSED_LUMA) {
      softIssues.push("overexposed");
    }
  }

  return {
    hardIssues,
    softIssues,
    acceptable: hardIssues.length === 0,
  };
}

/**
 * Prefer the most actionable soft issue for a single uploader hint.
 * Underexposure beats size/aspect because dark refs lose likeness hardest
 * under style restyle (multimodal probe 2026-08).
 */
export function primarySoftIssue(
  softIssues: readonly ReferenceSoftIssue[],
): ReferenceSoftIssue | undefined {
  const priority: ReferenceSoftIssue[] = [
    "underexposed",
    "overexposed",
    "below-recommended-size",
    "very-wide-or-tall",
    "approaching-budget",
  ];
  return priority.find((issue) => softIssues.includes(issue));
}

export function totalReferenceBytes(sizes: readonly number[]): number {
  return sizes.reduce((sum, size) => sum + Math.max(0, size), 0);
}

export function fitsReferenceBudget(
  sizes: readonly number[],
  maxBytes = MAX_TOTAL_REFERENCE_BYTES,
): boolean {
  return totalReferenceBytes(sizes) <= maxBytes;
}

/** How many references the current provider capability allows in one request. */
export function maxReferencesForCapabilities(
  capabilities: Pick<
    ProviderCapabilitiesV2,
    "maxReferenceImages" | "identityPreservation"
  >,
): number {
  if (capabilities.identityPreservation === "none") {
    // Adapters still accept a single photo for single/couple modes; product
    // multi-reference UI remains gated until identityPreservation upgrades.
    return Math.min(1, capabilities.maxReferenceImages);
  }
  return Math.max(0, capabilities.maxReferenceImages);
}

export function canAcceptMultiReference(
  capabilities: Pick<
    ProviderCapabilitiesV2,
    "maxReferenceImages" | "identityPreservation"
  >,
): boolean {
  return (
    capabilities.identityPreservation === "multi-reference" &&
    capabilities.maxReferenceImages > 1
  );
}

export function canAcceptSameFrameComposite(
  capabilities: Pick<
    ProviderCapabilitiesV2,
    "supportsMultiImageComposite" | "maxReferencePeople"
  >,
): boolean {
  return (
    capabilities.supportsMultiImageComposite &&
    capabilities.maxReferencePeople >= 2
  );
}

/**
 * Compile role labels into provider-facing identity guidance.
 * Multimodal multi-ref probes benefited from explicit front/profile roles.
 */
export function compileReferenceRoleGuidance(
  descriptors: readonly ReferenceDescriptor[],
): string | undefined {
  if (descriptors.length === 0) return undefined;

  const parts = descriptors.map((descriptor, index) => {
    const person = descriptor.personLabel
      ? `person ${descriptor.personLabel}`
      : "the subject";
    const roleText =
      descriptor.role === "front"
        ? "frontal identity reference"
        : descriptor.role === "profile"
          ? "three-quarter or profile identity reference"
          : "natural-expression identity reference";
    return `Image ${index + 1} is the ${roleText} for ${person}`;
  });

  const multiPerson = descriptors.some((d) => d.personLabel === "B");
  const tail = multiPerson
    ? "Preserve each labeled person as a distinct identity; do not blend faces."
    : "Use all references only to understand and preserve the same identity; do not invent a different person.";

  return `${parts.join(". ")}. ${tail}`;
}

/**
 * Normalize a free-form role string from form/query input.
 */
export function normalizeReferenceRole(
  value: unknown,
): ReferenceRole | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  return isReferenceRole(trimmed) ? trimmed : undefined;
}

/**
 * Default role assignment when the client sends N ordered single-person
 * references (front, then profile, then expression).
 */
export function defaultSinglePersonReferenceRoles(
  count: number,
): ReferenceDescriptor[] {
  const order: ReferenceRole[] = ["front", "profile", "expression"];
  return order.slice(0, Math.max(0, count)).map((role) => ({ role }));
}
