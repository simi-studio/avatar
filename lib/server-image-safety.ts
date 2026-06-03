function isMetadataMarker(marker: number): boolean {
  return marker === 0xe1 || marker === 0xed;
}

function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;

  const chunks: Uint8Array[] = [bytes.slice(0, 2)];
  let offset = 2;

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      chunks.push(bytes.slice(offset));
      break;
    }

    const marker = bytes[offset + 1];
    if (typeof marker !== "number") {
      chunks.push(bytes.slice(offset));
      break;
    }
    if (marker === 0xda) {
      chunks.push(bytes.slice(offset));
      break;
    }

    if (marker === 0xd9) {
      chunks.push(bytes.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    const lengthHigh = bytes[offset + 2];
    const lengthLow = bytes[offset + 3];
    if (typeof lengthHigh !== "number" || typeof lengthLow !== "number") {
      chunks.push(bytes.slice(offset));
      break;
    }
    const segmentLength = (lengthHigh << 8) | lengthLow;
    if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) {
      chunks.push(bytes.slice(offset));
      break;
    }

    const nextOffset = offset + 2 + segmentLength;
    if (!isMetadataMarker(marker)) {
      chunks.push(bytes.slice(offset, nextOffset));
    }
    offset = nextOffset;
  }

  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const stripped = new Uint8Array(length);
  let writeOffset = 0;
  for (const chunk of chunks) {
    stripped.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }
  return stripped;
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }
  if (typeof FileReader === "function") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("read failed"));
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
          return;
        }
        reject(new Error("unexpected file reader result"));
      };
      reader.readAsArrayBuffer(file);
    });
  }
  return new Response(file).arrayBuffer();
}

/** Remove server-visible metadata before forwarding uploads to providers. */
export async function stripImageMetadata(file: File): Promise<File> {
  if (file.type !== "image/jpeg") return file;

  const stripped = stripJpegMetadata(new Uint8Array(await readFileBytes(file)));
  const body = new ArrayBuffer(stripped.byteLength);
  new Uint8Array(body).set(stripped);
  return new File([body], file.name || "image.jpg", { type: file.type });
}
