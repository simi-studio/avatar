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
  {
    id: "cats",
    name: "Cats",
    basePrompt:
      "a cute anthropomorphic cat character avatar, expressive eyes, soft fur, clean background",
    variants: [
      {
        id: "tabby",
        name: "Tabby",
        promptFragment: "tabby cat, brown and black striped fur, green eyes",
      },
      {
        id: "calico",
        name: "Calico",
        promptFragment:
          "calico cat, white orange and black patches, gentle expression",
      },
      {
        id: "siamese",
        name: "Siamese",
        promptFragment: "siamese cat, cream coat, dark points, blue almond eyes",
      },
      {
        id: "black-cat",
        name: "Black Cat",
        promptFragment: "sleek black cat, glossy fur, bright yellow eyes",
      },
      {
        id: "orange-tabby",
        name: "Orange Tabby",
        promptFragment: "orange tabby cat, ginger striped fur, round cheeks",
      },
      {
        id: "tuxedo",
        name: "Tuxedo",
        promptFragment:
          "tuxedo cat, black and white coat, white chest and paws",
      },
      {
        id: "persian",
        name: "Persian",
        promptFragment: "persian cat, long fluffy fur, flat round face",
      },
    ],
  },
  {
    id: "robots",
    name: "Robots",
    basePrompt:
      "a friendly robot character avatar, clean mechanical design, expressive lens eyes, simple background",
    variants: [
      {
        id: "retro-bot",
        name: "Retro Bot",
        promptFragment: "retro tin robot, boxy body, antenna, riveted panels",
      },
      {
        id: "mech-warrior",
        name: "Mech Warrior",
        promptFragment: "armored mech warrior, sturdy plating, glowing visor",
      },
      {
        id: "droid-companion",
        name: "Droid Companion",
        promptFragment: "small droid companion, rounded shell, single glowing eye",
      },
      {
        id: "chrome-android",
        name: "Chrome Android",
        promptFragment: "sleek chrome android, smooth humanoid face, polished metal",
      },
      {
        id: "steampunk-bot",
        name: "Steampunk Bot",
        promptFragment: "steampunk automaton, brass gears, copper pipes, warm tones",
      },
      {
        id: "cute-bot",
        name: "Cute Bot",
        promptFragment: "cute mini robot, rounded body, big friendly screen face",
      },
    ],
  },
  {
    id: "pixel-heroes",
    name: "Pixel Heroes",
    basePrompt:
      "a retro pixel-art hero character avatar, crisp 16-bit shapes, limited palette, clean composition",
    variants: [
      {
        id: "knight",
        name: "Knight",
        promptFragment: "armored knight hero, pixel plate armor, sword and shield",
      },
      {
        id: "mage",
        name: "Mage",
        promptFragment: "pixel mage, pointed hat, glowing staff, flowing robe",
      },
      {
        id: "rogue",
        name: "Rogue",
        promptFragment: "pixel rogue, hooded cloak, twin daggers, stealthy stance",
      },
      {
        id: "archer",
        name: "Archer",
        promptFragment: "pixel archer, bow and quiver, leather tunic",
      },
      {
        id: "warrior",
        name: "Warrior",
        promptFragment: "pixel warrior, heavy armor, battle axe, fierce stance",
      },
      {
        id: "ninja",
        name: "Ninja",
        promptFragment: "pixel ninja, dark garb, face mask, agile pose",
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
