import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tryAzureOpenAIExtraction } from "../shared/azureOpenAI";
import { fetchPageHtml, htmlToPlainText, PageFetchError } from "../shared/fetchPage";
import { errorResponse, jsonResponse } from "../shared/http";
import { newCorrelationId, validateText, validateWebsite, ValidationError } from "../shared/validation";

/**
 * Fetches a real public business website server-side (to avoid browser CORS
 * restrictions), strips it to plain text, and asks Azure OpenAI to extract a
 * structured business profile (hours, services, FAQs, etc).
 *
 * If Azure OpenAI isn't configured, or the fetch/extraction fails for any
 * reason, responds with `source: "unavailable"` so the frontend can fall back
 * to its local deterministic simulation — the Setup wizard always works.
 */
export async function scrapeBusinessSite(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const businessName = validateText(body.businessName, "businessName");
    const website = validateWebsite(body.website, "website");

    let pageText: string;
    try {
      const html = await fetchPageHtml(website);
      pageText = htmlToPlainText(html);
    } catch (err) {
      const message = err instanceof PageFetchError ? err.message : "Could not fetch the website.";
      return jsonResponse(200, { source: "unavailable", reason: message }, correlationId);
    }

    if (!pageText || pageText.length < 40) {
      return jsonResponse(200, { source: "unavailable", reason: "The website returned little or no readable text." }, correlationId);
    }

    const extracted = await tryAzureOpenAIExtraction(businessName, website, pageText);
    if (!extracted) {
      return jsonResponse(200, { source: "unavailable", reason: "AI extraction is not configured or failed." }, correlationId);
    }

    return jsonResponse(200, { source: "azure", profile: extracted }, correlationId);
  } catch (err) {
    context.error("scrapeBusinessSite failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("scrapeBusinessSite", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "scrape-business-site",
  handler: scrapeBusinessSite,
});
