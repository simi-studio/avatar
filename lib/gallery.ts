import type { GenerationMode } from "@/lib/constants";

export type GalleryExample = {
  id: string;
  src: string;
  titleKey: string;
  mode: GenerationMode;
  styleId?: string;
  themeId?: string;
  variantId?: string;
  prompt: string;
  sameFrame?: boolean;
};

/** Synthetic sample looks for the public site. No real people. See public/gallery/README.md. */
export const GALLERY_EXAMPLES: readonly GalleryExample[] = [
  {
    id: "professional",
    src: "/gallery/professional.jpg",
    titleKey: "professional",
    mode: "text",
    styleId: "professional-headshot",
    prompt: "A friendly professional portrait with warm studio lighting.",
  },
  {
    id: "anime",
    src: "/gallery/anime.jpg",
    titleKey: "anime",
    mode: "text",
    styleId: "anime",
    prompt: "A confident social avatar in a clean anime style.",
  },
  {
    id: "comic",
    src: "/gallery/comic.jpg",
    titleKey: "comic",
    mode: "text",
    styleId: "comic-book",
    prompt: "A graphic comic-book avatar with bold ink lines.",
  },
  {
    id: "watercolor",
    src: "/gallery/watercolor.jpg",
    titleKey: "watercolor",
    mode: "text",
    styleId: "watercolor",
    prompt: "A soft watercolor portrait avatar on light paper.",
  },
  {
    id: "corgi",
    src: "/gallery/corgi.jpg",
    titleKey: "corgi",
    mode: "themed",
    themeId: "dogs",
    variantId: "corgi",
    prompt: "A cheerful team mascot wearing a tiny blue collar.",
  },
  {
    id: "couple",
    src: "/gallery/couple.jpg",
    titleKey: "couple",
    mode: "couple-text",
    styleId: "professional-headshot",
    sameFrame: true,
    prompt: "A pair of colleagues sharing the same studio portrait.",
  },
];

export function getGalleryExample(
  id: string | null | undefined,
): GalleryExample | undefined {
  if (!id) return undefined;
  return GALLERY_EXAMPLES.find((example) => example.id === id);
}

export const GALLERY_HERO_SRC = GALLERY_EXAMPLES[0]?.src ?? "/gallery/professional.jpg";

/** Landscape social card composed from the synthetic gallery stills. */
export const OG_IMAGE_SRC = "/og.jpg";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
