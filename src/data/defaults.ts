import type { BusinessProfile, GreetingSettings, SchedulingSettings } from "../types";

export const EMPTY_PROFILE: BusinessProfile = {
  businessName: "",
  website: "",
  category: "other",
  phone: "",
  address: "",
  about: "",
  services: [],
  pricing: [],
  hours: [
    { day: "Mon", open: "09:00", close: "17:00", closed: false },
    { day: "Tue", open: "09:00", close: "17:00", closed: false },
    { day: "Wed", open: "09:00", close: "17:00", closed: false },
    { day: "Thu", open: "09:00", close: "17:00", closed: false },
    { day: "Fri", open: "09:00", close: "17:00", closed: false },
    { day: "Sat", open: "", close: "", closed: true },
    { day: "Sun", open: "", close: "", closed: true },
  ],
  faqs: [],
  scrapedAt: null,
};

export const DEFAULT_GREETING: GreetingSettings = {
  style: "friendly",
  customGreeting: "",
  voiceName: "Nova",
  voiceGender: "female",
  offerAppointments: true,
  mentionHours: true,
};

export const DEFAULT_SCHEDULING: SchedulingSettings = {
  appointmentLengthMinutes: 30,
  bufferMinutes: 15,
  ownerName: "",
  ownerMobile: "",
  autoTextOwner: true,
  bookableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
};

export function buildGreetingPreview(profile: BusinessProfile, greeting: GreetingSettings): string {
  const name = profile.businessName || "your business";
  if (greeting.style === "custom" && greeting.customGreeting.trim()) {
    return greeting.customGreeting.trim();
  }
  const hoursNote = greeting.mentionHours ? " We're closed right now, but I can still help." : "";
  const apptNote = greeting.offerAppointments ? " I can also help you book an appointment." : "";
  switch (greeting.style) {
    case "professional":
      return `Thank you for calling ${name}. This is their virtual receptionist.${hoursNote} How may I direct your call?${apptNote}`;
    case "concise":
      return `${name} — you've reached our AI receptionist.${hoursNote} What do you need?`;
    case "friendly":
    default:
      return `Hi there, thanks for calling ${name}! This is their AI receptionist.${hoursNote} How can I help today?${apptNote}`;
  }
}
