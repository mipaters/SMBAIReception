import type { BusinessHours, BusinessProfile, DemoStatus, GreetingSettings, SchedulingSettings } from "../types";

const API_TIMEOUT_MS = 20000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = API_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let cachedStatus: DemoStatus | null = null;

/** Determine Connected / Simulation mode by pinging the API's demo-status route. */
export async function getDemoStatus(): Promise<DemoStatus> {
  if (cachedStatus) return cachedStatus;
  try {
    const res = await fetchWithTimeout("/api/demo-status", { method: "GET" }, 3500);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as DemoStatus;
    cachedStatus = data;
    return data;
  } catch {
    const fallback: DemoStatus = {
      mode: "simulation",
      azureOpenAIConfigured: false,
      azureSpeechConfigured: false,
      message:
        "Running in Simulation Mode. The API or Azure OpenAI is unavailable, so website scraping uses a deterministic template.",
    };
    cachedStatus = fallback;
    return fallback;
  }
}

export function resetDemoStatusCache() {
  cachedStatus = null;
}

interface ScrapeApiResponse {
  source: "azure" | "unavailable";
  reason?: string;
  profile?: {
    category: BusinessProfile["category"];
    phone: string;
    address: string;
    about: string;
    services: string[];
    pricing: BusinessProfile["pricing"];
    hours: BusinessHours[];
    faqs: BusinessProfile["faqs"];
  };
}

export interface ScrapeBusinessSiteResult {
  source: "azure" | "unavailable";
  reason?: string;
  profile?: Omit<BusinessProfile, "businessName" | "website" | "scrapedAt">;
}

/**
 * Asks the API to really fetch `website` server-side and extract a structured
 * business profile via Azure OpenAI. If the API isn't reachable or isn't
 * configured, resolves with `source: "unavailable"` so the caller can fall
 * back to the local deterministic simulation in `engine/scrapeEngine.ts`.
 */
export async function scrapeBusinessSite(businessName: string, website: string): Promise<ScrapeBusinessSiteResult> {
  try {
    const res = await fetchWithTimeout("/api/scrape-business-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, website }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as ScrapeApiResponse;
    return data;
  } catch {
    return { source: "unavailable", reason: "Could not reach the API." };
  }
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

interface LiveCallTurnApiResponse {
  available: boolean;
  reason?: string;
  reply?: string;
  booking?: LiveCallBooking | null;
}

export interface LiveCallTurnResult {
  available: boolean;
  reason?: string;
  reply?: string;
  booking?: LiveCallBooking | null;
}

function buildBusinessPayload(profile: BusinessProfile, greeting: GreetingSettings, scheduling: SchedulingSettings) {
  return {
    businessName: profile.businessName,
    category: profile.category,
    about: profile.about,
    phone: profile.phone,
    address: profile.address,
    services: profile.services,
    pricing: profile.pricing,
    hours: profile.hours,
    faqs: profile.faqs,
    greetingStyle: greeting.style,
    customGreeting: greeting.customGreeting,
    offerAppointments: greeting.offerAppointments,
    mentionHours: greeting.mentionHours,
    appointmentLengthMinutes: scheduling.appointmentLengthMinutes,
    bookableDays: scheduling.bookableDays,
    ownerName: scheduling.ownerName,
  };
}

/**
 * Called when the presenter activates a business, so the real Twilio phone
 * number (which has no browser in the loop) can answer calls grounded in
 * the same profile/greeting/scheduling as the in-app Live Call Simulator.
 */
export async function activateBusinessOnServer(
  profile: BusinessProfile,
  greeting: GreetingSettings,
  scheduling: SchedulingSettings,
): Promise<void> {
  try {
    await fetchWithTimeout("/api/activate-business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: buildBusinessPayload(profile, greeting, scheduling),
        voiceGender: greeting.voiceGender,
      }),
    });
  } catch {
    // Best-effort — if this fails, the real phone number just won't be live;
    // the in-app Live Call Simulator is unaffected either way.
  }
}

export interface RealCallBookingEvent {
  kind: "booking";
  callSid: string;
  businessName: string;
  booking: LiveCallBooking;
  ownerName: string;
  createdAt: string;
}

export interface RealCallSummaryEvent {
  kind: "call-summary";
  callSid: string;
  businessName: string;
  callerNumber: string;
  booked: boolean;
  transcript: LiveCallTurnMessage[];
  createdAt: string;
}

export type RealCallEvent = RealCallBookingEvent | RealCallSummaryEvent;

/**
 * Polls for any bookings/call summaries generated by real phone calls to the
 * Twilio demo number since the last poll, so they can be merged into the
 * same Appointments/Call History views the in-app simulator populates.
 */
export async function fetchRecentVoiceActivity(): Promise<RealCallEvent[]> {
  try {
    const res = await fetchWithTimeout("/api/recent-voice-activity", { method: "GET" }, 5000);
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: RealCallEvent[] };
    return data.events ?? [];
  } catch {
    return [];
  }
}

/**
 * Sends the running call transcript plus the caller's latest message to the
 * API, which asks Azure OpenAI to generate one in-character receptionist
 * reply grounded in the given business/greeting/scheduling settings. If
 * Azure OpenAI isn't configured or the API is unreachable, resolves with
 * `available: false` so the UI can show a clear message instead of breaking.
 */
export async function sendLiveCallTurn(
  profile: BusinessProfile,
  greeting: GreetingSettings,
  scheduling: SchedulingSettings,
  history: LiveCallTurnMessage[],
  callerMessage: string,
): Promise<LiveCallTurnResult> {
  try {
    const res = await fetchWithTimeout("/api/live-call-turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: buildBusinessPayload(profile, greeting, scheduling),
        history,
        callerMessage,
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as LiveCallTurnApiResponse;
    return data;
  } catch {
    return { available: false, reason: "Could not reach the live-call API." };
  }
}
