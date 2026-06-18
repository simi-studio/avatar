import type { ProviderId } from "@/lib/constants";

export type NegativePromptStrategy = "native" | "soft-prompt";

export type ProviderPromptProfile = {
  provider: ProviderId;
  promptStyle: "natural-language" | "comma-separated";
  preferredLanguage: "en";
  qualityFragment: string;
  supportsNativeNegativePrompt: boolean;
  supportsReferenceStrength: boolean;
  negativePromptStrategy: NegativePromptStrategy;
};

export type StyleCalibration = {
  provider: ProviderId;
  styleId: string;
  promptFragment: string;
  knownBias: string;
  recoveryHint: string;
};

export const PROVIDER_PROMPT_PROFILES: Record<
  ProviderId,
  ProviderPromptProfile
> = {
  openai: {
    provider: "openai",
    promptStyle: "natural-language",
    preferredLanguage: "en",
    qualityFragment:
      "clean centered avatar portrait, high-quality details, sharp focus, intentional lighting",
    supportsNativeNegativePrompt: false,
    supportsReferenceStrength: false,
    negativePromptStrategy: "soft-prompt",
  },
  minimax: {
    provider: "minimax",
    promptStyle: "comma-separated",
    preferredLanguage: "en",
    qualityFragment:
      "clean avatar portrait, high detail, sharp focus, balanced lighting",
    supportsNativeNegativePrompt: false,
    supportsReferenceStrength: false,
    negativePromptStrategy: "soft-prompt",
  },
  fal: {
    provider: "fal",
    // FLUX responds best to rich natural-language descriptions.
    promptStyle: "natural-language",
    preferredLanguage: "en",
    qualityFragment:
      "clean centered avatar portrait, crisp details, sharp focus, natural lighting",
    supportsNativeNegativePrompt: false,
    supportsReferenceStrength: true,
    negativePromptStrategy: "soft-prompt",
  },
};

export const STYLE_CALIBRATION_MATRIX = {
  openai: {
    anime: {
      provider: "openai",
      styleId: "anime",
      promptFragment:
        "a polished anime avatar illustration with expressive eyes, clean line work, and controlled color harmony",
      knownBias:
        "May over-emphasize large eyes when the subject is underspecified.",
      recoveryHint:
        "Add concrete age range, expression, and background details.",
    },
    "pixar-3d": {
      provider: "openai",
      styleId: "pixar-3d",
      promptFragment:
        "a friendly 3D animated character render with rounded features, soft global illumination, and tactile materials",
      knownBias: "Can become overly toy-like for professional goals.",
      recoveryHint: "Lower creativity and ask for a more realistic face shape.",
    },
    cyberpunk: {
      provider: "openai",
      styleId: "cyberpunk",
      promptFragment:
        "a cinematic cyberpunk avatar with neon edge lighting, readable facial silhouette, and restrained futuristic details",
      knownBias: "May create very busy backgrounds.",
      recoveryHint:
        "Use the cleaner-background refinement or plain background control.",
    },
    "professional-headshot": {
      provider: "openai",
      styleId: "professional-headshot",
      promptFragment:
        "a realistic professional headshot with natural skin texture, soft studio light, and a clean business-ready background",
      knownBias: "May smooth skin more than expected.",
      recoveryHint: "Ask for natural skin texture and low creativity.",
    },
    linkedin: {
      provider: "openai",
      styleId: "linkedin",
      promptFragment:
        "a polished LinkedIn-style portrait with approachable expression, soft office depth, and credible professional lighting",
      knownBias: "May add office props when the prompt is sparse.",
      recoveryHint: "Set background to plain or studio.",
    },
    "fantasy-hero": {
      provider: "openai",
      styleId: "fantasy-hero",
      promptFragment:
        "an epic fantasy character avatar with cinematic light, readable costume detail, and heroic but portrait-focused framing",
      knownBias: "May add elaborate armor even when not requested.",
      recoveryHint:
        "Use accessories to specify one signature prop or costume detail.",
    },
    "comic-book": {
      provider: "openai",
      styleId: "comic-book",
      promptFragment:
        "a bold comic-book avatar with clean ink shapes, controlled halftone shading, and strong graphic color blocks",
      knownBias: "Can add text bubbles or lettering.",
      recoveryHint: "Add text, logo, watermark to the avoid list.",
    },
    watercolor: {
      provider: "openai",
      styleId: "watercolor",
      promptFragment:
        "a delicate watercolor portrait avatar with soft edges, paper texture, and gentle transparent washes",
      knownBias: "May reduce facial detail too much.",
      recoveryHint: "Increase likeness and request sharp eyes.",
    },
    "retro-game": {
      provider: "openai",
      styleId: "retro-game",
      promptFragment:
        "a crisp retro pixel-art avatar with readable 16-bit shapes, limited palette, and clean square composition",
      knownBias:
        "May produce low-resolution artifacts outside the pixel style.",
      recoveryHint: "Ask for crisp pixel edges and simple background.",
    },
    "sci-fi": {
      provider: "openai",
      styleId: "sci-fi",
      promptFragment:
        "a sleek science-fiction avatar with subtle holographic accents, clean futuristic materials, and portrait-first framing",
      knownBias: "Can drift into helmeted characters.",
      recoveryHint: "Add avoid helmet or face covering when likeness matters.",
    },
  },
  minimax: {
    anime: {
      provider: "minimax",
      styleId: "anime",
      promptFragment:
        "anime avatar, clean line art, expressive eyes, vivid but controlled colors",
      knownBias: "Responds best to concise visual tokens.",
      recoveryHint: "Prefer comma-separated details over long prose.",
    },
    "pixar-3d": {
      provider: "minimax",
      styleId: "pixar-3d",
      promptFragment:
        "3D animated avatar, rounded features, soft global illumination, friendly character render",
      knownBias: "May lean more cartoon than cinematic.",
      recoveryHint: "Add realistic lighting and natural face proportions.",
    },
    cyberpunk: {
      provider: "minimax",
      styleId: "cyberpunk",
      promptFragment:
        "cyberpunk avatar, neon rim light, futuristic city glow, high contrast, readable face",
      knownBias: "Often intensifies neon saturation.",
      recoveryHint: "Use neutral palette or clean background for restraint.",
    },
    "professional-headshot": {
      provider: "minimax",
      styleId: "professional-headshot",
      promptFragment:
        "professional headshot, realistic portrait, soft studio lighting, clean neutral background",
      knownBias: "Can make backgrounds too plain for social goals.",
      recoveryHint: "Use studio or scene background with a palette hint.",
    },
    linkedin: {
      provider: "minimax",
      styleId: "linkedin",
      promptFragment:
        "LinkedIn profile photo, polished corporate portrait, friendly expression, soft office background",
      knownBias: "May favor generic corporate styling.",
      recoveryHint: "Add accessories or palette for personal brand cues.",
    },
    "fantasy-hero": {
      provider: "minimax",
      styleId: "fantasy-hero",
      promptFragment:
        "fantasy hero avatar, cinematic lighting, ornate costume detail, painterly portrait",
      knownBias: "May add extra props or weapons.",
      recoveryHint: "Keep accessories singular and add clutter to avoid list.",
    },
    "comic-book": {
      provider: "minimax",
      styleId: "comic-book",
      promptFragment:
        "comic book avatar, bold ink outlines, halftone shading, dynamic graphic colors",
      knownBias: "Can add typography-like marks.",
      recoveryHint: "Add text, logo, watermark to the avoid list.",
    },
    watercolor: {
      provider: "minimax",
      styleId: "watercolor",
      promptFragment:
        "watercolor avatar, soft wash, paper texture, gentle brush strokes, delicate colors",
      knownBias: "Can become too soft around eyes.",
      recoveryHint: "Request sharp eyes and high likeness.",
    },
    "retro-game": {
      provider: "minimax",
      styleId: "retro-game",
      promptFragment:
        "retro pixel art avatar, 16-bit style, crisp pixels, limited palette, simple background",
      knownBias: "May mix pixel art with smooth illustration.",
      recoveryHint: "Repeat crisp pixel art and avoid painterly texture.",
    },
    "sci-fi": {
      provider: "minimax",
      styleId: "sci-fi",
      promptFragment:
        "sci-fi avatar, sleek futuristic materials, holographic accents, cool tones, clean portrait framing",
      knownBias: "May obscure the face with helmets or visors.",
      recoveryHint: "Add no helmet, visible face to avoid list when needed.",
    },
  },
  fal: {
    anime: {
      provider: "fal",
      styleId: "anime",
      promptFragment:
        "a polished anime avatar illustration with expressive eyes, clean line work, and harmonious colors",
      knownBias: "FLUX can drift toward semi-realistic anime hybrids.",
      recoveryHint: "Emphasize flat cel shading and clean line art.",
    },
    "pixar-3d": {
      provider: "fal",
      styleId: "pixar-3d",
      promptFragment:
        "a friendly 3D animated character render with rounded features, soft global illumination, and tactile materials",
      knownBias: "Can render overly glossy skin.",
      recoveryHint: "Ask for soft matte skin and natural proportions.",
    },
    cyberpunk: {
      provider: "fal",
      styleId: "cyberpunk",
      promptFragment:
        "a cinematic cyberpunk avatar with neon edge lighting, a readable facial silhouette, and restrained futuristic detail",
      knownBias: "May overload the scene with neon signage.",
      recoveryHint: "Request a clean background and a single key light.",
    },
    "professional-headshot": {
      provider: "fal",
      styleId: "professional-headshot",
      promptFragment:
        "a realistic professional headshot with natural skin texture, soft studio light, and a clean business-ready background",
      knownBias: "Can exaggerate depth-of-field blur.",
      recoveryHint: "Ask for a sharp face and moderate background blur.",
    },
    linkedin: {
      provider: "fal",
      styleId: "linkedin",
      promptFragment:
        "a polished LinkedIn-style portrait with an approachable expression, soft office depth, and credible professional lighting",
      knownBias: "May invent branded clothing or logos.",
      recoveryHint: "Add logos and text to the avoid list.",
    },
    "fantasy-hero": {
      provider: "fal",
      styleId: "fantasy-hero",
      promptFragment:
        "an epic fantasy character avatar with cinematic light, readable costume detail, and heroic portrait-focused framing",
      knownBias: "Tends to add elaborate background scenery.",
      recoveryHint: "Keep the framing tight and the background simple.",
    },
    "comic-book": {
      provider: "fal",
      styleId: "comic-book",
      promptFragment:
        "a bold comic-book avatar with clean ink shapes, controlled halftone shading, and strong graphic color blocks",
      knownBias: "Can add lettering or panel borders.",
      recoveryHint: "Add text, panels, lettering to the avoid list.",
    },
    watercolor: {
      provider: "fal",
      styleId: "watercolor",
      promptFragment:
        "a delicate watercolor portrait avatar with soft edges, paper texture, and gentle transparent washes",
      knownBias: "May wash out fine facial detail.",
      recoveryHint: "Increase likeness and request sharp eyes.",
    },
    "retro-game": {
      provider: "fal",
      styleId: "retro-game",
      promptFragment:
        "a crisp retro pixel-art avatar with readable 16-bit shapes, a limited palette, and a clean square composition",
      knownBias: "Can blend smooth shading into the pixel grid.",
      recoveryHint: "Repeat crisp pixel edges and avoid painterly blur.",
    },
    "sci-fi": {
      provider: "fal",
      styleId: "sci-fi",
      promptFragment:
        "a sleek science-fiction avatar with subtle holographic accents, clean futuristic materials, and portrait-first framing",
      knownBias: "May add helmets that hide the face.",
      recoveryHint: "Add no helmet, visible face to the avoid list.",
    },
  },
} satisfies Record<ProviderId, Record<string, StyleCalibration>>;

export function getProviderPromptProfile(
  provider: ProviderId,
): ProviderPromptProfile {
  return PROVIDER_PROMPT_PROFILES[provider];
}

export function getStyleCalibration(
  provider: ProviderId,
  styleId: string | undefined,
): StyleCalibration | undefined {
  if (!styleId) return undefined;
  const matrix: Record<string, StyleCalibration> =
    STYLE_CALIBRATION_MATRIX[provider];
  return matrix[styleId];
}
