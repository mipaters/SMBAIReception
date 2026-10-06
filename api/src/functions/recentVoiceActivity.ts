import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drainRealCallEvents } from "../shared/voiceCallStore";
import { jsonResponse } from "../shared/http";
import { newCorrelationId } from "../shared/validation";

/**
 * Polled periodically by the app while active. Real phone calls through the
 * Twilio number happen with no browser in the loop, so bookings and
 * completed-call summaries are buffered server-side and delivered here,
 * then merged into the same Appointments/Call History views the in-app Live
 * Call Simulator populates. Each event is returned at most once.
 */
export async function recentVoiceActivity(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const events = drainRealCallEvents();
  return jsonResponse(200, { events }, newCorrelationId());
}

app.http("recentVoiceActivity", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "recent-voice-activity",
  handler: recentVoiceActivity,
});
