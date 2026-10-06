import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { isAzureOpenAIConfigured, isAzureSpeechConfigured, readEnv } from "../shared/env";
import { jsonResponse } from "../shared/http";

export async function demoStatus(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const env = readEnv();
  const openAIConfigured = isAzureOpenAIConfigured(env);
  const speechConfigured = isAzureSpeechConfigured(env);

  const message = openAIConfigured
    ? "Azure OpenAI is configured. Website scraping runs in Connected Mode (real fetch + AI extraction)."
    : "Azure OpenAI is not configured. Website scraping runs in Simulation Mode with a deterministic template.";

  return jsonResponse(200, {
    mode: openAIConfigured ? "connected" : "simulation",
    azureOpenAIConfigured: openAIConfigured,
    azureSpeechConfigured: speechConfigured,
    message,
  });
}

app.http("demoStatus", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "demo-status",
  handler: demoStatus,
});
