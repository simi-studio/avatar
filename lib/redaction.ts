/**
 * Redaction helpers. Even though Simi Avatar never logs keys or images, these
 * utilities provide defense-in-depth so any accidental string interpolation of
 * a secret is masked rather than leaked. See security.md.
 */

const KEY_LIKE_PATTERN =
  /\b(sk-[A-Za-z0-9_-]{8,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|[A-Za-z0-9_-]{32,})\b/g;

/** Mask a single secret value, keeping only a short, non-reversible hint. */
export function redactSecret(secret: string | undefined | null): string {
  if (!secret) return "";
  if (secret.length <= 8) return "***";
  return `${secret.slice(0, 3)}***${secret.slice(-2)}`;
}

/**
 * Scrub a free-form string (e.g. an upstream error message) of anything that
 * looks like an API key or token before it is surfaced or logged.
 */
export function redactText(text: string): string {
  return text.replace(KEY_LIKE_PATTERN, "***");
}
