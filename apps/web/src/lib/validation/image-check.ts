import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { ImageCheckEntry } from "@mailfail/shared";

export async function checkImages(html: string): Promise<ImageCheckEntry[]> {
  const imgRegex = /<img[^>]*>/gi;
  const srcRegex = /src=["']([^"']+)["']/i;
  const widthRegex = /width=/i;
  const heightRegex = /height=/i;

  const results: ImageCheckEntry[] = [];
  let match: RegExpExecArray | null;

  const images: { src: string; tag: string; hasDimensions: boolean }[] = [];

  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = srcRegex.exec(tag);
    if (!srcMatch) continue;
    const src = srcMatch[1];
    if (!src.startsWith("http://") && !src.startsWith("https://")) continue;

    images.push({
      src,
      tag,
      hasDimensions: widthRegex.test(tag) && heightRegex.test(tag),
    });
  }

  await Promise.all(
    images.map(async ({ src, tag, hasDimensions }) => {
      try {
        const response = await fetch(src, {
          method: "HEAD",
          signal: AbortSignal.timeout(VALIDATION_CONFIG.linkCheck.timeoutMs),
        });

        const contentLength = response.headers.get("content-length");
        const sizeBytes = contentLength ? parseInt(contentLength, 10) : null;

        const entry: ImageCheckEntry = {
          severity: "info",
          message: "OK",
          element: tag,
          src,
          reachable: response.ok,
          sizeBytes,
          hasDimensions,
        };

        if (!response.ok) {
          entry.severity = "error";
          entry.message = `Unreachable (HTTP ${response.status})`;
        } else if (sizeBytes && sizeBytes > VALIDATION_CONFIG.imageCheck.oversizeThresholdBytes) {
          entry.severity = "warning";
          entry.message = `Oversized image (${(sizeBytes / 1024 / 1024).toFixed(1)} MB)`;
        } else if (!hasDimensions) {
          entry.severity = "info";
          entry.message = "Missing width/height attributes";
        }

        results.push(entry);
      } catch {
        results.push({
          severity: "error",
          message: "Failed to reach image",
          element: tag,
          src,
          reachable: false,
          sizeBytes: null,
          hasDimensions,
        });
      }
    }),
  );

  return results;
}
