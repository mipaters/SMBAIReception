import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseBusinessContext } from "../shared/liveCall";
import { setActiveBusiness } from "../shared/activeBusinessStore";
import { errorResponse, jsonResponse } from "../shared/http";
import { newCorrelationId, ValidationError } from "../shared/validation";

/**
 * Called automatically by the app whenever the presenter clicks "Activate"
 * in Setup or the Executive Demo. Persists the business profile/greeting/
 * scheduling server-side so the real Twilio phone number (which has no
 * browser in the loop) can answer calls grounded in the same data as the
 * in-app Live Call Simulator.
 */
export async function activateBusiness(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const correlationId = newCorrelationId();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const business = parseBusinessContext(body.business);
    const voiceGender = body.voiceGender === "male" ? "male" : "female";
    setActiveBusiness(business, voiceGender);
    return jsonResponse(200, { ok: true }, correlationId);
  } catch (err) {
    context.error("activateBusiness failed", { correlationId, errorType: err instanceof ValidationError ? "validation" : "unexpected" });
    return errorResponse(err, correlationId);
  }
}

app.http("activateBusiness", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "activate-business",
  handler: activateBusiness,
});
