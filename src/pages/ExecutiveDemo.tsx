import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MARKET_NEED_POINTS, MARKET_NEED_STATS, SCOPE_FEATURES } from "../data/marketNeed";
import { Disclaimer } from "../components/ui/Disclaimer";
import { Badge } from "../components/ui/Badge";
import { ARCHITECTURE_FLOW } from "../data/architecture";
import { getOperator } from "../data/operators";
import { useDemo } from "../context/DemoContext";
import type { BusinessProfile, DemoStatus, GreetingSettings } from "../types";
import { GREETING_STYLE_LABEL } from "../types";
import { scrapeWebsite, formatHoursSummary } from "../engine/scrapeEngine";
import { scrapeBusinessSite, getDemoStatus } from "../lib/api";
import { buildGreetingPreview, DEFAULT_GREETING, DEFAULT_SCHEDULING, EMPTY_PROFILE } from "../data/defaults";
import { LiveCallSimulator } from "../components/LiveCallSimulator";
import { DEMO_PHONE_NUMBER, DEMO_PHONE_NUMBER_TEL } from "../data/voice";

const PARTS = ["The problem", "Scope of the service", "New customer onboarding", "Live customer call", "Architecture"];

export function ExecutiveDemo() {
  const [part, setPart] = useState(0);
  const { operatorId, businessProfile, greeting, setBusinessProfile, setGreeting, setScheduling, activate, activated } =
    useDemo();
  const operator = getOperator(operatorId);

  const [nameInput, setNameInput] = useState(businessProfile.businessName);
  const [websiteInput, setWebsiteInput] = useState(businessProfile.website);
  const [profileDraft, setProfileDraft] = useState<BusinessProfile>(businessProfile.scrapedAt ? businessProfile : EMPTY_PROFILE);
  const [greetingDraft, setGreetingDraft] = useState<GreetingSettings>(greeting ?? DEFAULT_GREETING);
  const [ownerName, setOwnerName] = useState(DEFAULT_SCHEDULING.ownerName);
  const [ownerMobile, setOwnerMobile] = useState(DEFAULT_SCHEDULING.ownerMobile);
  const [scraping, setScraping] = useState(false);
  const [scrapeSource, setScrapeSource] = useState<"azure" | "simulation" | null>(null);
  const [scrapeNote, setScrapeNote] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(activated);
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  useEffect(() => {
    getDemoStatus().then(setDemoStatus);
  }, []);

  const goNext = () => setPart((p) => Math.min(p + 1, PARTS.length - 1));
  const goPrev = () => setPart((p) => Math.max(p - 1, 0));

  const restart = () => {
    setPart(0);
  };

  const handleScrape = async () => {
    if (!nameInput.trim()) return;
    setScraping(true);
    setScrapeNote(null);

    const apiResult = await scrapeBusinessSite(nameInput, websiteInput);
    if (apiResult.source === "azure" && apiResult.profile) {
      setProfileDraft({
        businessName: nameInput.trim(),
        website: websiteInput.trim() || `${nameInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
        scrapedAt: new Date().toISOString(),
        ...apiResult.profile,
      });
      setScrapeSource("azure");
      setScraping(false);
      return;
    }

    setScrapeNote(apiResult.reason ?? null);
    window.setTimeout(() => {
      const { profile } = scrapeWebsite(nameInput, websiteInput);
      setProfileDraft(profile);
      setScrapeSource("simulation");
      setScraping(false);
    }, 450);
  };

  const handleOnboard = () => {
    setBusinessProfile(profileDraft);
    setGreeting(greetingDraft);
    setScheduling({ ...DEFAULT_SCHEDULING, ownerName, ownerMobile });
    activate();
    setOnboarded(true);
    goNext();
  };

  return (
    <div>
      <div className="page-title">Executive Demo Walkthrough</div>
      <p className="page-subtitle">
        A guided, five-part walkthrough: the market problem, what's in scope, onboarding a real new customer, a live
        interactive AI call to that business, and the underlying architecture.
      </p>

      <div className="wizard-steps">
        {PARTS.map((_, i) => (
          <div key={i} className={`wizard-step ${i < part ? "done" : i === part ? "current" : ""}`} />
        ))}
      </div>
      <div className="call-meta" style={{ marginBottom: 14 }}>
        Part {part + 1} of {PARTS.length} — {PARTS[part]}
      </div>

      {part === 0 && (
        <div>
          <div className="hero">
            <h1>Every missed call is a lost customer.</h1>
            <p>
              SMB owners can't staff a phone 24/7. {operator.name} customers lose real revenue every time a call to
              their business goes unanswered — nights, weekends, job sites, or simply a busy front desk.
            </p>
          </div>
          <div className="stat-grid">
            {MARKET_NEED_STATS.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <Disclaimer text="Figures above are illustrative, representative of commonly cited industry pain points — not sourced from a specific study." />
          <div className="section-title">Why operators should care</div>
          <div className="card">
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>
              {MARKET_NEED_POINTS.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {part === 1 && (
        <div>
          <div className="section-title">What's in scope</div>
          <div className="card">
            {SCOPE_FEATURES.map((f) => (
              <div className="arch-component" key={f.title}>
                <div className="arch-name">
                  <span>{f.icon}</span>
                  <span>{f.title}</span>
                </div>
                <div className="arch-body">{f.body}</div>
              </div>
            ))}
          </div>
          <div className="section-title">Who sets it up</div>
          <div className="card-soft">
            The SMB owner logs into the app, points SMB AI Receptionist at their website, reviews what was captured, picks a
            greeting, and activates — no technical setup required. The next step walks through exactly that.
          </div>
        </div>
      )}

      {part === 2 && (
        <div>
          <div className="section-title">Onboard a real new customer</div>
          <p className="call-meta" style={{ marginBottom: 12 }}>
            {demoStatus?.mode === "connected"
              ? "Connected — enter any real public business website below and it will really be scraped by Azure OpenAI."
              : "Simulation Mode — website scraping will use a deterministic template. See Architecture for how to connect Azure OpenAI."}
          </p>
          <div className="card">
            <div className="form-grid cols-2">
              <div className="form-row">
                <label htmlFor="exec-biz-name">Business name</label>
                <input
                  id="exec-biz-name"
                  className="text-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Rivera Plumbing & Drain"
                />
              </div>
              <div className="form-row">
                <label htmlFor="exec-biz-site">Website</label>
                <input
                  id="exec-biz-site"
                  className="text-input"
                  value={websiteInput}
                  onChange={(e) => setWebsiteInput(e.target.value)}
                  placeholder="e.g. yourbusiness.com"
                />
              </div>
            </div>
            <button className="btn btn-solid btn-block" onClick={handleScrape} disabled={!nameInput.trim() || scraping}>
              {scraping ? "Scanning website…" : "🔎 Scrape website for business info"}
            </button>

            {scrapeSource && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                {scrapeSource === "azure" ? (
                  <Badge tone="good">✨ Extracted from the live website via Azure OpenAI</Badge>
                ) : (
                  <Badge tone="neutral">🧪 Simulated template (no AI extraction configured)</Badge>
                )}
              </div>
            )}
            {scrapeNote && scrapeSource === "simulation" && (
              <div className="call-meta" style={{ marginTop: 4 }}>
                Reason: {scrapeNote}
              </div>
            )}

            {profileDraft.scrapedAt && (
              <div className="card-soft" style={{ marginTop: 14 }}>
                <div className="field-row">
                  <span className="field-label">Category</span>
                  <span className="field-value">{profileDraft.category.replace(/-/g, " ")}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Hours (detected)</span>
                  <span className="field-value">{formatHoursSummary(profileDraft.hours)}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Services</span>
                  <span className="field-value">{profileDraft.services.join(", ") || "—"}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Pricing</span>
                  <span className="field-value">
                    {profileDraft.pricing.map((p) => `${p.service}: ${p.price}`).join(", ") || "—"}
                  </span>
                </div>
              </div>
            )}

            <div className="section-title">Greeting style</div>
            <div className="pill-select" style={{ marginBottom: 10 }}>
              {(Object.keys(GREETING_STYLE_LABEL) as (keyof typeof GREETING_STYLE_LABEL)[]).map((style) => (
                <button
                  key={style}
                  className={`pill ${greetingDraft.style === style ? "active" : ""}`}
                  onClick={() => setGreetingDraft({ ...greetingDraft, style })}
                >
                  {GREETING_STYLE_LABEL[style]}
                </button>
              ))}
            </div>
            {profileDraft.scrapedAt && (
              <div className="transcript-line ai">
                <div className="transcript-bubble">{buildGreetingPreview(profileDraft, greetingDraft)}</div>
              </div>
            )}

            <div className="form-grid cols-2" style={{ marginTop: 14 }}>
              <div className="form-row">
                <label htmlFor="exec-owner-name">Owner name</label>
                <input
                  id="exec-owner-name"
                  className="text-input"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Marco Rivera"
                />
              </div>
              <div className="form-row">
                <label htmlFor="exec-owner-mobile">Owner mobile (for SMS confirmations)</label>
                <input
                  id="exec-owner-mobile"
                  className="text-input"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <button
              className="btn btn-solid btn-block"
              style={{ marginTop: 16 }}
              onClick={handleOnboard}
              disabled={!profileDraft.scrapedAt}
            >
              ✅ Activate SMB AI Receptionist for this business →
            </button>
            {!profileDraft.scrapedAt && <div className="disclaimer">Scrape a website above before activating.</div>}
          </div>
        </div>
      )}

      {part === 3 && (
        <div>
          <div className="section-title">Live customer call</div>
          {onboarded ? (
            <>
              <p className="call-meta" style={{ marginBottom: 12 }}>
                This is a genuinely interactive call — type as the caller and Azure OpenAI generates each receptionist
                reply, grounded only in {businessProfile.businessName}'s real profile from the previous step.
              </p>
              <div className="card-soft" style={{ marginBottom: 14 }}>
                📞 Prefer a real phone call? Call{" "}
                <a href={`tel:${DEMO_PHONE_NUMBER_TEL}`} style={{ fontWeight: 600 }}>
                  {DEMO_PHONE_NUMBER}
                </a>{" "}
                — this business is now live on that number, answered by SMB AI Receptionist. Any booking you make will
                show up in Appointments automatically within a few seconds.
              </div>
              <LiveCallSimulator />
            </>
          ) : (
            <div className="card-soft">Go back and onboard a business first.</div>
          )}
        </div>
      )}

      {part === 4 && (
        <div>
          <div className="section-title">Call flow</div>
          <div className="flow-diagram">
            {ARCHITECTURE_FLOW.map((node) => (
              <div className="flow-node" key={node.label}>
                <span className="flow-icon">{node.icon}</span>
                {node.label}
              </div>
            ))}
          </div>
          <div className="card-soft">
            Website scraping and the live call above both run against real Azure OpenAI when configured. What's still
            simulated: real telephony forwarding, speech-to-text/text-to-speech, a live calendar integration (appointment
            slots are offered by the model, not read from a real calendar), and a real SMS gateway.
          </div>
          <Link to="/architecture" className="btn btn-solid btn-block" style={{ marginTop: 12 }}>
            View full demo vs. production architecture →
          </Link>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 10 }}>
        <button className="btn btn-outline" onClick={goPrev} disabled={part === 0}>
          ← Back
        </button>
        {part < PARTS.length - 1 ? (
          <button className="btn btn-solid" onClick={goNext} disabled={part === 2 && !onboarded}>
            Next →
          </button>
        ) : (
          <button className="btn btn-outline" onClick={restart}>
            ↺ Restart walkthrough
          </button>
        )}
      </div>
    </div>
  );
}
