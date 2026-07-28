export const SMALL_SIZE_REVIEW_PIXELS = [48, 32] as const;

export type ReviewSheetItem = {
  fixtureId: string;
  outputs: string[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Render a local-only sheet that forces full-size and real avatar-size review. */
export function renderSmallSizeReviewSheet(
  runId: string,
  items: readonly ReviewSheetItem[],
): string {
  const cards = items
    .flatMap((item) =>
      item.outputs.map((output, index) => {
        const source = escapeHtml(output);
        const label = escapeHtml(
          `${item.fixtureId}${item.outputs.length > 1 ? ` #${index + 1}` : ""}`,
        );
        return `<article>
  <h2>${label}</h2>
  <div class="previews">
    <figure><img src="${source}" width="256" height="256" alt="${label} at 256 pixels"><figcaption>256×256 context</figcaption></figure>
    ${SMALL_SIZE_REVIEW_PIXELS.map(
      (size) =>
        `<figure><img src="${source}" width="${size}" height="${size}" alt="${label} at ${size} pixels"><figcaption>${size}×${size}</figcaption></figure>`,
    ).join("\n    ")}
  </div>
</article>`;
      }),
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Avatar small-size review — ${escapeHtml(runId)}</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { margin: 0 auto; max-width: 960px; padding: 32px; }
    header { margin-bottom: 32px; }
    article { border-top: 1px solid #8888; padding: 24px 0; }
    .previews { display: flex; align-items: end; gap: 24px; flex-wrap: wrap; }
    figure { margin: 0; text-align: center; }
    img { display: block; object-fit: cover; border-radius: 18%; image-rendering: auto; }
    figcaption { margin-top: 8px; font-size: 12px; opacity: .72; }
  </style>
</head>
<body>
  <header>
    <h1>Avatar small-size review</h1>
    <p>Run: ${escapeHtml(runId)}. Score clarity and distinctiveness at 48×48 and 32×32; use 256×256 only for context.</p>
  </header>
${cards}
</body>
</html>
`;
}
