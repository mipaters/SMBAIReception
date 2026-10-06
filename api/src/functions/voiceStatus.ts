import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getActiveBusiness } from "../shared/activeBusinessStore";
import { getCallHistory, hasBooked, queueRealCallEvent } from "../shared/voiceCallStore";

/**
 * Twilio "Call Status Changes" webhook (configure alongside the voice
 * webhook in the Twilio Console). When a real call completes, logs a
 * call-summary event that the app picks up via `/api/recent-voice-activity`
 * and adds to Call History, alongside any booking already queued by
 * `voiceInbound`.
 */
export async function voiceStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const form = await request.formData();
    const callSid = String(form.get("CallSid") ?? "");
    const callStatus = String(form.get("CallStatus") ?? "");
    const callerNumber = String(form.get("From") ?? "unknown caller");

    if (callStatus === "completed" && callSid) {
      const activeEntry = getActiveBusiness();
      const transcript = getCallHistory(callSid);
      if (activeEntry && transcript.length > 0) {
        queueRealCallEvent({
          kind: "call-summary",
          callSid,
          businessName: activeEntry.business.businessName,
          callerNumber,
          booked: hasBooked(callSid),
          transcript,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return { status: 204 };
  } catch (err) {
    context.error("voiceStatus failed", { error: err instanceof Error ? err.message : String(err) });
    return { status: 204 };
  }
}

app.http("voiceStatus", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "voice-status",
  handler: voiceStatus,
});
