import type { GeneratedImage } from "@/lib/types";

function extensionForMimeType(mimeType: GeneratedImage["mimeType"]): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

/** Convert an in-memory provider result into a one-request edit upload. */
export function generatedImageToFile(
  image: GeneratedImage,
  basename = "selected-avatar",
): File | null {
  if (!image.base64) return null;

  try {
    const binary = atob(image.base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new File(
      [bytes],
      `${basename}.${extensionForMimeType(image.mimeType)}`,
      { type: image.mimeType },
    );
  } catch {
    return null;
  }
}
