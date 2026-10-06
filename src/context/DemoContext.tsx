import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Appointment,
  AppointmentStatus,
  BusinessProfile,
  CallHistoryEntry,
  GreetingSettings,
  OperatorId,
  SchedulingSettings,
} from "../types";
import { DEFAULT_GREETING, DEFAULT_SCHEDULING, EMPTY_PROFILE } from "../data/defaults";
import { DEFAULT_OPERATOR } from "../data/operators";
import { SEED_APPOINTMENTS } from "../data/appointments";
import { SEED_CALL_HISTORY } from "../data/callHistory";
import { clearAllSessionData, loadSession, saveSession } from "../lib/storage";

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
  }, []);

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
