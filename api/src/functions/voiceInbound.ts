import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getActiveBusiness } from "../shared/activeBusinessStore";
import { tryLiveCallTurn } from "../shared/liveCall";
import { buildVoiceGreeting, escapeTwiml } from "../shared/voiceGreeting";
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

function sayAndGather(actionUrl: string, say: string, fallback: string): string {
  return (
    `<Say>${escapeTwiml(say)}</Say>` +
    `<Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" timeout="6" language="en-US"></Gather>` +
    `<Say>${escapeTwiml(fallback)}</Say>` +
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
    const origin = new URL(request.url).origin;
    const actionUrl = `${origin}/api/voice-inbound`;

    const activeEntry = getActiveBusiness();
    if (!activeEntry) {
      return twiml(
        `<Say>${escapeTwiml(
          "This demo line hasn't been set up yet. Please activate a business in the SMB AI Receptionist app, then call back.",
        )}</Say><Hangup/>`,
      );
    }
    const business = activeEntry.business;

    // First hit for this call: no caller speech yet — speak the greeting and
    // gather the caller's first words.
    if (!speechResult) {
      return twiml(
        sayAndGather(
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
        `<Say>${escapeTwiml(
          "Sorry, I'm having trouble right now. Please try calling back in a moment.",
        )}</Say><Hangup/>`,
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
      sayAndGather(actionUrl, result.reply, "Thanks for calling — have a great day! Goodbye."),
    );
  } catch (err) {
    context.error("voiceInbound failed", { error: err instanceof Error ? err.message : String(err) });
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
