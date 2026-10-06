import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  Appointment,
  AppointmentStatus,
  BusinessProfile,
  CallHistoryEntry,
  GreetingSettings,
  OperatorId,
  SchedulingSettings,
  TranscriptLine,
} from "../types";
import { DEFAULT_GREETING, DEFAULT_SCHEDULING, EMPTY_PROFILE } from "../data/defaults";
import { DEFAULT_OPERATOR } from "../data/operators";
import { SEED_APPOINTMENTS } from "../data/appointments";
import { SEED_CALL_HISTORY } from "../data/callHistory";
import { clearAllSessionData, loadSession, saveSession } from "../lib/storage";
import { activateBusinessOnServer, fetchRecentVoiceActivity } from "../lib/api";

interface DemoContextValue {
  operatorId: OperatorId;
  setOperatorId: (id: OperatorId) => void;

  businessProfile: BusinessProfile;
  setBusinessProfile: (p: BusinessProfile) => void;

  greeting: GreetingSettings;
  setGreeting: (g: GreetingSettings) => void;

  scheduling: SchedulingSettings;
  setScheduling: (s: SchedulingSettings) => void;

  activated: boolean;
  activate: () => void;

  appointments: Appointment[];
  addAppointment: (a: Appointment) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;

  callHistory: CallHistoryEntry[];
  addCallHistoryEntry: (entry: CallHistoryEntry) => void;
  deleteHistory: () => void;

  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [operatorId, setOperatorIdState] = useState<OperatorId>(() => loadSession("operatorId", DEFAULT_OPERATOR));
  const [businessProfile, setBusinessProfileState] = useState<BusinessProfile>(() =>
    loadSession("businessProfile", EMPTY_PROFILE),
  );
  const [greeting, setGreetingState] = useState<GreetingSettings>(() => loadSession("greeting", DEFAULT_GREETING));
  const [scheduling, setSchedulingState] = useState<SchedulingSettings>(() =>
    loadSession("scheduling", DEFAULT_SCHEDULING),
  );
  const [activated, setActivatedState] = useState<boolean>(() => loadSession("activated", false));
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    loadSession("appointments", SEED_APPOINTMENTS),
  );
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>(() =>
    loadSession("callHistory", SEED_CALL_HISTORY),
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-operator", operatorId);
  }, [operatorId]);

  const setOperatorId = useCallback((id: OperatorId) => {
    setOperatorIdState(id);
    saveSession("operatorId", id);
  }, []);

  const setBusinessProfile = useCallback((p: BusinessProfile) => {
    setBusinessProfileState(p);
    saveSession("businessProfile", p);
  }, []);

  const setGreeting = useCallback((g: GreetingSettings) => {
    setGreetingState(g);
    saveSession("greeting", g);
  }, []);

  const setScheduling = useCallback((s: SchedulingSettings) => {
    setSchedulingState(s);
    saveSession("scheduling", s);
  }, []);

  const activate = useCallback(() => {
    setActivatedState(true);
    saveSession("activated", true);
    // Also persist server-side so the real Twilio phone number (no browser in
    // the loop) can answer calls grounded in this same business/greeting.
    void activateBusinessOnServer(businessProfile, greeting, scheduling);
  }, [businessProfile, greeting, scheduling]);

  const addAppointment = useCallback((a: Appointment) => {
    setAppointments((prev) => {
      const next = [a, ...prev];
      saveSession("appointments", next);
      return next;
    });
  }, []);

  const updateAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, status } : a));
      saveSession("appointments", next);
      return next;
    });
  }, []);

  const updateAppointment = useCallback((id: string, patch: Partial<Appointment>) => {
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      saveSession("appointments", next);
      return next;
    });
  }, []);

  const addCallHistoryEntry = useCallback((entry: CallHistoryEntry) => {
    setCallHistory((prev) => {
      const next = [entry, ...prev];
      saveSession("callHistory", next);
      return next;
    });
  }, []);

  // While activated, poll for bookings/call summaries from real phone calls
  // to the Twilio demo number (which has no browser in the loop) and merge
  // them into the same Appointments/Call History views the in-app Live Call
  // Simulator populates.
  const seenCallSidsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!activated) return;
    const poll = async () => {
      const events = await fetchRecentVoiceActivity();
      for (const event of events) {
        if (seenCallSidsRef.current.has(`${event.kind}-${event.callSid}`)) continue;
        seenCallSidsRef.current.add(`${event.kind}-${event.callSid}`);

        if (event.kind === "booking") {
          const { callerName, callerPhone, service, proposedWhen } = event.booking;
          const ownerSms = `SMB AI Receptionist: I've updated your schedule — new appointment for ${callerName} (${callerPhone}), ${service}, ${proposedWhen}.`;
          const callerSms = `${event.businessName}: you're confirmed for ${service} on ${proposedWhen}. See you then!`;
          addAppointment({
            id: `appt-voice-${event.callSid}`,
            businessId: event.businessName || "live-phone",
            callerName,
            callerPhone,
            service,
            proposedWhen,
            status: "confirmed",
            createdFromCallId: `voice-${event.callSid}`,
            ownerSmsPreview: ownerSms,
            callerSmsPreview: callerSms,
            createdAt: "Just now (real phone call)",
          });
        } else {
          const transcript: TranscriptLine[] = event.transcript.map((t) => ({
            speaker: t.role === "ai" ? "ai" : "caller",
            text: t.content,
          }));
          addCallHistoryEntry({
            id: `call-voice-${event.callSid}`,
            businessId: event.businessName || "live-phone",
            callerName: "Real phone caller",
            callerNumber: event.callerNumber,
            when: "Just now (real phone call)",
            durationSeconds: Math.max(20, transcript.length * 12),
            outcome: event.booked ? "booked-appointment" : "answered-question",
            summary: event.booked
              ? "Booked an appointment during a real inbound phone call."
              : "Real inbound phone call handled by SMB AI Receptionist.",
            transcript,
          });
        }
      }
    };
    void poll();
    const interval = window.setInterval(poll, 5000);
    return () => window.clearInterval(interval);
  }, [activated, addAppointment, addCallHistoryEntry]);

  const deleteHistory = useCallback(() => {
    setCallHistory([]);
    saveSession("callHistory", []);
  }, []);

  const resetDemo = useCallback(() => {
    clearAllSessionData();
    setOperatorIdState(DEFAULT_OPERATOR);
    setBusinessProfileState(EMPTY_PROFILE);
    setGreetingState(DEFAULT_GREETING);
    setSchedulingState(DEFAULT_SCHEDULING);
    setActivatedState(false);
    setAppointments(SEED_APPOINTMENTS);
    setCallHistory(SEED_CALL_HISTORY);
  }, []);

  const value = useMemo(
    () => ({
      operatorId,
      setOperatorId,
      businessProfile,
      setBusinessProfile,
      greeting,
      setGreeting,
      scheduling,
      setScheduling,
      activated,
      activate,
      appointments,
      addAppointment,
      updateAppointmentStatus,
      updateAppointment,
      callHistory,
      addCallHistoryEntry,
      deleteHistory,
      resetDemo,
    }),
    [
      operatorId,
      setOperatorId,
      businessProfile,
      setBusinessProfile,
      greeting,
      setGreeting,
      scheduling,
      setScheduling,
      activated,
      activate,
      appointments,
      addAppointment,
      updateAppointmentStatus,
      updateAppointment,
      callHistory,
      addCallHistoryEntry,
      deleteHistory,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within a DemoProvider");
  return ctx;
}
