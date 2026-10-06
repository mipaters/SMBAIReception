import { useState } from "react";
import { useDemo } from "../context/DemoContext";
import { APPOINTMENT_STATUS_LABEL } from "../types";
import type { Appointment } from "../types";
import { SAMPLE_BUSINESSES } from "../data/sampleBusinesses";
import { Disclaimer } from "../components/ui/Disclaimer";

function businessName(businessId: string, ownBusinessName: string): string {
  if (businessId === "own") return ownBusinessName || "Your business";
  return SAMPLE_BUSINESSES[businessId]?.businessName ?? businessId;
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const { businessProfile, updateAppointment } = useDemo();
  const [proposing, setProposing] = useState(false);
  const [newTime, setNewTime] = useState("");

  const statusTone = appt.status === "confirmed" ? "good" : appt.status === "declined" ? "bad" : appt.status === "rescheduled" ? "brand" : "warn";

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{appt.callerName}</div>
          <div className="call-meta">{appt.callerPhone}</div>
        </div>
        <span className={`badge badge-${statusTone}`}>{APPOINTMENT_STATUS_LABEL[appt.status]}</span>
      </div>

      <div className="field-row">
        <span className="field-label">Business</span>
        <span className="field-value">{businessName(appt.businessId, businessProfile.businessName)}</span>
      </div>
      <div className="field-row">
        <span className="field-label">Service</span>
        <span className="field-value">{appt.service}</span>
      </div>
      <div className="field-row">
        <span className="field-label">Proposed time</span>
        <span className="field-value">{appt.proposedWhen}</span>
      </div>

      <div className="sms-bubble">
        <span className="sms-label">Text sent to owner</span>
        {appt.ownerSmsPreview}
      </div>

      {appt.status === "pending-owner" && !proposing && (
        <div className="action-grid">
          <button className="btn btn-solid" onClick={() => updateAppointment(appt.id, { status: "confirmed" })}>
            ✅ Owner confirms
          </button>
          <button className="btn btn-outline" onClick={() => setProposing(true)}>
            🔁 Propose new time
          </button>
          <button className="btn btn-outline" style={{ gridColumn: "span 2" }} onClick={() => updateAppointment(appt.id, { status: "declined" })}>
            ✕ Owner declines
          </button>
        </div>
      )}

      {proposing && (
        <div className="form-row" style={{ marginTop: 10 }}>
          <label>New proposed time</label>
          <input className="text-input" value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="e.g. Friday 3:00 PM" />
          <div className="action-grid">
            <button
              className="btn btn-solid"
              disabled={!newTime.trim()}
              onClick={() => {
                updateAppointment(appt.id, { status: "rescheduled", proposedWhen: newTime.trim() });
                setProposing(false);
                setNewTime("");
              }}
            >
              Send new time
            </button>
            <button className="btn btn-outline" onClick={() => setProposing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {(appt.status === "confirmed" || appt.status === "rescheduled") && (
        <div className="sms-bubble">
          <span className="sms-label">Text sent to caller</span>
          {appt.status === "rescheduled"
            ? `Updated: your appointment is now ${appt.proposedWhen}. Reply if this doesn't work.`
            : appt.callerSmsPreview}
        </div>
      )}
    </div>
  );
}

export function Appointments() {
  const { appointments } = useDemo();
  const [filter, setFilter] = useState<"all" | "pending-owner" | "confirmed" | "rescheduled" | "declined">("all");

  const filtered = appointments.filter((a) => filter === "all" || a.status === filter);

  return (
    <div>
      <div className="page-title">Appointments</div>
      <p className="page-subtitle">
        Appointments SMB AI Receptionist booked on calls, waiting for the owner to confirm via text. Simulate the owner's reply
        below.
      </p>

      <div className="filter-row">
        {(["all", "pending-owner", "confirmed", "rescheduled", "declined"] as const).map((f) => (
          <button key={f} className={`pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : APPOINTMENT_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.map((a) => (
        <AppointmentCard appt={a} key={a.id} />
      ))}
      {filtered.length === 0 && <div className="empty-state">No appointments in this filter yet.</div>}

      <Disclaimer text="Owner replies are simulated with the buttons above — no real SMS is sent or received." />
    </div>
  );
}
