import type { LiveCallBusinessContext } from "./liveCall";

/**
 * Mirrors `buildGreetingPreview` from `src/data/defaults.ts` for use on the
 * server side (the Twilio voice webhook has no access to the frontend
 * bundle). Keep these two in sync if the greeting copy changes.
 */
export function buildVoiceGreeting(ctx: LiveCallBusinessContext): string {
  const name = ctx.businessName || "your business";
  if (ctx.greetingStyle === "custom" && ctx.customGreeting?.trim()) {
    return ctx.customGreeting.trim();
  }
  const hoursNote = ctx.mentionHours ? " We're closed right now, but I can still help." : "";
  const apptNote = ctx.offerAppointments ? " I can also help you book an appointment." : "";
  switch (ctx.greetingStyle) {
    case "professional":
      return `Thank you for calling ${name}. This is their virtual receptionist.${hoursNote} How may I direct your call?${apptNote}`;
    case "concise":
      return `${name} — you've reached our AI receptionist.${hoursNote} What do you need?`;
    case "friendly":
    default:
      return `Hi there, thanks for calling ${name}! This is their AI receptionist.${hoursNote} How can I help today?${apptNote}`;
  }
}

/** Escapes text for safe inclusion inside TwiML <Say> element content. */
export function escapeTwiml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
