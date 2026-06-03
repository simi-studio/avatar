import {
  GENERATION_MODES,
  MINIMAX_REGIONS,
  PROVIDERS,
  type GenerationMode,
  type MiniMaxRegion,
  type ProviderId,
} from "@/lib/constants";
import { isSupportedLocale } from "@/i18n/routing";
import { redactText } from "@/lib/redaction";
import { getStyleById } from "@/styles/avatar-styles";
import { AVATAR_THEMES, getThemeById } from "@/styles/avatar-themes";

/**
 * A team preset is a stateless, shareable base setup. It intentionally carries
 * only non-sensitive configuration (mode, provider, region, style/theme).
 *
 * SECURITY: a preset NEVER contains an API key or any key-like secret. Decoding
 * drops any field outside the allowlist, including anything that looks like a
 * credential. See AGENTS.md ("Team preset URLs must never contain API keys").
 */
export type TeamPreset = {
  mode?: GenerationMode;
  provider?: ProviderId;
  region?: MiniMaxRegion;
  styleId?: string;
  themeId?: string;
  variantId?: string;
  pairedConsistency?: boolean;
  locale?: string;
};

/** The only fields allowed to survive encode/decode. */
const PRESET_ALLOWLIST = [
  "mode",
  "provider",
  "region",
  "styleId",
  "themeId",
  "variantId",
  "pairedConsistency",
  "locale",
] as const;

/** Substrings that mark a field as credential-like and force-drop it. */
const KEY_LIKE = ["key", "token", "secret", "password", "auth", "credential"];
const MAX_PRESET_CODE_LENGTH = 4096;

function isKeyLike(field: string): boolean {
  const lower = field.toLowerCase();
  return KEY_LIKE.some((needle) => lower.includes(needle));
}

function isSafePresetValue(value: string): boolean {
  return redactText(value) === value;
}

function isKnownVariantId(value: string): boolean {
  return AVATAR_THEMES.some((theme) =>
    theme.variants.some((variant) => variant.id === value),
  );
}

function base64UrlEncode(input: string): string {
  const base64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, "utf-8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(padded)));
  }
  return Buffer.from(padded, "base64").toString("utf-8");
}

/**
 * Sanitize an arbitrary object into a safe `TeamPreset`, dropping any field
 * that is not allowlisted or that looks like a credential.
 */
function sanitize(raw: Record<string, unknown>): TeamPreset {
  const preset: TeamPreset = {};

  for (const [field, value] of Object.entries(raw)) {
    // Hard security gate: never accept credential-like fields.
    if (isKeyLike(field)) continue;
    if (!(PRESET_ALLOWLIST as readonly string[]).includes(field)) continue;

    switch (field) {
      case "mode":
        if (
          typeof value === "string" &&
          (GENERATION_MODES as readonly string[]).includes(value)
        ) {
          preset.mode = value as GenerationMode;
        }
        break;
      case "provider":
        if (
          typeof value === "string" &&
          (PROVIDERS as readonly string[]).includes(value)
        ) {
          preset.provider = value as ProviderId;
        }
        break;
      case "region":
        if (
          typeof value === "string" &&
          (MINIMAX_REGIONS as readonly string[]).includes(value)
        ) {
          preset.region = value as MiniMaxRegion;
        }
        break;
      case "styleId":
        if (
          typeof value === "string" &&
          value.length > 0 &&
          value.length <= 64 &&
          isSafePresetValue(value) &&
          getStyleById(value)
        ) {
          preset[field] = value;
        }
        break;
      case "themeId":
        if (
          typeof value === "string" &&
          value.length > 0 &&
          value.length <= 64 &&
          isSafePresetValue(value) &&
          getThemeById(value)
        ) {
          preset.themeId = value;
        }
        break;
      case "variantId":
        if (
          typeof value === "string" &&
          value.length > 0 &&
          value.length <= 64 &&
          isSafePresetValue(value) &&
          isKnownVariantId(value)
        ) {
          preset.variantId = value;
        }
        break;
      case "pairedConsistency":
        if (typeof value === "boolean") preset.pairedConsistency = value;
        break;
      case "locale":
        if (typeof value === "string" && isSupportedLocale(value)) {
          preset.locale = value;
        }
        break;
    }
  }

  return preset;
}

/** Encode a team preset into a URL-safe base64url string. */
export function encodePreset(preset: TeamPreset): string {
  const safe = sanitize(preset as Record<string, unknown>);
  return base64UrlEncode(JSON.stringify(safe));
}

/**
 * Decode a preset code back into a sanitized `TeamPreset`. Invalid or malicious
 * codes yield an empty preset rather than throwing.
 */
export function decodePreset(code: string | null | undefined): TeamPreset {
  if (!code) return {};
  if (code.length > MAX_PRESET_CODE_LENGTH) return {};
  try {
    const json = JSON.parse(base64UrlDecode(code)) as unknown;
    if (typeof json !== "object" || json === null) return {};
    return sanitize(json as Record<string, unknown>);
  } catch {
    return {};
  }
}
