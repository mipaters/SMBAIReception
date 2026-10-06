import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getActiveBusiness } from "../shared/activeBusinessStore";
import { tryLiveCallTurn } from "../shared/liveCall";
import { buildVoiceGreeting, escapeTwiml } from "../shared/voiceGreeting";
import { isAzureSpeechConfigured } from "../shared/env";
import {
  appendCallTurn,
  getCallHistory,
  hasBooked,
  markBooked,
  queueRealCallEvent,
} from "../shared/voiceCallStore";

function twiml(body: string): HttpResponseInit {
  return {
    status: 200,
    body: `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    headers: { "Content-Type": "text/xml" },
  };
}

/**
 * Speaks `text` using an Azure Neural voice (<Play>, fetched from our own
 * /api/voice-audio endpoint) when Azure Speech is configured, otherwise
 * falls back to Twilio's built-in <Say> voice. The choice is made up front
 * from env vars (cheap, synchronous) — the actual speech synthesis happens
 * later when Twilio fetches the <Play> URL, so it never adds latency to
 * this webhook's own response.
 */
function voiceTag(origin: string, text: string): string {
  if (isAzureSpeechConfigured()) {
    const playUrl = `${origin}/api/voice-audio?text=${encodeURIComponent(text)}`;
    return `<Play>${escapeTwiml(playUrl)}</Play>`;
  }
  return `<Say>${escapeTwiml(text)}</Say>`;
}

function sayAndGather(origin: string, actionUrl: string, say: string, fallback: string): string {
  return (
    voiceTag(origin, say) +
    `<Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" timeout="6" language="en-US"></Gather>` +
    voiceTag(origin, fallback) +
    `<Hangup/>`
  );
}

/**
 * Twilio Voice webhook — point the demo phone number's "A call comes in"
 * setting at this endpoint. Twilio itself handles telephony, speech-to-text
 * (via <Gather input="speech">), and text-to-speech (via <Say>); this
 * handler supplies the AI "brain" by reusing the exact same
 * `tryLiveCallTurn` logic as the in-app Live Call Simulator, grounded in
 * whichever business was last activated in the app.
 */
export async function voiceInbound(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const form = await request.formData();
    const callSid = String(form.get("CallSid") ?? "");
    const speechResult = String(form.get("SpeechResult") ?? "").trim();
    // Azure Static Web Apps' managed Functions run behind a proxy, so
    // request.url exposes the *internal* azurewebsites.net origin — Twilio
    // can't call back to that for the next turn. The proxy forwards the
    // public host/protocol via X-Forwarded-Host/Proto, so prefer those and
    // only fall back to request.url's origin for local dev (no proxy).
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin;
    const actionUrl = `${origin}/api/voice-inbound`;

    const activeEntry = getActiveBusiness();
    if (!activeEntry) {
      return twiml(
        voiceTag(
          origin,
          "This demo line hasn't been set up yet. Please activate a business in the SMB AI Receptionist app, then call back.",
        ) + `<Hangup/>`,
      );
    }
    const business = activeEntry.business;

    // First hit for this call: no caller speech yet — speak the greeting and
    // gather the caller's first words.
    if (!speechResult) {
      return twiml(
        sayAndGather(
          origin,
          actionUrl,
          buildVoiceGreeting(business),
          "I didn't catch anything — please call back anytime. Goodbye!",
        ),
      );
    }

    const history = getCallHistory(callSid);
    const result = await tryLiveCallTurn(business, history, speechResult);

    if (!result) {
      return twiml(
        voiceTag(origin, "Sorry, I'm having trouble right now. Please try calling back in a moment.") +
          `<Hangup/>`,
      );
    }

    appendCallTurn(callSid, speechResult, result.reply);

    if (result.booking && !hasBooked(callSid)) {
      markBooked(callSid);
      queueRealCallEvent({
        kind: "booking",
        callSid,
        businessName: business.businessName,
        booking: result.booking,
        ownerName: business.ownerName,
        createdAt: new Date().toISOString(),
      });
    }

    return twiml(
      sayAndGather(origin, actionUrl, result.reply, "Thanks for calling — have a great day! Goodbye."),
    );
  } catch (err) {
    context.error("voiceInbound failed", { error: err instanceof Error ? err.message : String(err) });
    // Deliberately plain <Say> here (not voiceTag/<Play>) — this is the
    // last-resort error path, so it shouldn't depend on another network call
    // (Azure Speech synthesis) succeeding.
    return twiml(
      `<Say>${escapeTwiml("Sorry, something went wrong on our end. Please try calling back.")}</Say><Hangup/>`,
    );
  }
}

app.http("voiceInbound", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "voice-inbound",
  handler: voiceInbound,
});
