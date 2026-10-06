import { isAzureOpenAIConfigured, readEnv } from "./env";

export type ExtractedCategory =
  | "home-services"
  | "healthcare"
  | "personal-care"
  | "food-and-beverage"
  | "professional-services"
  | "retail"
  | "other";

const VALID_CATEGORIES: ExtractedCategory[] = [
  "home-services",
  "healthcare",
  "personal-care",
  "food-and-beverage",
  "professional-services",
  "retail",
  "other",
];

const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface ExtractedHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface ExtractedFaq {
  question: string;
  answer: string;
}

export interface ExtractedPricedService {
  service: string;
  price: string;
}

export interface ExtractedBusinessProfile {
  category: ExtractedCategory;
  phone: string;
  address: string;
  about: string;
  services: string[];
  pricing: ExtractedPricedService[];
  hours: ExtractedHours[];
  faqs: ExtractedFaq[];
}

const SYSTEM_INSTRUCTION = `
You are a data-extraction assistant for SMB AI Receptionist, a product that reads a small business's public
website and fills in a structured business profile used to power an AI phone receptionist.

Read the plain-text content extracted from the business's website (provided by the user) and extract:
- category: one of "home-services","healthcare","personal-care","food-and-beverage","professional-services","retail","other"
- phone: the business's main public phone number as written on the site, or "" if none is present
- address: the business's street address, or "" if none is present
- about: a 1-2 sentence neutral summary of what the business does, written in third person
- services: an array of up to 8 short service/offering names mentioned on the site
- pricing: an array of up to 8 { service, price } pairs for any services whose pricing is stated or strongly implied on the
  site (e.g. { "service": "Oil change", "price": "$49.99" } or { "service": "Consultation", "price": "Free" }). Use the
  price text as written (keep "$", ranges like "$80-$150", or words like "Starting at $50"/"Free"). If no pricing is
  stated anywhere on the site, return an empty array — never invent prices.
- hours: an array of exactly 7 entries, one per day, each { day, open: "HH:MM" 24h or "", close: "HH:MM" or "", closed: boolean }.
  The "day" field MUST be exactly one of these 3-letter abbreviations, one entry each, in this order:
  "Mon","Tue","Wed","Thu","Fri","Sat","Sun". Never use full day names.
  If hours are not stated for a day, mark it closed. If no hours are stated anywhere, make your best reasonable guess
  for a business of this category and note nothing extra.
- faqs: an array of up to 4 { question, answer } pairs a caller would plausibly ask, answerable from the site content

Never invent a phone number or address if one is not present in the text — return "" instead.
Respond ONLY with a single minified JSON object matching this exact shape, no prose, no markdown fences:
{"category":string,"phone":string,"address":string,"about":string,"services":string[],"pricing":{"service":string,"price":string}[],"hours":{"day":string,"open":string,"close":string,"closed":boolean}[],"faqs":{"question":string,"answer":string}[]}
`.trim();

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

const DAY_ALIASES: Record<string, string> = {
  mon: "Mon",
  monday: "Mon",
  tue: "Tue",
  tues: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  weds: "Wed",
  wednesday: "Wed",
  thu: "Thu",
  thur: "Thu",
  thurs: "Thu",
  thursday: "Thu",
  fri: "Fri",
  friday: "Fri",
  sat: "Sat",
  saturday: "Sat",
  sun: "Sun",
  sunday: "Sun",
};

/** Defensive normalization: some model responses use full day names despite instructions. */
function normalizeDayNames(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.hours)) return value;
  const hours = v.hours.map((h) => {
    if (!h || typeof h !== "object") return h;
    const entry = h as Record<string, unknown>;
    const day = typeof entry.day === "string" ? DAY_ALIASES[entry.day.trim().toLowerCase()] ?? entry.day : entry.day;
    return { ...entry, day };
  });
  return { ...v, hours };
}

/** Defensive normalization: pricing is a newer field — tolerate it being missing or malformed rather than failing the whole extraction. */
function normalizePricing(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.pricing)) return { ...v, pricing: [] };
  const pricing = v.pricing.filter(
    (p) => p && typeof p === "object" && typeof (p as Record<string, unknown>).service === "string" && typeof (p as Record<string, unknown>).price === "string",
  );
  return { ...v, pricing };
}

function isValidExtractedProfile(value: unknown): value is ExtractedBusinessProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.category !== "string" || !VALID_CATEGORIES.includes(v.category as ExtractedCategory)) return false;
  if (typeof v.phone !== "string" || typeof v.address !== "string" || typeof v.about !== "string") return false;
  if (!Array.isArray(v.services) || !v.services.every((s) => typeof s === "string")) return false;
  if (!Array.isArray(v.pricing) || !v.pricing.every((p) => p && typeof p === "object" && typeof (p as ExtractedPricedService).service === "string" && typeof (p as ExtractedPricedService).price === "string"))
    return false;
  if (!Array.isArray(v.hours) || v.hours.length === 0) return false;
  if (
    !v.hours.every(
      (h) =>
        h &&
        typeof h === "object" &&
        VALID_DAYS.includes((h as ExtractedHours).day) &&
        typeof (h as ExtractedHours).open === "string" &&
        typeof (h as ExtractedHours).close === "string" &&
        typeof (h as ExtractedHours).closed === "boolean",
    )
  )
    return false;
  if (!Array.isArray(v.faqs)) return false;
  if (!v.faqs.every((f) => f && typeof f === "object" && typeof (f as ExtractedFaq).question === "string" && typeof (f as ExtractedFaq).answer === "string"))
    return false;
  return true;
}

/**
 * Sends extracted page text to Azure OpenAI and asks it to return a structured
 * business profile. Returns null if Azure OpenAI isn't configured or the call
 * fails/returns an unexpected shape, so callers can fall back to the
 * deterministic simulation.
 */
export async function tryAzureOpenAIExtraction(
  businessName: string,
  website: string,
  pageText: string,
): Promise<ExtractedBusinessProfile | null> {
  const env = readEnv();
  if (!isAzureOpenAIConfigured(env)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const url = `${env.azureOpenAIEndpoint}/openai/deployments/${env.azureOpenAIDeployment}/chat/completions?api-version=2024-08-01-preview`;
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "api-key": env.azureOpenAIKey as string,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Business name: ${businessName}\nWebsite: ${website}\n\nExtracted page text:\n"""${pageText}"""`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = normalizePricing(normalizeDayNames(JSON.parse(content)));
    if (!isValidExtractedProfile(parsed)) return null;
    return parsed;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
