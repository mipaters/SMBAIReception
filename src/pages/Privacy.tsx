export function Privacy() {
  return (
    <div>
      <div className="page-title">Privacy</div>
      <p className="page-subtitle">How this demo handles data (and how a production version would differ).</p>

      <div className="card">
        <div className="arch-component">
          <div className="arch-name">
            <span>🗂️</span>
            <span>Session-only storage</span>
          </div>
          <div className="arch-body">
            Everything you do in this demo — business profiles, greetings, call history, and appointments — is stored
            only in your browser's session storage. Closing the tab or clicking "Reset demo" clears it completely.
          </div>
        </div>
        <div className="arch-component">
          <div className="arch-name">
            <span>🚫</span>
            <span>No real calls, scraping, or texts</span>
          </div>
          <div className="arch-body">
            This app never places a real phone call, fetches a real website, or sends a real SMS. Every "call",
            "scrape", and "text sent" you see is a scripted, illustrative simulation.
          </div>
        </div>
        <div className="arch-component">
          <div className="arch-name">
            <span>🏢</span>
            <span>In a production deployment</span>
          </div>
          <div className="arch-body">
            Real call transcripts, caller phone numbers, and appointment details would be stored per-tenant with
            encryption at rest, configurable retention windows, and clear consent/disclosure to callers that they are
            speaking with an AI — consistent with applicable telecom and privacy regulations.
          </div>
        </div>
      </div>
    </div>
  );
}
