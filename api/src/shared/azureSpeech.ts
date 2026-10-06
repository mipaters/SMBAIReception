import { isAzureSpeechConfigured, readEnv } from "./env";

/**
 * Azure AI Speech text-to-speech. Used to give the voice receptionist an
 * Azure Neural voice instead of Twilio's built-in <Say> voice, so the voice
 * cost is billed through Azure (same subscription as the other demos)
 * rather than through Twilio.
 *
 * Twilio still carries the call itself (PSTN connectivity, <Gather>
 * speech-to-text) — only the spoken reply audio is swapped out for an
 * Azure-synthesized MP3 that Twilio fetches via <Play>.
 */

const DEFAULT_VOICE = "en-US-JennyNeural";
const TOKEN_TTL_MS = 9 * 60 * 1000; // Azure STS tokens are valid ~10 minutes.

let cachedToken: { token: string; region: string; expiresAt: number } | null = null;

async function getAccessToken(key: string, region: string): Promise<string> {
  if (cachedToken && cachedToken.region === region && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": key, "Content-Length": "0" },
  });
  if (!res.ok) {
    throw new Error(`Azure Speech token request failed: ${res.status}`);
  }
  const token = await res.text();
  cachedToken = { token, region, expiresAt: Date.now() + TOKEN_TTL_MS };
  return token;
}

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Returns an MP3 buffer for the given text, or null if Azure Speech isn't
 * configured (callers should fall back to Twilio's own <Say> in that case).
 */
export async function synthesizeSpeech(text: string): Promise<Buffer | null> {
  const env = readEnv();
  if (!isAzureSpeechConfigured(env)) return null;

  const key = env.azureSpeechKey as string;
  const region = env.azureSpeechRegion as string;
  const voice = env.azureSpeechVoice || DEFAULT_VOICE;

  const token = await getAccessToken(key, region);
  const ssml = `<speak version="1.0" xml:lang="en-US"><voice xml:lang="en-US" name="${voice}">${escapeSsml(
    text,
  )}</voice></speak>`;

  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
      "User-Agent": "smb-ai-receptionist-demo",
    },
    body: ssml,
  });
  if (!res.ok) {
    throw new Error(`Azure Speech synthesis failed: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
