import { VALIDATION_CONFIG } from "@mailfail/shared";
import type { LinkCheckEntry } from "@mailfail/shared";

export async function checkLinks(html: string): Promise<LinkCheckEntry[]> {
  const hrefRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  const urls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith("http://") || url.startsWith("https://")) {
      urls.add(url);
    }
  }

  const results: LinkCheckEntry[] = [];

  await Promise.all(
    [...urls].map(async (originalUrl) => {
      const start = Date.now();
      const redirectChain: string[] = [];
      let currentUrl = originalUrl;
      let statusCode: number | null = null;
      let finalUrl: string | null = null;

      try {
        for (let i = 0; i < VALIDATION_CONFIG.linkCheck.maxRedirects; i++) {
          const response = await fetch(currentUrl, {
            method: "HEAD",
            redirect: "manual",
            signal: AbortSignal.timeout(VALIDATION_CONFIG.linkCheck.timeoutMs),
          });

          statusCode = response.status;

          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) break;
            redirectChain.push(currentUrl);
            currentUrl = new URL(location, currentUrl).toString();
          } else {
            break;
          }
        }

        finalUrl = currentUrl;
        const responseTimeMs = Date.now() - start;

        let severity: LinkCheckEntry["severity"] = "info";
        let message = `OK (${statusCode})`;

        if (statusCode && statusCode >= 400) {
          severity = "error";
          message = `HTTP ${statusCode}`;
        } else if (
          redirectChain.length > 0 &&
          new URL(finalUrl).hostname !== new URL(originalUrl).hostname
        ) {
          severity = "warning";
          message = `Redirects to different domain: ${new URL(finalUrl).hostname}`;
        } else if (responseTimeMs > VALIDATION_CONFIG.linkCheck.slowThresholdMs) {
          severity = "info";
          message = `Slow response (${responseTimeMs}ms)`;
        }

        results.push({
          severity,
          message,
          element: `<a href="${originalUrl}">`,
          originalUrl,
          finalUrl,
          statusCode,
          redirectChain,
          responseTimeMs,
        });
      } catch (err) {
        results.push({
          severity: "error",
          message: `Failed to reach: ${(err as Error).message}`,
          element: `<a href="${originalUrl}">`,
          originalUrl,
          finalUrl: null,
          statusCode: null,
          redirectChain,
          responseTimeMs: null,
        });
      }
    }),
  );

  return results;
}
