// Shared domain types for the SMB AI Receptionist (SMB AI Receptionist) demo.
// All business names, transcripts, phone numbers, and appointments modeled
// here are synthetic and used only for illustrative purposes.

export type OperatorId = "generic";

export interface OperatorBrand {
  id: OperatorId;
  name: string;
  shortName: string;
  productName: string;
  tagline: string;
}

export type BusinessCategory =
  | "home-services"
  | "healthcare"
  | "personal-care"
  | "food-and-beverage"
  | "professional-services"
  | "retail"
  | "other";

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> = {
  "home-services": "Home Services",
  healthcare: "Healthcare",
  "personal-care": "Personal Care",
  "food-and-beverage": "Food & Beverage",
  "professional-services": "Professional Services",
  retail: "Retail",
  other: "Other",
};

export interface BusinessHours {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  open: string;
  close: string;
  closed: boolean;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface PricedService {
  service: string;
  price: string;
}

export interface BusinessProfile {
  businessName: string;
  website: string;
  category: BusinessCategory;
  phone: string;
  address: string;
  about: string;
  services: string[];
  pricing: PricedService[];
  hours: BusinessHours[];
  faqs: FaqEntry[];
  scrapedAt: string | null;
}

export type GreetingStyle = "friendly" | "professional" | "concise" | "custom";

export const GREETING_STYLE_LABEL: Record<GreetingStyle, string> = {
  friendly: "Friendly & warm",
  professional: "Polished & professional",
  concise: "Quick & concise",
  custom: "Custom script",
};

export interface GreetingSettings {
  style: GreetingStyle;
  customGreeting: string;
  voiceName: "Nova" | "Atlas" | "Willow" | "Sage";
  offerAppointments: boolean;
  mentionHours: boolean;
}

export interface SchedulingSettings {
  appointmentLengthMinutes: number;
  bufferMinutes: number;
  ownerName: string;
  ownerMobile: string;
  autoTextOwner: boolean;
  bookableDays: BusinessHours["day"][];
}

export type CallOutcome =
  | "booked-appointment"
  | "answered-question"
  | "took-message"
  | "declined-spam"
  | "info-only";

export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  "booked-appointment": "Booked appointment",
  "answered-question": "Answered question",
  "took-message": "Took a message",
  "declined-spam": "Declined (spam)",
  "info-only": "Gave information",
};

export interface TranscriptLine {
  speaker: "ai" | "caller" | "system";
  text: string;
}

export interface ScenarioStep {
  callerLine?: string;
  aiLine?: string;
  systemNote?: string;
}

export interface CallScenario {
  id: string;
  title: string;
  shortLabel: string;
  businessId: string;
  callerName: string;
  callerNumber: string;
  whenDescription: string;
  category: BusinessCategory;
  steps: ScenarioStep[];
  outcome: CallOutcome;
  presenterNotes: {
    callerWants: string;
    aiDoes: string;
    whyItMatters: string;
    whatIsSimulated: string;
  };
  appointment?: {
    service: string;
    requestedWhen: string;
    proposedWhen: string;
  };
}

export type AppointmentStatus =
  | "pending-owner"
  | "confirmed"
  | "declined"
  | "rescheduled";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  "pending-owner": "Waiting on owner",
  confirmed: "Confirmed",
  declined: "Declined",
  rescheduled: "Rescheduled",
};

export interface Appointment {
  id: string;
  businessId: string;
  callerName: string;
  callerPhone: string;
  service: string;
  proposedWhen: string;
  status: AppointmentStatus;
  createdFromCallId: string;
  ownerSmsPreview: string;
  callerSmsPreview: string;
  createdAt: string;
}

export interface CallHistoryEntry {
  id: string;
  businessId: string;
  callerName: string;
  callerNumber: string;
  when: string;
  durationSeconds: number;
  outcome: CallOutcome;
  summary: string;
  transcript: TranscriptLine[];
}

export type DemoStep = "profile" | "greeting" | "scheduling" | "review";

export type DemoMode = "connected" | "simulation";

export interface DemoStatus {
  mode: DemoMode;
  azureOpenAIConfigured: boolean;
  azureSpeechConfigured: boolean;
  message: string;
}
