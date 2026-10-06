import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { synthesizeSpeech } from "../shared/azureSpeech";

/**
 * Serves synthesized speech audio for Twilio's <Play> verb. The text to
 * speak is passed as a query param (?text=...) so this endpoint stays
 * stateless — safe even if Twilio's request lands on a different Azure
 * Functions instance than the one that built the TwiML (the same
 * multi-instance risk documented for activeBusinessStore).
 */
export async function voiceAudio(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const url = new URL(request.url);
  const text = (url.searchParams.get("text") ?? "").trim();
  if (!text) {
    return { status: 400, body: "Missing text query parameter" };
  }

  try {
    const audio = await synthesizeSpeech(text);
    if (!audio) {
      return { status: 404, body: "Azure Speech is not configured" };
    }
    return {
      status: 200,
      body: audio,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    };
  } catch (err) {
    context.error("voiceAudio failed", { error: err instanceof Error ? err.message : String(err) });
    return { status: 500, body: "Speech synthesis failed" };
  }
}

app.http("voiceAudio", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "voice-audio",
  handler: voiceAudio,
});
