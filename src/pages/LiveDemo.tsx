import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { buildGreetingPreview } from "../data/defaults";
import { GREETING_STYLE_LABEL } from "../types";
import type { GreetingStyle } from "../types";
import { DEMO_PHONE_NUMBER, DEMO_PHONE_NUMBER_TEL } from "../data/voice";
import { LiveCallSimulator } from "../components/LiveCallSimulator";
import { Disclaimer } from "../components/ui/Disclaimer";

/**
 * The dedicated page for testing the SMB AI Receptionist with a real phone
 * call (via Twilio) or the in-app text simulator, once a business has been
 * onboarded and activated (via the Executive Demo walkthrough or Setup
 * wizard). Lets the presenter tweak the live greeting/voice without
 * re-running the whole onboarding flow, and reset to onboard a new customer.
 */
export function LiveDemo() {
  const { businessProfile, greeting, scheduling, setGreeting, activate, activated, resetDemo } = useDemo();
  const navigate = useNavigate();

  const recommended = (style: GreetingStyle) => buildGreetingPreview(businessProfile, { ...greeting, style, customGreeting: "" });

  const [greetingDraft, setGreetingDraft] = useState(
    greeting.style === "custom" && greeting.customGreeting.trim() ? greeting.customGreeting : recommended(greeting.style === "custom" ? "friendly" : greeting.style),
  );
  const [savedNote, setSavedNote] = useState(false);

  // If the activated business/greeting changes out from under this page
  // (e.g. a reset elsewhere), keep the draft in sync.
  useEffect(() => {
    setGreetingDraft(
      greeting.style === "custom" && greeting.customGreeting.trim()
        ? greeting.customGreeting
        : recommended(greeting.style === "custom" ? "friendly" : greeting.style),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activated]);

  const applyStyle = (style: GreetingStyle) => {
    if (style === "custom") return; // keep current draft text, just let them edit it
    setGreetingDraft(recommended(style));
  };

  const saveGreeting = () => {
    const nextGreeting = { ...greeting, style: "custom" as const, customGreeting: greetingDraft.trim() };
    setGreeting(nextGreeting);
    activate({ profile: businessProfile, greeting: nextGreeting, scheduling });
    setSavedNote(true);
    window.setTimeout(() => setSavedNote(false), 2500);
  };

  const setVoiceGender = (voiceGender: "female" | "male") => {
    const nextGreeting = { ...greeting, voiceGender };
    setGreeting(nextGreeting);
    activate({ profile: businessProfile, greeting: nextGreeting, scheduling });
  };

  const handleReset = () => {
    resetDemo();
    navigate("/setup");
  };

  if (!activated) {
    return (
      <div>
        <div className="page-title">Live Demo</div>
        <div className="empty-state">
          No business is activated yet.
          <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "center" }}>
            <Link to="/executive-demo" className="btn btn-solid">
              Run the Executive Demo
            </Link>
            <Link to="/setup" className="btn btn-outline">
              Run Setup wizard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Live Demo — {businessProfile.businessName}</div>
      <p className="page-subtitle">
        Test the AI receptionist for real — by phone or right here in the browser — then reset to onboard the next
        customer.
      </p>

      <div className="card-soft" style={{ marginBottom: 16 }}>
        📞 Call the demo line:{" "}
        <a href={`tel:${DEMO_PHONE_NUMBER_TEL}`} style={{ fontWeight: 700, fontSize: 16 }}>
          {DEMO_PHONE_NUMBER}
        </a>
        <div className="call-meta" style={{ marginTop: 4 }}>
          {businessProfile.businessName} is live on that number right now, answered by SMB AI Receptionist. Any
          booking you make will show up in Appointments automatically within a few seconds.
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>Receptionist voice</div>
        <div className="pill-select" style={{ marginBottom: 6 }}>
          <button
            className={`pill ${greeting.voiceGender === "female" ? "active" : ""}`}
            onClick={() => setVoiceGender("female")}
          >
            ♀ Female voice
          </button>
          <button
            className={`pill ${greeting.voiceGender === "male" ? "active" : ""}`}
            onClick={() => setVoiceGender("male")}
          >
            ♂ Male voice
          </button>
        </div>
        <div className="call-meta">Applies to real phone calls (Azure Neural voice) — takes effect on the next call.</div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Caller greeting</div>
        <div className="pill-select" style={{ marginBottom: 10 }}>
          {(Object.keys(GREETING_STYLE_LABEL) as GreetingStyle[])
            .filter((style) => style !== "custom")
            .map((style) => (
              <button key={style} className="pill" onClick={() => applyStyle(style)}>
                {GREETING_STYLE_LABEL[style]}
              </button>
            ))}
        </div>
        <div className="form-row">
          <label htmlFor="live-greeting">Greeting script (recommended — edit as you like)</label>
          <textarea
            id="live-greeting"
            className="textarea-input"
            value={greetingDraft}
            onChange={(e) => setGreetingDraft(e.target.value)}
          />
        </div>
        <button className="btn btn-solid btn-block" onClick={saveGreeting} disabled={!greetingDraft.trim()}>
          💾 Save greeting
        </button>
        {savedNote && <div className="card-soft" style={{ marginTop: 10 }}>✓ Saved — the phone line now uses this greeting.</div>}
      </div>

      <div className="section-title">Try it in the browser</div>
      <LiveCallSimulator />

      <Disclaimer text="Scheduling is simulated — there's no real calendar, so the AI offers concrete-sounding time slots itself. Website scraping, the AI's replies, and (when Azure Speech is configured) the voice are all real." />

      <button className="btn btn-outline btn-block" style={{ marginTop: 16 }} onClick={handleReset}>
        ↺ Reset demo — onboard a new customer
      </button>
    </div>
  );
}
