import { Link } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { Disclaimer } from "../components/ui/Disclaimer";
import { OutcomeBadge } from "../components/ui/Badge";
import { getOperator } from "../data/operators";

export function Home() {
  const { callHistory, appointments, businessProfile, activated, operatorId } = useDemo();
  const operator = getOperator(operatorId);
  const recent = callHistory.slice(0, 4);
  const pendingAppts = appointments.filter((a) => a.status === "pending-owner").length;
  const bookedAppts = appointments.filter((a) => a.status === "confirmed" || a.status === "rescheduled").length;
  const declinedSpam = callHistory.filter((c) => c.outcome === "declined-spam").length;

  return (
    <div>
      <div className="hero">
        <h1>Never miss another customer call.</h1>
        <p>{operator.tagline} {operator.productName} answers calls your SMB customers miss, greets callers in their own
          voice, answers common questions from their website, and books appointments automatically — texting the owner
          to confirm.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link to="/executive-demo" className="btn btn-primary">
            ▶ Run Executive Demo
          </Link>
          <Link to="/setup" className="btn btn-secondary">
            Set up your own business
          </Link>
        </div>
      </div>

      {!activated && (
        <div className="card-soft" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Set up your own demo business</div>
            <div className="call-meta">Enter a business name & website, customize the greeting, and activate.</div>
          </div>
          <Link to="/setup" className="btn btn-solid">
            Start setup
          </Link>
        </div>
      )}

      {activated && (
        <div className="card-soft" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{businessProfile.businessName}</div>
            <div className="call-meta">SMB AI Receptionist is active for this business.</div>
          </div>
          <Link to="/business-profile" className="btn btn-outline">
            View profile
          </Link>
        </div>
      )}

      <div className="section-title">Today's Summary</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{callHistory.length}</div>
          <div className="stat-label">Calls handled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookedAppts}</div>
          <div className="stat-label">Appointments booked</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingAppts}</div>
          <div className="stat-label">Waiting on owner reply</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{declinedSpam}</div>
          <div className="stat-label">Spam calls declined</div>
        </div>
      </div>
      <Disclaimer text="Illustrative demonstration data — no real calls, websites, or texts are involved." />

      <div className="section-title">Recent Calls</div>
      <div className="card">
        {recent.map((c) => (
          <Link key={c.id} to={`/history/${c.id}`} className="call-row">
            <div>
              <div className="caller-name">{c.callerName}</div>
              <div className="call-meta">{c.summary}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <OutcomeBadge outcome={c.outcome} />
              <div className="call-meta">{c.when}</div>
            </div>
          </Link>
        ))}
        {recent.length === 0 && <div className="empty-state">No calls yet. Try the Executive Demo.</div>}
      </div>
      <div style={{ textAlign: "right" }}>
        <Link to="/history" className="badge badge-brand">
          View all call history →
        </Link>
      </div>
    </div>
  );
}
