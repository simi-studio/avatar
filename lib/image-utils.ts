import {
  MAX_IMAGE_BYTES,
  RECOMMENDED_IMAGE_DIMENSION,
} from "@/lib/constants";

/**
 * Compute output dimensions that fit within `maxDimension` while preserving the
 * aspect ratio. Images smaller than the limit are returned unchanged. Pure and
 * unit-testable (no DOM).
 */
export function computeScaledDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type ProcessImageOptions = {
  maxDimension?: number;
  /** Output MIME type; defaults to image/jpeg to drop EXIF and shrink size. */
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
};

/**
 * Strip EXIF metadata (incl. GPS) and downscale/compress an image entirely on
 * the client by re-encoding it through a canvas. Re-encoding discards all
 * original metadata, so no GPS or camera info reaches the server.
 *
 * Browser-only: relies on `createImageBitmap`/`HTMLCanvasElement`.
 */
export async function stripExifAndCompress(
  file: File,
  options: ProcessImageOptions = {},
): Promise<File> {
  const {
    maxDimension = RECOMMENDED_IMAGE_DIMENSION,
    outputType = "image/jpeg",
    quality = 0.9,
  } = options;

  const bitmap = await createImageBitmap(file);
  const { width, height } = computeScaledDimensions(
    bitmap.width,
    bitmap.height,
    maxDimension,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, quality),
  );
  if (!blob) {
    throw new Error("Image encoding failed");
  }

  const extension = outputType.split("/")[1] ?? "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${extension}`, { type: outputType });
}

/** Read an image File's intrinsic dimensions (browser-only). */
export async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

export { MAX_IMAGE_BYTES };
