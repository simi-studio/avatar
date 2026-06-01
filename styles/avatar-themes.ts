import type { AvatarTheme, AvatarVariant } from "@/lib/types";

/**
 * Built-in avatar themes (prd.md §2.3). Display names are resolved via the
 * `Theme` i18n namespace using the theme/variant `id`; values here are English
 * source labels and the prompt fragments used by the prompt builder.
 */
export const AVATAR_THEMES: AvatarTheme[] = [
  {
    id: "dogs",
    name: "Dogs",
    thumbnail: "/previews/themes/dogs.svg",
    basePrompt:
      "a cute anthropomorphic dog character avatar, friendly, expressive eyes, clean background",
    variants: [
      {
        id: "shiba-inu",
        name: "Shiba Inu",
        thumbnail: "/previews/themes/shiba-inu.svg",
        promptFragment: "shiba inu, orange and cream fur, curled tail",
      },
      {
        id: "corgi",
        name: "Corgi",
        thumbnail: "/previews/themes/corgi.svg",
        promptFragment: "welsh corgi, short legs, big ears",
      },
      {
        id: "golden-retriever",
        name: "Golden Retriever",
        thumbnail: "/previews/themes/golden-retriever.svg",
        promptFragment: "golden retriever, golden fluffy fur, warm smile",
      },
      {
        id: "husky",
        name: "Husky",
        thumbnail: "/previews/themes/husky.svg",
        promptFragment: "siberian husky, blue eyes, grey and white fur",
      },
      {
        id: "poodle",
        name: "Poodle",
        thumbnail: "/previews/themes/poodle.svg",
        promptFragment: "poodle, curly fluffy coat, elegant posture",
      },
      {
        id: "border-collie",
        name: "Border Collie",
        thumbnail: "/previews/themes/border-collie.svg",
        promptFragment: "border collie, black and white fur, alert eyes",
      },
      {
        id: "dalmatian",
        name: "Dalmatian",
        thumbnail: "/previews/themes/dalmatian.svg",
        promptFragment: "dalmatian, white coat with black spots",
      },
      {
        id: "pug",
        name: "Pug",
        thumbnail: "/previews/themes/pug.svg",
        promptFragment: "pug, wrinkled face, big round eyes, fawn coat",
      },
    ],
  },
];

const THEME_BY_ID = new Map(AVATAR_THEMES.map((theme) => [theme.id, theme]));

export function getThemeById(id: string | undefined): AvatarTheme | undefined {
  if (!id) return undefined;
  return THEME_BY_ID.get(id);
}

export function getVariant(
  themeId: string | undefined,
  variantId: string | undefined,
): AvatarVariant | undefined {
  const theme = getThemeById(themeId);
  if (!theme || !variantId) return undefined;
  return theme.variants.find((variant) => variant.id === variantId);
}

export const THEME_IDS = AVATAR_THEMES.map((theme) => theme.id);
