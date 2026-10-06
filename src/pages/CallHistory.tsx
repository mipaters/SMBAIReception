import { Link } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { OutcomeBadge } from "../components/ui/Badge";
import { Disclaimer } from "../components/ui/Disclaimer";

export function CallHistory() {
  const { callHistory, deleteHistory } = useDemo();

  return (
    <div>
      <div className="page-title">Call History</div>
      <p className="page-subtitle">Every call SMB AI Receptionist has handled this session, with full transcripts.</p>

      <div className="card">
        {callHistory.map((c) => (
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
        {callHistory.length === 0 && <div className="empty-state">No calls yet.</div>}
      </div>

      {callHistory.length > 0 && (
        <button className="btn btn-outline btn-block" onClick={deleteHistory}>
          Delete all history
        </button>
      )}
      <Disclaimer text="Call history lives only in this browser's session storage and is cleared when you delete it or close the tab." />
    </div>
  );
}
