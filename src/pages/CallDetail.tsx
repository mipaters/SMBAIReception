import { Link, useParams } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { OutcomeBadge } from "../components/ui/Badge";

export function CallDetail() {
  const { id } = useParams();
  const { callHistory } = useDemo();
  const call = callHistory.find((c) => c.id === id);

  if (!call) {
    return (
      <div>
        <div className="empty-state">Call not found.</div>
        <Link to="/history" className="btn btn-outline btn-block">
          ← Back to history
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/history" className="btn btn-outline" style={{ marginBottom: 16 }}>
        ← Back to history
      </Link>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{call.callerName}</div>
          <div className="call-meta">
            {call.callerNumber} · {call.when} · {call.durationSeconds}s
          </div>
        </div>
        <OutcomeBadge outcome={call.outcome} />
      </div>

      <div className="section-title">Transcript</div>
      <div className="card">
        {call.transcript.map((line, i) => (
          <div className={`transcript-line ${line.speaker}`} key={i}>
            <div className="transcript-bubble">{line.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
