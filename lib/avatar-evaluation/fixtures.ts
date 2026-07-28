import type { EvaluationScenario } from "@/lib/avatar-evaluation/types";

export const AVATAR_EVALUATION_FIXTURE_VERSION = "1.0.0";

const professionalDimensions = [
  "promptAdherence",
  "smallSizeReadability",
  "visualIntegrity",
] as const;
const photoDimensions = [
  "likeness",
  "promptAdherence",
  "smallSizeReadability",
  "visualIntegrity",
] as const;
const coupleDimensions = [
  "likeness",
  "promptAdherence",
  "coupleIdentitySeparation",
  "smallSizeReadability",
  "visualIntegrity",
] as const;
const editDimensions = [
  "likeness",
  "promptAdherence",
  "editPreservation",
  "visualIntegrity",
] as const;

const REFERENCE_DIRECTORY = "fixtures/avatar-evaluation/references";

function referencePath(id: string): string {
  return `${REFERENCE_DIRECTORY}/${id}.jpg`;
}

const syntheticFront = (id: string, person: "A" | "B" = "A") => ({
  id,
  person,
  role: "front" as const,
  provenance: "synthetic" as const,
  license: "CC0-1.0",
  path: referencePath(id),
});

const syntheticProfile = (id: string, person: "A" | "B" = "A") => ({
  id,
  person,
  role: "profile" as const,
  provenance: "synthetic" as const,
  license: "CC0-1.0",
  path: referencePath(id),
});

/**
 * Multi-reference and same-frame scenarios remain blocked until Provider
 * Capabilities v2 verifies a matching execution path. The committed synthetic
 * paths still make the reference provenance explicit.
 */
export const AVATAR_EVALUATION_SCENARIOS: readonly EvaluationScenario[] = [
  {
    id: "professional-founder-en",
    pairId: "professional-founder",
    locale: "en",
    category: "professional",
    mode: "text",
    brief: "Approachable startup founder headshot, neutral studio, no suit",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "studio", likeness: "high", creativity: "low" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "professional-founder-zh",
    pairId: "professional-founder",
    locale: "zh-CN",
    category: "professional",
    mode: "text",
    brief: "亲和的创业者职业头像，中性影棚背景，不要西装",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "studio", likeness: "high", creativity: "low" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "professional-engineer-en", pairId: "professional-engineer", locale: "en", category: "professional", mode: "text",
    brief: "Calm software engineer profile image, soft daylight, simple background",
    expectedIntent: { goal: "professional-profile", styleId: "linkedin", composition: "headshot", background: "plain", likeness: "high", creativity: "low" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "professional-engineer-zh", pairId: "professional-engineer", locale: "zh-CN", category: "professional", mode: "text",
    brief: "沉稳的软件工程师头像，柔和日光，简洁背景",
    expectedIntent: { goal: "professional-profile", styleId: "linkedin", composition: "headshot", background: "plain", likeness: "high", creativity: "low" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "social-gaming-en", pairId: "social-gaming", locale: "en", category: "social", mode: "text",
    brief: "Expressive gaming avatar, neon cyan accents, readable at tiny size",
    expectedIntent: { goal: "social-avatar", styleId: "cyberpunk", composition: "headshot", background: "scene", likeness: "medium", creativity: "high" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "social-gaming-zh", pairId: "social-gaming", locale: "zh-CN", category: "social", mode: "text",
    brief: "有表现力的游戏头像，青色霓虹点缀，小尺寸仍清晰",
    expectedIntent: { goal: "social-avatar", styleId: "cyberpunk", composition: "headshot", background: "scene", likeness: "medium", creativity: "high" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "social-friendly-en", pairId: "social-friendly", locale: "en", category: "social", mode: "text",
    brief: "Friendly social avatar, warm palette, memorable glasses, no text",
    expectedIntent: { goal: "social-avatar", styleId: "pixar-3d", composition: "headshot", background: "plain", likeness: "medium", creativity: "medium" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "social-friendly-zh", pairId: "social-friendly", locale: "zh-CN", category: "social", mode: "text",
    brief: "友好的社交头像，暖色调，有辨识度的眼镜，不要文字",
    expectedIntent: { goal: "social-avatar", styleId: "pixar-3d", composition: "headshot", background: "plain", likeness: "medium", creativity: "medium" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "stylized-anime-en", pairId: "stylized-anime", locale: "en", category: "stylized", mode: "text",
    brief: "Anime portrait, restrained colors, confident expression, no watermark",
    expectedIntent: { goal: "character", styleId: "anime", composition: "headshot", background: "plain", likeness: "low", creativity: "high" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "stylized-anime-zh", pairId: "stylized-anime", locale: "zh-CN", category: "stylized", mode: "text",
    brief: "动漫肖像，克制配色，自信表情，不要水印",
    expectedIntent: { goal: "character", styleId: "anime", composition: "headshot", background: "plain", likeness: "low", creativity: "high" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "stylized-watercolor-en", pairId: "stylized-watercolor", locale: "en", category: "stylized", mode: "text",
    brief: "Soft watercolor half-body avatar with one red scarf, uncluttered scene",
    expectedIntent: { goal: "character", styleId: "watercolor", composition: "half-body", background: "scene", likeness: "low", creativity: "high" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "stylized-watercolor-zh", pairId: "stylized-watercolor", locale: "zh-CN", category: "stylized", mode: "text",
    brief: "柔和水彩半身头像，只保留一条红围巾，场景不杂乱",
    expectedIntent: { goal: "character", styleId: "watercolor", composition: "half-body", background: "scene", likeness: "low", creativity: "high" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "themed-dog-en", pairId: "themed-dog", locale: "en", category: "themed", mode: "themed",
    brief: "Corgi team mascot, glasses and laptop, cohesive blue palette",
    expectedIntent: { goal: "team-character", themeId: "dogs", variantId: "corgi", composition: "half-body", background: "plain", likeness: "medium", creativity: "medium" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "themed-dog-zh", pairId: "themed-dog", locale: "zh-CN", category: "themed", mode: "themed",
    brief: "柯基团队吉祥物，戴眼镜拿笔记本电脑，统一蓝色调",
    expectedIntent: { goal: "team-character", themeId: "dogs", variantId: "corgi", composition: "half-body", background: "plain", likeness: "medium", creativity: "medium" },
    references: [], requiredDimensions: [...professionalDimensions], liveEligible: true,
  },
  {
    id: "photo-single-front", locale: "en", category: "realistic", mode: "single",
    brief: "Preserve identity, professional headshot, light gray studio background",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "studio", likeness: "high", creativity: "low" },
    references: [syntheticFront("synthetic-person-a-front")], requiredDimensions: [...photoDimensions], liveEligible: true,
  },
  {
    id: "photo-single-stylized", locale: "en", category: "stylized", mode: "single",
    brief: "Preserve recognizable face, graphic comic-book avatar, plain background",
    expectedIntent: { goal: "social-avatar", styleId: "comic-book", composition: "headshot", background: "plain", likeness: "high", creativity: "medium" },
    references: [syntheticFront("synthetic-person-a-front")], requiredDimensions: [...photoDimensions], liveEligible: true,
  },
  {
    id: "photo-multi-reference", locale: "en", category: "realistic", mode: "single",
    brief: "Use both references to preserve identity in a natural professional portrait",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "studio", likeness: "high", creativity: "low" },
    references: [syntheticFront("synthetic-person-a-front"), syntheticProfile("synthetic-person-a-profile")], requiredDimensions: [...photoDimensions], liveEligible: false,
  },
  {
    id: "couple-photo-ab", locale: "en", category: "couple", mode: "couple",
    brief: "Two distinct people, matching professional style, separate A/B avatars",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "studio", likeness: "high", creativity: "low" },
    references: [syntheticFront("synthetic-person-a-front"), syntheticFront("synthetic-person-b-front", "B")], requiredDimensions: [...coupleDimensions], liveEligible: true,
  },
  {
    id: "couple-photo-same-frame", locale: "en", category: "couple", mode: "couple",
    brief: "Place both referenced people in one frame and preserve each identity",
    expectedIntent: { goal: "social-avatar", styleId: "pixar-3d", composition: "half-body", background: "scene", likeness: "high", creativity: "medium" },
    references: [syntheticFront("synthetic-person-a-front"), syntheticFront("synthetic-person-b-front", "B")], requiredDimensions: [...coupleDimensions], liveEligible: false,
  },
  {
    id: "couple-text-en", pairId: "couple-text", locale: "en", category: "couple", mode: "couple-text",
    brief: "Two founders in one friendly illustrated frame, cohesive lighting",
    expectedIntent: { goal: "team-character", styleId: "pixar-3d", composition: "half-body", background: "plain", likeness: "medium", creativity: "medium" },
    references: [], requiredDimensions: ["promptAdherence", "coupleIdentitySeparation", "smallSizeReadability", "visualIntegrity"], liveEligible: true,
  },
  {
    id: "couple-text-zh", pairId: "couple-text", locale: "zh-CN", category: "couple", mode: "couple-text",
    brief: "两位创业者在同一幅友好插画中，光线和风格统一",
    expectedIntent: { goal: "team-character", styleId: "pixar-3d", composition: "half-body", background: "plain", likeness: "medium", creativity: "medium" },
    references: [], requiredDimensions: ["promptAdherence", "coupleIdentitySeparation", "smallSizeReadability", "visualIntegrity"], liveEligible: true,
  },
  {
    id: "edit-background-only", locale: "en", category: "edit", mode: "single",
    brief: "Change only the background to light gray",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "plain", likeness: "high", creativity: "low" },
    references: [syntheticFront("synthetic-edit-parent")], requiredDimensions: [...editDimensions], change: ["background: light gray"], preserve: ["identity", "expression", "clothing", "framing"], liveEligible: true,
  },
  {
    id: "edit-expression-only", locale: "en", category: "edit", mode: "single",
    brief: "Make the smile slightly warmer; change nothing else",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "studio", likeness: "high", creativity: "low" },
    references: [syntheticFront("synthetic-edit-parent")], requiredDimensions: [...editDimensions], change: ["expression: slightly warmer smile"], preserve: ["identity", "hair", "clothing", "background", "framing"], liveEligible: true,
  },
  {
    id: "edit-preserve-only", locale: "zh-CN", category: "edit", mode: "single",
    brief: "保持脸、发型、服装和构图完全不变，仅清理背景杂物",
    expectedIntent: { goal: "professional-profile", styleId: "professional-headshot", composition: "headshot", background: "plain", likeness: "high", creativity: "low" },
    references: [syntheticFront("synthetic-edit-parent")], requiredDimensions: [...editDimensions], change: ["remove background clutter"], preserve: ["identity", "hair", "clothing", "composition"], liveEligible: true,
  },
];
