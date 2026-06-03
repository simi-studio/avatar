import { describe, expect, it } from "vitest";

import { stripImageMetadata } from "@/lib/server-image-safety";

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("unexpected result"));
    };
    reader.readAsArrayBuffer(file);
  });
}

describe("stripImageMetadata", () => {
  it("removes JPEG APP1 EXIF segments without changing the image type", async () => {
    const bytes = new Uint8Array([
      0xff,
      0xd8,
      0xff,
      0xe1,
      0x00,
      0x08,
      0x45,
      0x78,
      0x69,
      0x66,
      0x00,
      0x00,
      0xff,
      0xda,
      0x00,
      0x04,
      0x11,
      0x22,
      0xff,
      0xd9,
    ]);
    const file = new File([bytes], "portrait.jpg", { type: "image/jpeg" });

    const stripped = await stripImageMetadata(file);
    const strippedBytes = new Uint8Array(await readFileBytes(stripped));

    expect(stripped.type).toBe("image/jpeg");
    expect(stripped.name).toBe("portrait.jpg");
    expect([...strippedBytes]).toEqual([
      0xff,
      0xd8,
      0xff,
      0xda,
      0x00,
      0x04,
      0x11,
      0x22,
      0xff,
      0xd9,
    ]);
  });
});
