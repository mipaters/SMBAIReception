import { Fragment, useEffect, useState } from "react";
import { ARCHITECTURE_COMPONENTS, ARCHITECTURE_FLOW, KNOWN_GAPS } from "../data/architecture";
import { Disclaimer } from "../components/ui/Disclaimer";
import { Badge } from "../components/ui/Badge";
import { getDemoStatus } from "../lib/api";
import type { DemoStatus } from "../types";

type Mode = "demo" | "production";

export function Architecture() {
  const [mode, setMode] = useState<Mode>("demo");
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  useEffect(() => {
    getDemoStatus().then(setDemoStatus);
  }, []);

  return (
    <div>
      <div className="page-title">Architecture</div>
      <p className="page-subtitle">
        How SMB AI Receptionist is built in this demo, versus what an operator-grade production deployment would add. Every
        component below maps to the same call flow — only the implementation behind it changes.
      </p>

      {demoStatus && (
        <div style={{ marginBottom: 14 }}>
          <Badge tone={demoStatus.mode === "connected" ? "good" : "neutral"}>
            {demoStatus.mode === "connected" ? "✨ Connected Mode — website scraping" : "🧪 Simulation Mode — website scraping"}
          </Badge>
          <div className="call-meta" style={{ marginTop: 4 }}>
            {demoStatus.message}
          </div>
          <div style={{ marginTop: 8 }}>
            <Badge tone={demoStatus.azureSpeechConfigured ? "good" : "neutral"}>
              {demoStatus.azureSpeechConfigured
                ? "🔊 Azure Neural voice — live calls"
                : "🔈 Twilio default voice — live calls"}
            </Badge>
            <div className="call-meta" style={{ marginTop: 4 }}>
              {demoStatus.azureSpeechConfigured
                ? "Azure AI Speech is configured — the voice receptionist speaks with an Azure Neural voice on real calls."
                : "Azure AI Speech isn't configured — real calls fall back to Twilio's built-in voice. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to switch."}
            </div>
          </div>
        </div>
      )}

      <div className="section-title">Call flow</div>
      <div className="flow-diagram">
        {ARCHITECTURE_FLOW.map((node, i) => (
          <Fragment key={node.label}>
            <div className="flow-node">
              <span className="flow-icon">{node.icon}</span>
              {node.label}
            </div>
            {i < ARCHITECTURE_FLOW.length - 1 && <span className="flow-arrow">→</span>}
          </Fragment>
        ))}
      </div>

      <div className="mode-toggle">
        <button className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")}>
          This demo build
        </button>
        <button className={mode === "production" ? "active" : ""} onClick={() => setMode("production")}>
          Production build
        </button>
      </div>

      <div className="card">
        {ARCHITECTURE_COMPONENTS.map((c) => (
          <div className="arch-component" key={c.id}>
            <div className="arch-name">
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </div>
            <div className="arch-body">{mode === "demo" ? c.demo : c.production}</div>
          </div>
        ))}
      </div>

      <div className="section-title">Make website scraping real</div>
      <div className="card-soft">
        <p style={{ marginTop: 0 }}>
          This repo includes an optional Azure Functions API (<code>api/</code>) that, when configured, really fetches a
          business's website and uses Azure OpenAI to extract its hours, services, FAQs, phone, and address.
        </p>
        <ol style={{ paddingLeft: 18, lineHeight: 1.7 }}>
          <li>
            Create (or reuse) an Azure OpenAI resource with a chat-completion model deployed (e.g. <code>gpt-4o-mini</code>).
          </li>
          <li>
            In <code>api/</code>, copy <code>local.settings.json.example</code> to <code>local.settings.json</code> and fill in{" "}
            <code>AZURE_OPENAI_ENDPOINT</code>, <code>AZURE_OPENAI_API_KEY</code>, and <code>AZURE_OPENAI_DEPLOYMENT</code>.
          </li>
          <li>
            Install <a href="https://learn.microsoft.com/azure/azure-functions/functions-run-local" target="_blank" rel="noreferrer">Azure Functions Core Tools v4</a>, then
            from <code>api/</code> run <code>npm install && npm run build && func start</code>.
          </li>
          <li>
            In another terminal at the repo root, run <code>npm run dev</code>. For both to work together behind <code>/api</code>, use the{" "}
            <a href="https://azure.github.io/static-web-apps-cli/" target="_blank" rel="noreferrer">SWA CLI</a>:{" "}
            <code>swa start http://localhost:5173 --api-location api --run "npm run dev"</code>.
          </li>
          <li>Open the Setup wizard and scrape a real business website — the badge above will switch to "Connected Mode".</li>
        </ol>
        <p style={{ marginBottom: 0 }}>Full details are in the repo's README.</p>
      </div>

      <div className="section-title">Known gaps in this demo</div>
      <div className="card-soft">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 13.5 }}>
          {KNOWN_GAPS.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      </div>

      <Disclaimer text="This page describes an illustrative architecture concept. No real telephony, speech, scheduling, or SMS infrastructure is connected to this app. Website scraping can be connected for real as described above." />
    </div>
  );
}

