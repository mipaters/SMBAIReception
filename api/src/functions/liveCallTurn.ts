import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { LiveCallTurnMessage } from "../shared/liveCall";
import { parseBusinessContext, tryLiveCallTurn } from "../shared/liveCall";
import { errorResponse, jsonResponse } from "../shared/http";
import { newCorrelationId, validateText, ValidationError } from "../shared/validation";

function parseHistory(value: unknown): LiveCallTurnMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is { role: unknown; content: unknown } => !!m && typeof m === "object")
    .filter((m) => (m.role === "ai" || m.role === "caller") && typeof m.content === "string")
    .map((m) => ({ role: m.role as "ai" | "caller", content: m.content as string }));
}

/**
 * Generates one turn of a live, interactive AI receptionist phone call,
 * grounded in the business profile/greeting/scheduling settings sent from the
 * browser (this demo has no database — the frontend is the source of truth).
 *
 * If Azure OpenAI isn't configured or the call fails, responds with
 * `available: false` so the frontend can show a clear "live AI call isn't
 * connected" message instead of breaking.
 */
export async function liveCallTurn(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const business = parseBusinessContext(body.business);
    const history = parseHistory(body.history);
    const callerMessage = validateText(body.callerMessage, "callerMessage");

    const result = await tryLiveCallTurn(business, history, callerMessage, (reason, detail) => {
      context.error("tryLiveCallTurn failed", { correlationId, reason, detail });
    });
    if (!result) {
      return jsonResponse(
        200,
        { available: false, reason: "Live AI call generation is not configured or failed." },
        correlationId,
      );
    }

    return jsonResponse(200, { available: true, reply: result.reply, booking: result.booking }, correlationId);
  } catch (err) {
    context.error("liveCallTurn failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("liveCallTurn", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "live-call-turn",
  handler: liveCallTurn,
});
