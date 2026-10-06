import type { LiveCallBooking, LiveCallTurnMessage } from "./liveCall";

const CALL_HISTORY_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface ActiveCall {
  history: LiveCallTurnMessage[];
  booked: boolean;
  lastTouchedAt: number;
}

const callsBySid = new Map<string, ActiveCall>();

function purgeStaleCalls(): void {
  const now = Date.now();
  for (const [sid, call] of callsBySid) {
    if (now - call.lastTouchedAt > CALL_HISTORY_TTL_MS) callsBySid.delete(sid);
  }
}

export function getCallHistory(callSid: string): LiveCallTurnMessage[] {
  purgeStaleCalls();
  return callsBySid.get(callSid)?.history ?? [];
}

export function appendCallTurn(callSid: string, callerMessage: string, reply: string): void {
  const call = callsBySid.get(callSid) ?? { history: [], booked: false, lastTouchedAt: Date.now() };
  call.history.push({ role: "caller", content: callerMessage }, { role: "ai", content: reply });
  call.lastTouchedAt = Date.now();
  callsBySid.set(callSid, call);
}

export function hasBooked(callSid: string): boolean {
  return callsBySid.get(callSid)?.booked ?? false;
}

export function markBooked(callSid: string): void {
  const call = callsBySid.get(callSid);
  if (call) call.booked = true;
}

/**
 * Real calls through the Twilio number have no browser in the loop, so
 * bookings and call summaries are buffered here and picked up by the app via
 * `GET /api/recent-voice-activity` polling, then merged into the same
 * Appointments/Call History views the in-app Live Call Simulator populates.
 */
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

type RealCallEvent = RealCallBookingEvent | RealCallSummaryEvent;

let pendingEvents: RealCallEvent[] = [];

export function queueRealCallEvent(event: RealCallEvent): void {
  pendingEvents.push(event);
  if (pendingEvents.length > 100) pendingEvents = pendingEvents.slice(-100);
}

export function drainRealCallEvents(): RealCallEvent[] {
  const events = pendingEvents;
  pendingEvents = [];
  return events;
}
