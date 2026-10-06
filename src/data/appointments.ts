import type { Appointment } from "../types";
import { SCENARIOS } from "./scenarios";

const OWNER_SMS: Record<string, string> = {
  "rivera-emergency": 'Urgent: possible burst pipe/flooding at Dana Whitfield\'s home, 555-201-7743. Caller requesting tonight if possible. Reply YES to confirm tonight or a time to propose instead.',
  "brightsmiles-pricing": "New patient Theo Mackenzie requested whitening consult, Thu 4:30 PM, 555-338-9021. Reply CONFIRM to lock it in.",
  "luxecuts-reschedule": "Reschedule request: Priya Anand, Tue 2 PM color appt → requesting Thu 5 PM instead. 555-460-1187. Reply CONFIRM or propose alternate time.",
};

const CALLER_SMS: Record<string, string> = {
  "rivera-emergency": "Rivera Plumbing & Drain: we're confirming your emergency call-out. We'll text the moment Marco responds.",
  "brightsmiles-pricing": "Bright Smiles Family Dental: you're tentatively booked for a whitening consult, Thu 4:30 PM. We'll confirm shortly!",
  "luxecuts-reschedule": "Luxe Cuts Salon & Spa: requesting to move your color appt to Thu 5:00 PM. We'll text once it's confirmed on our end.",
};

export const SEED_APPOINTMENTS: Appointment[] = SCENARIOS.filter((s) => s.appointment).map((s, i) => ({
  id: `seed-appt-${s.id}`,
  businessId: s.businessId,
  callerName: s.callerName,
  callerPhone: s.callerNumber,
  service: s.appointment!.service,
  proposedWhen: s.appointment!.proposedWhen,
  status: i === 0 ? "pending-owner" : i === 1 ? "confirmed" : "pending-owner",
  createdFromCallId: `seed-${s.id}`,
  ownerSmsPreview: OWNER_SMS[s.id] ?? "SMB AI Receptionist sent a text to the owner about this appointment.",
  callerSmsPreview: CALLER_SMS[s.id] ?? "SMB AI Receptionist texted the caller a confirmation update.",
  createdAt: s.whenDescription,
}));
