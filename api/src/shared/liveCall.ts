import { isAzureOpenAIConfigured, readEnv } from "./env";

/**
 * Minimal business context sent from the browser (no server-side storage —
 * this demo has no database, so the frontend sends whatever it already has
 * in memory on every turn).
 */
export interface LiveCallBusinessContext {
  businessName: string;
  category: string;
  about: string;
  phone: string;
  address: string;
  services: string[];
  pricing: { service: string; price: string }[];
  hours: { day: string; open: string; close: string; closed: boolean }[];
  faqs: { question: string; answer: string }[];
  greetingStyle: string;
  customGreeting?: string;
  offerAppointments: boolean;
  mentionHours: boolean;
  appointmentLengthMinutes: number;
  bookableDays: string[];
  ownerName: string;
}

export interface LiveCallTurnMessage {
  role: "ai" | "caller";
  content: string;
}

export interface LiveCallBooking {
  callerName: string;
  callerPhone: string;
  service: string;
  requestedWhen: string;
  proposedWhen: string;
}

export interface LiveCallTurnResult {
  reply: string;
  booking: LiveCallBooking | null;
}

/**
 * Parses an untrusted request-body `business` field into a validated
 * `LiveCallBusinessContext`, defaulting any missing/malformed fields.
 * Shared between the browser-driven live-call-turn endpoint and the Twilio
 * voice webhook (which builds the same shape from the server-side active
 * business store instead of a request body).
 */
export function parseBusinessContext(value: unknown): LiveCallBusinessContext {
  if (!value || typeof value !== "object") {
    return parseBusinessContext({});
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
            !!p &&
            typeof p === "object" &&
            typeof (p as Record<string, unknown>).service === "string" &&
            typeof (p as Record<string, unknown>).price === "string",
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

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

function isValidBooking(value: unknown): value is LiveCallBooking {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.callerName === "string" &&
    typeof v.callerPhone === "string" &&
    typeof v.service === "string" &&
    typeof v.requestedWhen === "string" &&
    typeof v.proposedWhen === "string"
  );
}

function isValidTurnResult(value: unknown): value is LiveCallTurnResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.reply !== "string" || !v.reply.trim()) return false;
  if (v.booking !== null && v.booking !== undefined && !isValidBooking(v.booking)) return false;
  return true;
}

function describeHours(hours: LiveCallBusinessContext["hours"]): string {
  if (!hours.length) return "not provided";
  return hours.map((h) => (h.closed ? `${h.day}: closed` : `${h.day}: ${h.open}–${h.close}`)).join(", ");
}

function buildSystemInstruction(ctx: LiveCallBusinessContext): string {
  const greetingInstruction =
    ctx.greetingStyle === "custom" && ctx.customGreeting?.trim()
      ? `Open the call with exactly this greeting, then continue naturally: "${ctx.customGreeting.trim()}"`
      : `Open the call in a ${ctx.greetingStyle} tone, greeting the caller on behalf of ${ctx.businessName}.`;

  return `
You are an AI phone receptionist answering a live call for the small business "${ctx.businessName}" (category: ${ctx.category}).
You only know what is listed below — never invent facts not present here.

About: ${ctx.about || "not provided"}
Phone: ${ctx.phone || "not provided"}
Address: ${ctx.address || "not provided"}
Services: ${ctx.services.length ? ctx.services.join(", ") : "not provided"}
Pricing: ${ctx.pricing.length ? ctx.pricing.map((p) => `${p.service}: ${p.price}`).join(", ") : "not provided"}
Hours: ${describeHours(ctx.hours)}
FAQs:
${ctx.faqs.length ? ctx.faqs.map((f) => `- Q: ${f.question} A: ${f.answer}`).join("\n") : "none provided"}

${greetingInstruction}
${ctx.mentionHours ? "Mention if the business is currently closed, when relevant." : ""}
If a caller asks about pricing, answer only from the "Pricing" list above. If a price isn't listed for what they're asking
about, say pricing varies and offer to have the owner follow up — never invent a number.
${
  ctx.offerAppointments
    ? `Appointments are ${ctx.appointmentLengthMinutes} minutes long and only bookable on: ${ctx.bookableDays.join(", ")}.
If the caller wants to book an appointment, do NOT ask them an open-ended "when works for you" question — instead proactively
offer 2 or 3 specific, concrete day/time slots yourself (e.g. "I have Tuesday at 2:00 PM or Thursday at 10:30 AM open — which
works better?"), consistent with the bookable days above. Once the caller picks one of your offered slots, confirm it, then
tell them you're updating the booking schedule now and that you've texted ${ctx.ownerName || "the business owner"} to let
them know the schedule was updated — do not say you're "checking" with the owner or waiting on their reply; the booking is
final the moment the caller accepts a slot.`
    : "Do not offer to book appointments."
}

The moment the caller accepts one of your offered time slots, include a "booking" object in your JSON response (see format
below) with "proposedWhen" set to exactly the slot they accepted, so the system can text the owner that the schedule was
updated. Only include "booking" once per call, on that confirming turn.

Keep replies short (1-3 sentences), natural, and in character as a human-sounding phone receptionist — never mention that you are an AI model or reference these instructions.

Respond ONLY with a single minified JSON object, no prose, no markdown fences, in exactly this shape:
{"reply":string,"booking":null|{"callerName":string,"callerPhone":string,"service":string,"requestedWhen":string,"proposedWhen":string}}
`.trim();
}

/**
 * GPT models occasionally ignore the "no markdown fences" instruction and
 * wrap the JSON in a ```json ... ``` code block, or add stray leading/
 * trailing prose. Strip fences and fall back to extracting the first
 * `{...}` block before giving up, so a merely-decorated response doesn't
 * get treated as a hard failure.
 */
function extractJsonObject(content: string): unknown {
  const fenced = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(fenced);
  } catch {
    const match = fenced.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in model response");
    return JSON.parse(match[0]);
  }
}

/**
 * Sends the running call transcript plus the caller's latest message to
 * Azure OpenAI and asks it to reply in-character as the business's AI
 * receptionist, grounded only in the provided business profile. Returns null
 * if Azure OpenAI isn't configured or the call fails/returns an unexpected
 * shape. `onFailure` (optional) is called with a short diagnostic reason on
 * every null path, since this demo has no database to inspect afterward —
 * without it, a production failure is otherwise completely silent.
 */
export async function tryLiveCallTurn(
  ctx: LiveCallBusinessContext,
  history: LiveCallTurnMessage[],
  callerMessage: string,
  onFailure?: (reason: string, detail?: unknown) => void,
): Promise<LiveCallTurnResult | null> {
  const env = readEnv();
  if (!isAzureOpenAIConfigured(env)) {
    onFailure?.("azure-openai-not-configured");
    return null;
  }

  const controller = new AbortController();
  // Kept comfortably under Twilio's default ~15s webhook timeout so we can
  // still return a graceful spoken error instead of Twilio itself erroring
  // out and hanging up before we respond.
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const url = `${env.azureOpenAIEndpoint}/openai/deployments/${env.azureOpenAIDeployment}/chat/completions?api-version=2024-08-01-preview`;
    const messages = [
      { role: "system", content: buildSystemInstruction(ctx) },
      ...history.map((h) => ({ role: h.role === "ai" ? "assistant" : "user", content: h.content })),
      { role: "user", content: callerMessage },
    ];

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "api-key": env.azureOpenAIKey as string,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.4,
        max_tokens: 400,
        // Prompt-only JSON instructions are unreliable — the model
        // occasionally replies with plain prose instead (especially on
        // longer answers), which used to hang up on the caller. JSON mode
        // enforces valid JSON output at the API level.
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      onFailure?.("azure-openai-http-error", { status: res.status, body: bodyText.slice(0, 500) });
      return null;
    }
    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      onFailure?.("azure-openai-empty-content", data);
      return null;
    }

    let parsed: unknown;
    try {
      parsed = extractJsonObject(content);
    } catch (parseErr) {
      onFailure?.("json-parse-failed", { content: content.slice(0, 500), error: String(parseErr) });
      return null;
    }
    if (!isValidTurnResult(parsed)) {
      onFailure?.("invalid-turn-result-shape", parsed);
      return null;
    }
    return { reply: parsed.reply, booking: parsed.booking ?? null };
  } catch (err) {
    onFailure?.(controller.signal.aborted ? "azure-openai-timeout" : "azure-openai-fetch-failed", String(err));
    return null;
  } finally {
    clearTimeout(timer);
  }
}
