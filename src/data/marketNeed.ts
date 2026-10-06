export interface StatPoint {
  value: string;
  label: string;
}

// Illustrative figures for the "market need" slide — representative of
// commonly cited industry pain points, not sourced from a specific study.
export const MARKET_NEED_STATS: StatPoint[] = [
  { value: "~62%", label: "of calls to small businesses go unanswered during business hours" },
  { value: "85%", label: "of callers whose call isn't picked up will not call back" },
  { value: "$0", label: "cost to the SMB today for every one of those missed opportunities" },
  { value: "24/7", label: "expectation from customers who call after hours or on weekends" },
];

export const MARKET_NEED_POINTS = [
  "SMB owners can't staff a front desk around the clock — they're on a job site, with another customer, or closed for the night.",
  "Every unanswered call is a customer who may simply call the next business in the search results instead.",
  "Operators already own the phone line and the billing relationship — an AI receptionist is a natural, high-margin add-on for Business/SMB tiers.",
  "Unlike generic voicemail, an AI receptionist can answer real questions, qualify the caller, and book the appointment on the spot.",
];

export const SCOPE_FEATURES = [
  {
    icon: "👋",
    title: "Custom greeting",
    body: "The owner chooses a tone (friendly, professional, concise) or writes a custom script, with a preview before it goes live.",
  },
  {
    icon: "🌐",
    title: "Website knowledge capture",
    body: "The owner gives SMB AI Receptionist their website; it extracts hours, services, location, and FAQs the AI can answer from.",
  },
  {
    icon: "💬",
    title: "Natural call handling",
    body: "Greets callers, answers common questions, and politely declines spam/robocalls — without ever interrupting the owner.",
  },
  {
    icon: "🗓️",
    title: "Appointment scheduling",
    body: "Offers to book an appointment, collects the caller's details, and proposes a time based on the business's hours.",
  },
  {
    icon: "📩",
    title: "Owner SMS update",
    body: "The moment a caller accepts an appointment slot, SMB AI Receptionist updates the schedule and texts the owner the details — no back-and-forth required.",
  },
  {
    icon: "🏢",
    title: "Multi-operator, white-label",
    body: "The same product can be offered under any operator's own brand as a Business/SMB value-add line item.",
  },
];
