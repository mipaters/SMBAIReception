import type { BusinessCategory, BusinessHours, FaqEntry, BusinessProfile } from "../types";

// Simulates "scraping" a business website for the Setup wizard. This is a
// deterministic, keyword-based classifier over the business name/URL — no
// network request is made and no real website is ever fetched. It exists to
// make the onboarding flow feel real without requiring live infrastructure.

interface CategoryTemplate {
  category: BusinessCategory;
  services: string[];
  pricing: { service: string; price: string }[];
  about: (name: string) => string;
  faqs: FaqEntry[];
  hours: BusinessHours[];
}

const STANDARD_HOURS: BusinessHours[] = [
  { day: "Mon", open: "09:00", close: "17:00", closed: false },
  { day: "Tue", open: "09:00", close: "17:00", closed: false },
  { day: "Wed", open: "09:00", close: "17:00", closed: false },
  { day: "Thu", open: "09:00", close: "17:00", closed: false },
  { day: "Fri", open: "09:00", close: "17:00", closed: false },
  { day: "Sat", open: "10:00", close: "14:00", closed: false },
  { day: "Sun", open: "", close: "", closed: true },
];

const TEMPLATES: Record<string, CategoryTemplate> = {
  "home-services": {
    category: "home-services",
    services: ["Repairs & maintenance", "Free estimates", "Emergency after-hours service", "Installation"],
    pricing: [
      { service: "Service call / diagnostic", price: "$79" },
      { service: "Standard repair", price: "$150–$350" },
      { service: "Emergency after-hours call-out", price: "$225+" },
    ],
    about: (n) => `${n} is a local home services company providing reliable, licensed and insured work for the community.`,
    faqs: [
      { question: "Do you offer free estimates?", answer: "Yes, estimates are free for most jobs." },
      { question: "Do you handle emergencies?", answer: "Yes, we offer after-hours emergency dispatch." },
    ],
    hours: STANDARD_HOURS,
  },
  healthcare: {
    category: "healthcare",
    services: ["New patient visits", "Routine checkups", "Same-day urgent visits", "Insurance billing support"],
    pricing: [
      { service: "New patient visit", price: "$150" },
      { service: "Routine checkup", price: "$90" },
      { service: "Same-day urgent visit", price: "$120" },
    ],
    about: (n) => `${n} provides friendly, patient-first care for the whole family, with evening appointments available.`,
    faqs: [
      { question: "Are you accepting new patients?", answer: "Yes, we're currently accepting new patients." },
      { question: "Do you take my insurance?", answer: "We're in-network with most major plans — we confirm coverage before your visit." },
    ],
    hours: STANDARD_HOURS,
  },
  "personal-care": {
    category: "personal-care",
    services: ["Appointments & walk-ins", "Packages & gift cards", "Seasonal specials"],
    pricing: [
      { service: "Haircut / style", price: "$45" },
      { service: "Color / treatment", price: "$95–$160" },
      { service: "Spa package", price: "$120+" },
    ],
    about: (n) => `${n} is a locally loved personal care studio known for attentive service and a relaxing atmosphere.`,
    faqs: [
      { question: "Do you take walk-ins?", answer: "We prioritize appointments, but walk-ins are welcome if we have availability." },
      { question: "How do I reschedule?", answer: "Just give us your name and current appointment time and we'll find a new slot." },
    ],
    hours: STANDARD_HOURS,
  },
  "food-and-beverage": {
    category: "food-and-beverage",
    services: ["Dine-in", "Take-out", "Delivery", "Private event catering"],
    pricing: [
      { service: "Entrées", price: "$14–$28" },
      { service: "Private event catering", price: "$25/person+" },
    ],
    about: (n) => `${n} is a neighborhood favorite serving fresh, made-to-order food for dine-in, take-out, and delivery.`,
    faqs: [
      { question: "Do you deliver?", answer: "Yes, delivery is available within a few miles of our location." },
      { question: "Do you take reservations?", answer: "Reservations are recommended for parties of 5 or more." },
    ],
    hours: [
      { day: "Mon", open: "11:00", close: "21:00", closed: false },
      { day: "Tue", open: "11:00", close: "21:00", closed: false },
      { day: "Wed", open: "11:00", close: "21:00", closed: false },
      { day: "Thu", open: "11:00", close: "21:00", closed: false },
      { day: "Fri", open: "11:00", close: "22:00", closed: false },
      { day: "Sat", open: "11:00", close: "22:00", closed: false },
      { day: "Sun", open: "12:00", close: "20:00", closed: false },
    ],
  },
  "professional-services": {
    category: "professional-services",
    services: ["Free initial consultation", "Scheduled appointments", "Document review", "Ongoing client support"],
    pricing: [
      { service: "Initial consultation", price: "Free" },
      { service: "Hourly rate", price: "$150–$300/hr" },
      { service: "Flat-fee package", price: "Starting at $500" },
    ],
    about: (n) => `${n} provides dependable professional services for individuals and small businesses in the area.`,
    faqs: [
      { question: "Do you offer a free consultation?", answer: "Yes, new-client consultations are complimentary." },
      { question: "What are your rates?", answer: "Rates vary by service — we're happy to provide a quote after a quick consultation." },
    ],
    hours: STANDARD_HOURS,
  },
  retail: {
    category: "retail",
    services: ["In-store shopping", "Special orders", "Local pickup", "Gift cards"],
    pricing: [{ service: "Most items", price: "$10–$120" }],
    about: (n) => `${n} is an independently owned shop offering curated products and friendly, knowledgeable service.`,
    faqs: [
      { question: "Do you offer local pickup?", answer: "Yes, orders can be picked up in-store during business hours." },
      { question: "Can I place a special order?", answer: "Yes, just let us know what you're looking for and we'll see what we can source." },
    ],
    hours: STANDARD_HOURS,
  },
  other: {
    category: "other",
    services: ["Scheduled appointments", "Phone & walk-in inquiries", "Custom requests"],
    pricing: [],
    about: (n) => `${n} is a locally owned small business serving the community.`,
    faqs: [{ question: "What are your hours?", answer: "See our posted hours — we're happy to help during business hours." }],
    hours: STANDARD_HOURS,
  },
};

const KEYWORD_MAP: { pattern: RegExp; category: keyof typeof TEMPLATES }[] = [
  { pattern: /plumb|hvac|electric|roof|landscap|lawn|pest|clean(ing)?|handyman|contractor/i, category: "home-services" },
  { pattern: /dental|dentist|smile|clinic|medical|health|physical therapy|chiro|vet(erinary)?/i, category: "healthcare" },
  { pattern: /salon|spa|barber|hair|nail|cuts|beauty|massage/i, category: "personal-care" },
  { pattern: /restaurant|cafe|caf[ée]|grill|kitchen|bakery|pizza|diner|take ?out|bar\b/i, category: "food-and-beverage" },
  { pattern: /law|legal|account(ing|ant)?|consult|insurance|realt(y|or)|financial|tax/i, category: "professional-services" },
  { pattern: /shop|store|boutique|market|retail/i, category: "retail" },
];

function classify(name: string, website: string): keyof typeof TEMPLATES {
  const haystack = `${name} ${website}`.toLowerCase();
  for (const { pattern, category } of KEYWORD_MAP) {
    if (pattern.test(haystack)) return category;
  }
  return "other";
}

function fakePhone(seedText: string): string {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  const exch = 200 + (seed % 700);
  const line = 1000 + (seed % 8999);
  return `(555) ${exch}-${line}`;
}

export interface ScrapeResult {
  profile: BusinessProfile;
}

/** Simulates scraping a business website to extract hours, services, and FAQs. */
export function scrapeWebsite(businessName: string, website: string): ScrapeResult {
  const name = businessName.trim() || "Your Business";
  const url = website.trim() || `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
  const categoryKey = classify(name, url);
  const template = TEMPLATES[categoryKey];

  const profile: BusinessProfile = {
    businessName: name,
    website: url,
    category: template.category,
    phone: fakePhone(name + url),
    address: "",
    about: template.about(name),
    services: [...template.services],
    pricing: template.pricing.map((p) => ({ ...p })),
    hours: template.hours.map((h) => ({ ...h })),
    faqs: template.faqs.map((f) => ({ ...f })),
    scrapedAt: new Date().toISOString(),
  };

  return { profile };
}

export function formatHoursSummary(hours: BusinessHours[]): string {
  const open = hours.filter((h) => !h.closed);
  if (open.length === 0) return "Closed all week";
  const first = open[0];
  const allSame = open.every((h) => h.open === first.open && h.close === first.close);
  if (allSame && open.length >= 5) {
    const days = open.map((h) => h.day).join(", ");
    return `${days}: ${first.open}–${first.close}`;
  }
  return open.map((h) => `${h.day} ${h.open}–${h.close}`).join(" · ");
}
