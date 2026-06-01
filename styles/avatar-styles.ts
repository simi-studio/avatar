import type { AvatarStyle } from "@/lib/types";

/**
 * Built-in avatar styles (prd.md §6.2). `name` is resolved for display via the
 * `Style` i18n namespace using the style `id`; the values here are the English
 * source labels and the prompt templates used by the prompt builder.
 */
export const AVATAR_STYLES: AvatarStyle[] = [
  {
    id: "anime",
    name: "Anime",
    description: "Vibrant Japanese anime illustration.",
    thumbnail: "/previews/styles/anime.svg",
    promptTemplate:
      "anime illustration style, clean line art, vivid colors, expressive eyes",
  },
  {
    id: "pixar-3d",
    name: "Pixar 3D",
    description: "Friendly 3D animated character look.",
    thumbnail: "/previews/styles/pixar-3d.svg",
    promptTemplate:
      "Pixar-style 3D character render, soft global illumination, rounded features",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon-lit futuristic cyberpunk aesthetic.",
    thumbnail: "/previews/styles/cyberpunk.svg",
    promptTemplate:
      "cyberpunk aesthetic, neon lighting, futuristic city background, high contrast",
  },
  {
    id: "professional-headshot",
    name: "Professional Headshot",
    description: "Clean, realistic, business-style portrait.",
    thumbnail: "/previews/styles/professional-headshot.svg",
    promptTemplate:
      "professional studio headshot, realistic lighting, clean neutral background",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Polished, approachable corporate portrait.",
    thumbnail: "/previews/styles/linkedin.svg",
    promptTemplate:
      "corporate LinkedIn profile photo, soft office background, confident friendly expression",
  },
  {
    id: "fantasy-hero",
    name: "Fantasy Hero",
    description: "Epic fantasy character portrait.",
    thumbnail: "/previews/styles/fantasy-hero.svg",
    promptTemplate:
      "epic fantasy hero portrait, dramatic cinematic lighting, ornate armor, painterly detail",
  },
  {
    id: "comic-book",
    name: "Comic Book",
    description: "Bold western comic-book ink style.",
    thumbnail: "/previews/styles/comic-book.svg",
    promptTemplate:
      "western comic book art, bold ink outlines, halftone shading, dynamic colors",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft hand-painted watercolor portrait.",
    thumbnail: "/previews/styles/watercolor.svg",
    promptTemplate:
      "soft watercolor painting, gentle gradients, paper texture, delicate brush strokes",
  },
  {
    id: "retro-game",
    name: "Retro Game",
    description: "Pixel-art retro video game character.",
    thumbnail: "/previews/styles/retro-game.svg",
    promptTemplate:
      "retro pixel art game character, 16-bit style, limited palette, crisp pixels",
  },
  {
    id: "sci-fi",
    name: "Sci-Fi",
    description: "Sleek science-fiction character look.",
    thumbnail: "/previews/styles/sci-fi.svg",
    promptTemplate:
      "sci-fi character concept art, sleek metallic surfaces, holographic accents, cool tones",
  },
];

const STYLE_BY_ID = new Map(AVATAR_STYLES.map((style) => [style.id, style]));

export function getStyleById(id: string | undefined): AvatarStyle | undefined {
  if (!id) return undefined;
  return STYLE_BY_ID.get(id);
}

export const STYLE_IDS = AVATAR_STYLES.map((style) => style.id);
