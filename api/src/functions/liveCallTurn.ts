import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { LiveCallBusinessContext, LiveCallTurnMessage } from "../shared/liveCall";
import { tryLiveCallTurn } from "../shared/liveCall";
import { errorResponse, jsonResponse } from "../shared/http";
import { newCorrelationId, validateText, ValidationError } from "../shared/validation";

function parseBusinessContext(value: unknown): LiveCallBusinessContext {
  if (!value || typeof value !== "object") {
    throw new ValidationError("business must be an object.");
  }
  const v = value as Record<string, unknown>;
  return {
    businessName: typeof v.businessName === "string" ? v.businessName : "the business",
    category: typeof v.category === "string" ? v.category : "other",
    about: typeof v.about === "string" ? v.about : "",
    phone: typeof v.phone === "string" ? v.phone : "",
    address: typeof v.address === "string" ? v.address : "",
    services: Array.isArray(v.services) ? v.services.filter((s): s is string => typeof s === "string") : [],
    pricing: Array.isArray(v.pricing)
      ? v.pricing.filter(
          (p): p is { service: string; price: string } =>
            !!p && typeof p === "object" && typeof (p as Record<string, unknown>).service === "string" && typeof (p as Record<string, unknown>).price === "string",
        )
      : [],
    hours: Array.isArray(v.hours) ? (v.hours as LiveCallBusinessContext["hours"]) : [],
    faqs: Array.isArray(v.faqs) ? (v.faqs as LiveCallBusinessContext["faqs"]) : [],
    greetingStyle: typeof v.greetingStyle === "string" ? v.greetingStyle : "friendly",
    customGreeting: typeof v.customGreeting === "string" ? v.customGreeting : "",
    offerAppointments: Boolean(v.offerAppointments),
    mentionHours: Boolean(v.mentionHours),
    appointmentLengthMinutes: typeof v.appointmentLengthMinutes === "number" ? v.appointmentLengthMinutes : 30,
    bookableDays: Array.isArray(v.bookableDays) ? v.bookableDays.filter((d): d is string => typeof d === "string") : [],
    ownerName: typeof v.ownerName === "string" ? v.ownerName : "",
  };
}

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

    const result = await tryLiveCallTurn(business, history, callerMessage);
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
