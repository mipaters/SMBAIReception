export interface ArchComponent {
  id: string;
  name: string;
  icon: string;
  demo: string;
  production: string;
}

export const ARCHITECTURE_FLOW: { label: string; icon: string }[] = [
  { label: "Caller", icon: "📞" },
  { label: "Carrier call forwarding\n(no-answer / busy)", icon: "📡" },
  { label: "SMB AI Receptionist\n(voice + reasoning)", icon: "🤖" },
  { label: "Business knowledge\n& scheduling engine", icon: "📚" },
  { label: "SMS to owner\n& caller", icon: "💬" },
];

export const ARCHITECTURE_COMPONENTS: ArchComponent[] = [
  {
    id: "telephony",
    name: "Call forwarding & telephony",
    icon: "📞",
    demo: "Simulated — scenarios are scripted transcripts; no real phone number, SIP trunk, or carrier integration is involved.",
    production: "Operator network forwards unanswered/busy SMB lines to a cloud telephony endpoint (e.g. carrier-native conditional call forwarding, or a SIP/Twilio-style trunk) that connects the call to the AI voice pipeline in under a second.",
  },
  {
    id: "asr",
    name: "Speech-to-text (ASR)",
    icon: "🎙️",
    demo: "Not used — caller lines are pre-written text for deterministic, repeatable demos.",
    production: "Streaming speech-to-text (e.g. Azure Speech) transcribes the caller in real time, tuned for phone-quality audio and interruption handling (barge-in).",
  },
  {
    id: "reasoning",
    name: "AI reasoning engine",
    icon: "🧠",
    demo: "Deterministic, scripted responses per scenario — the same logic runs identically every time for a reliable walkthrough.",
    production: "An LLM (e.g. Azure OpenAI) grounded in the business's profile (hours, services, FAQs) decides how to respond, when to offer scheduling, and when to escalate to the owner — with guardrails and a fallback to a safe default script if the model is unavailable.",
  },
  {
    id: "tts",
    name: "Text-to-speech (voice)",
    icon: "🔊",
    demo: "Transcript bubbles only — no audio is synthesized or played in this build.",
    production: "Neural text-to-speech (e.g. Azure Speech neural voices) speaks the AI's responses in the voice the SMB owner selected during setup, streamed back to the caller with low latency.",
  },
  {
    id: "scraper",
    name: "Website knowledge ingestion",
    icon: "🌐",
    demo: "Real, optional: when the API's Azure OpenAI settings are configured, the Setup wizard actually fetches the business's website server-side and asks Azure OpenAI to extract hours, services, FAQs, phone, and address. Without those settings configured, it falls back to a deterministic keyword-classifier template and no network request is made. See 'Make scraping real' below.",
    production: "A scheduled crawler fetches the business's website and public listings (hours, menu/services, location, policies) on an ongoing basis, extracts structured facts with an LLM, and lets the owner review/edit before anything is used live on calls.",
  },
  {
    id: "scheduling",
    name: "Scheduling engine",
    icon: "🗓️",
    demo: "Appointment slots are pre-scripted per scenario; the Appointments page lets you simulate the owner confirming or proposing a new time.",
    production: "Reads real-time availability from the owner's connected calendar (Google Calendar, Outlook, or booking platform API), proposes only genuinely open slots, and writes the booking back once confirmed.",
  },
  {
    id: "sms",
    name: "SMS notifications",
    icon: "💬",
    demo: "Shown as illustrative 'text sent' transcript bubbles — no SMS is actually sent.",
    production: "An SMS gateway (e.g. Twilio Messaging) sends the owner a real-time confirmation request and sends the caller a booking confirmation once the owner approves.",
  },
  {
    id: "storage",
    name: "Data storage",
    icon: "🗄️",
    demo: "Call history and appointments live only in the browser's session storage — nothing persists across devices or browser sessions.",
    production: "Call transcripts, appointments, and business profiles are stored in an operator-grade data store (e.g. Azure SQL/Cosmos DB + Blob Storage) with per-tenant isolation, retention controls, and audit logging.",
  },
  {
    id: "portal",
    name: "SMB owner app",
    icon: "📱",
    demo: "This app — setup wizard, business profile, live demo, appointments, and call history all run client-side.",
    production: "A multi-tenant SaaS portal (web + mobile) that operators offer as an add-on line item, with billing, usage analytics, and support tooling layered on top of the same core components.",
  },
];

export const KNOWN_GAPS = [
  "This is a client-rendered demo with session-only storage — nothing persists across browser sessions or devices, by design.",
  "No real phone number, carrier forwarding, or SIP/Twilio trunk is connected — every call in Live Demo and the Executive Demo is a scripted transcript.",
  "Website scraping can run for real (see the 'Make scraping real' setup note on this page) if you configure Azure OpenAI in the optional api/ project; otherwise it uses a deterministic keyword-classifier template.",
  "Scheduling slots are illustrative; there is no connection to a real calendar or booking platform.",
  "SMS notifications shown in transcripts are illustrative text previews; no real text message is sent to any phone number.",
  "Voice synthesis and speech recognition are not implemented in this build — everything is rendered as text transcript bubbles.",
];
