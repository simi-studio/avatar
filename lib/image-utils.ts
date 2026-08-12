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
  // JPEG has no alpha channel. Composite transparency onto white explicitly so
  // transparent PNG/WebP uploads do not acquire an unexpected black backdrop.
  if (outputType === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
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

/**
 * Mean luma (0–255) from packed RGBA samples. Pure and unit-testable.
 * Multimodal probes: underexposed references lose likeness under restyle.
 */
export function meanLumaFromRgba(
  data: ArrayLike<number>,
  sampleStride = 16,
): number {
  if (data.length < 4) return 0;
  const step = Math.max(1, sampleStride) * 4;
  let sum = 0;
  let count = 0;
  for (let i = 0; i + 3 < data.length; i += step) {
    const alpha = (data[i + 3] ?? 255) / 255;
    // Match JPEG preprocessing by compositing transparent samples onto white.
    const r = (data[i] ?? 0) * alpha + 255 * (1 - alpha);
    const g = (data[i + 1] ?? 0) * alpha + 255 * (1 - alpha);
    const b = (data[i + 2] ?? 0) * alpha + 255 * (1 - alpha);
    // Rec. 601 luma
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
    count += 1;
  }
  return count === 0 ? 0 : sum / count;
}

/**
 * Sample mean image luminance via a downscaled canvas (browser-only).
 * Used for soft underexposure / overexposure guidance — not a hard reject.
 */
export async function sampleImageLuminance(file: File): Promise<number> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 64;
  const { width, height } = computeScaledDimensions(
    bitmap.width,
    bitmap.height,
    maxSide,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return meanLumaFromRgba(data, 1);
}

export { MAX_IMAGE_BYTES };
