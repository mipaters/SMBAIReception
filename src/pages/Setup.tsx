import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import type { BusinessProfile, DemoStatus, DemoStep, GreetingSettings, SchedulingSettings } from "../types";
import { GREETING_STYLE_LABEL } from "../types";
import { scrapeWebsite, formatHoursSummary } from "../engine/scrapeEngine";
import { scrapeBusinessSite, getDemoStatus } from "../lib/api";
import { buildGreetingPreview, DEFAULT_GREETING, DEFAULT_SCHEDULING, EMPTY_PROFILE } from "../data/defaults";
import { Disclaimer } from "../components/ui/Disclaimer";
import { Badge } from "../components/ui/Badge";
import { GreetingVoiceEditor } from "../components/GreetingVoiceEditor";

const STEPS: DemoStep[] = ["profile", "greeting", "scheduling", "review"];
const STEP_LABEL: Record<DemoStep, string> = {
  profile: "Business profile",
  greeting: "Greeting",
  scheduling: "Scheduling & owner",
  review: "Review & activate",
};

const ALL_DAYS: SchedulingSettings["bookableDays"] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Setup() {
  const { businessProfile, greeting, scheduling, setBusinessProfile, setGreeting, setScheduling, activate } = useDemo();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [nameInput, setNameInput] = useState(businessProfile.businessName);
  const [websiteInput, setWebsiteInput] = useState(businessProfile.website);
  const [profileDraft, setProfileDraft] = useState<BusinessProfile>(
    businessProfile.scrapedAt ? businessProfile : EMPTY_PROFILE,
  );
  const [greetingDraft, setGreetingDraft] = useState<GreetingSettings>(greeting ?? DEFAULT_GREETING);
  const [schedulingDraft, setSchedulingDraft] = useState<SchedulingSettings>(scheduling ?? DEFAULT_SCHEDULING);
  const [scraping, setScraping] = useState(false);
  const [scrapeSource, setScrapeSource] = useState<"azure" | "simulation" | null>(null);
  const [scrapeNote, setScrapeNote] = useState<string | null>(null);
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  useEffect(() => {
    getDemoStatus().then(setDemoStatus);
  }, []);

  const step = STEPS[stepIndex];

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

    // Fall back to the local deterministic simulation (no network, always works).
    setScrapeNote(apiResult.reason ?? null);
    window.setTimeout(() => {
      const { profile } = scrapeWebsite(nameInput, websiteInput);
      setProfileDraft(profile);
      setScrapeSource("simulation");
      setScraping(false);
    }, 450);
  };

  const toggleDay = (day: SchedulingSettings["bookableDays"][number]) => {
    setSchedulingDraft((prev) => ({
      ...prev,
      bookableDays: prev.bookableDays.includes(day)
        ? prev.bookableDays.filter((d) => d !== day)
        : [...prev.bookableDays, day],
    }));
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleActivate = () => {
    setBusinessProfile(profileDraft);
    setGreeting(greetingDraft);
    setScheduling(schedulingDraft);
    activate({ profile: profileDraft, greeting: greetingDraft, scheduling: schedulingDraft });
    navigate("/business-profile");
  };

  return (
    <div>
      <div className="page-title">Setup Wizard</div>
      <p className="page-subtitle">
        Set up SMB AI Receptionist for a business in four steps.{" "}
        {demoStatus?.mode === "connected"
          ? "Website scraping is Connected — a real site fetch is analyzed by Azure OpenAI."
          : "Website scraping runs in Simulation Mode — see Architecture for how to connect it to a real site."}
      </p>

      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`wizard-step ${i < stepIndex ? "done" : i === stepIndex ? "current" : ""}`} />
        ))}
      </div>
      <div className="call-meta" style={{ marginBottom: 14 }}>
        Step {stepIndex + 1} of {STEPS.length} — {STEP_LABEL[step]}
      </div>

      {step === "profile" && (
        <div className="card">
          <div className="form-grid cols-2">
            <div className="form-row">
              <label htmlFor="biz-name">Business name</label>
              <input
                id="biz-name"
                className="text-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Rivera Plumbing & Drain"
              />
            </div>
            <div className="form-row">
              <label htmlFor="biz-site">Website</label>
              <input
                id="biz-site"
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
                <span className="field-label">Phone (detected)</span>
                <span className="field-value">{profileDraft.phone}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Hours (detected)</span>
                <span className="field-value">{formatHoursSummary(profileDraft.hours)}</span>
              </div>
              <div className="form-row" style={{ marginTop: 10 }}>
                <label htmlFor="about">About (editable)</label>
                <textarea
                  id="about"
                  className="textarea-input"
                  value={profileDraft.about}
                  onChange={(e) => setProfileDraft({ ...profileDraft, about: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label htmlFor="services">Services (comma separated, editable)</label>
                <textarea
                  id="services"
                  className="textarea-input"
                  value={profileDraft.services.join(", ")}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, services: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                  }
                />
              </div>
              <div className="form-row">
                <label htmlFor="pricing">Pricing (one per line, "Service: Price", editable)</label>
                <textarea
                  id="pricing"
                  className="textarea-input"
                  value={profileDraft.pricing.map((p) => `${p.service}: ${p.price}`).join("\n")}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      pricing: e.target.value
                        .split("\n")
                        .map((line) => {
                          const [service, ...rest] = line.split(":");
                          return { service: (service ?? "").trim(), price: rest.join(":").trim() };
                        })
                        .filter((p) => p.service && p.price),
                    })
                  }
                  placeholder={"Oil change: $49.99\nConsultation: Free"}
                />
              </div>
              <div className="form-row">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  className="text-input"
                  value={profileDraft.address}
                  onChange={(e) => setProfileDraft({ ...profileDraft, address: e.target.value })}
                  placeholder="Street address, city"
                />
              </div>
            </div>
          )}
          <Disclaimer text="When Azure OpenAI is configured in the API, scraping really fetches the website and extracts info with AI. Otherwise it falls back to a deterministic keyword template — see the Architecture page for setup." />
        </div>
      )}

      {step === "greeting" && (
        <div className="card">
          <GreetingVoiceEditor profile={profileDraft} greeting={greetingDraft} onChange={setGreetingDraft} />
        </div>
      )}

      {step === "scheduling" && (
        <div className="card">
          <div className="form-grid cols-2">
            <div className="form-row">
              <label htmlFor="appt-length">Appointment length</label>
              <select
                id="appt-length"
                className="select-input"
                value={schedulingDraft.appointmentLengthMinutes}
                onChange={(e) => setSchedulingDraft({ ...schedulingDraft, appointmentLengthMinutes: Number(e.target.value) })}
              >
                {[15, 30, 45, 60, 90].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="buffer">Buffer between appointments</label>
              <select
                id="buffer"
                className="select-input"
                value={schedulingDraft.bufferMinutes}
                onChange={(e) => setSchedulingDraft({ ...schedulingDraft, bufferMinutes: Number(e.target.value) })}
              >
                {[0, 10, 15, 30].map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid cols-2">
            <div className="form-row">
              <label htmlFor="owner-name">Owner name</label>
              <input
                id="owner-name"
                className="text-input"
                value={schedulingDraft.ownerName}
                onChange={(e) => setSchedulingDraft({ ...schedulingDraft, ownerName: e.target.value })}
                placeholder="e.g. Marco Rivera"
              />
            </div>
            <div className="form-row">
              <label htmlFor="owner-mobile">Owner mobile (for SMS confirmations)</label>
              <input
                id="owner-mobile"
                className="text-input"
                value={schedulingDraft.ownerMobile}
                onChange={(e) => setSchedulingDraft({ ...schedulingDraft, ownerMobile: e.target.value })}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div className="pref-row">
            <span>Text owner before confirming any appointment</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={schedulingDraft.autoTextOwner}
                onChange={(e) => setSchedulingDraft({ ...schedulingDraft, autoTextOwner: e.target.checked })}
              />
              <span className="track" />
            </label>
          </div>

          <div className="section-title">Bookable days</div>
          <div className="pill-select">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                className={`pill ${schedulingDraft.bookableDays.includes(day) ? "active" : ""}`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="card">
          <div className="field-row">
            <span className="field-label">Business</span>
            <span className="field-value">{profileDraft.businessName || "—"}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Website</span>
            <span className="field-value">{profileDraft.website || "—"}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Greeting style</span>
            <span className="field-value">{GREETING_STYLE_LABEL[greetingDraft.style]}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Voice</span>
            <span className="field-value">{greetingDraft.voiceGender === "male" ? "Male" : "Female"}</span>
          </div>
          <div className="field-row">
            <span className="field-label">Appointment length</span>
            <span className="field-value">{schedulingDraft.appointmentLengthMinutes} min</span>
          </div>
          <div className="field-row">
            <span className="field-label">Owner mobile</span>
            <span className="field-value">{schedulingDraft.ownerMobile || "—"}</span>
          </div>

          <div className="section-title">Greeting preview</div>
          <div className="transcript-line ai">
            <div className="transcript-bubble">{buildGreetingPreview(profileDraft, greetingDraft)}</div>
          </div>

          <button className="btn btn-solid btn-block" style={{ marginTop: 16 }} onClick={handleActivate} disabled={!profileDraft.businessName}>
            ✅ Activate SMB AI Receptionist
          </button>
          {!profileDraft.businessName && (
            <div className="disclaimer">Go back to Step 1 and scrape a website before activating.</div>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
        <button className="btn btn-outline" onClick={goPrev} disabled={stepIndex === 0}>
          ← Back
        </button>
        {stepIndex < STEPS.length - 1 && (
          <button className="btn btn-solid" onClick={goNext} disabled={stepIndex === 0 && !profileDraft.businessName}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
