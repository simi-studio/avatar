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
    basePrompt:
      "a cute anthropomorphic dog character avatar, friendly, expressive eyes, clean background",
    variants: [
      {
        id: "shiba-inu",
        name: "Shiba Inu",
        promptFragment: "shiba inu, orange and cream fur, curled tail",
      },
      {
        id: "corgi",
        name: "Corgi",
        promptFragment: "welsh corgi, short legs, big ears",
      },
      {
        id: "golden-retriever",
        name: "Golden Retriever",
        promptFragment: "golden retriever, golden fluffy fur, warm smile",
      },
      {
        id: "husky",
        name: "Husky",
        promptFragment: "siberian husky, blue eyes, grey and white fur",
      },
      {
        id: "poodle",
        name: "Poodle",
        promptFragment: "poodle, curly fluffy coat, elegant posture",
      },
      {
        id: "border-collie",
        name: "Border Collie",
        promptFragment: "border collie, black and white fur, alert eyes",
      },
      {
        id: "dalmatian",
        name: "Dalmatian",
        promptFragment: "dalmatian, white coat with black spots",
      },
      {
        id: "pug",
        name: "Pug",
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
