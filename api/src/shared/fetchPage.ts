const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 1_500_000; // 1.5MB cap so a huge page can't blow up memory/latency
const MAX_TEXT_CHARS = 12_000; // trimmed further before being sent to the model

export class PageFetchError extends Error {}

/** Fetches a public web page server-side (avoids browser CORS) and returns its raw HTML. */
export async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SMBAIReceptionistDemoBot/1.0; +https://github.com/mipaters/SMBAIReception)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new PageFetchError(`Website responded with status ${res.status}.`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new PageFetchError("Website did not return an HTML page.");
    }

    const reader = res.body?.getReader();
    if (!reader) return await res.text();

    let received = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_HTML_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  } catch (err) {
    if (err instanceof PageFetchError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new PageFetchError("Timed out while fetching the website.");
    }
    throw new PageFetchError("Could not reach the website.");
  } finally {
    clearTimeout(timer);
  }
}

/** Strips scripts/styles/tags and collapses whitespace to produce plain text suitable for an LLM prompt. */
export function htmlToPlainText(html: string): string {
  const withoutNonContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const text = withoutNonContent
    .replace(/<(br|p|div|li|h[1-6]|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.slice(0, MAX_TEXT_CHARS);
}
