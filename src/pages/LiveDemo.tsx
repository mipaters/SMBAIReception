import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import type { GreetingSettings } from "../types";
import { DEMO_PHONE_NUMBER, DEMO_PHONE_NUMBER_TEL } from "../data/voice";
import { LiveCallSimulator } from "../components/LiveCallSimulator";
import { GreetingVoiceEditor } from "../components/GreetingVoiceEditor";
import { Disclaimer } from "../components/ui/Disclaimer";

/**
 * The dedicated page for testing the SMB AI Receptionist with a real phone
 * call (via Twilio) or the in-app text simulator, once a business has been
 * onboarded and activated (via the Executive Walkthrough or Setup
 * wizard). Lets the presenter tweak the live greeting/voice without
 * re-running the whole onboarding flow, and reset to onboard a new customer.
 */
export function LiveDemo() {
  const { businessProfile, greeting, scheduling, setGreeting, activate, activated, resetDemo } = useDemo();
  const navigate = useNavigate();

  // Voice and greeting changes apply immediately to the live phone line —
  // no separate "save" step to remember.
  const handleGreetingChange = (next: GreetingSettings) => {
    setGreeting(next);
    activate({ profile: businessProfile, greeting: next, scheduling });
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
              Run the Executive Walkthrough
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
        <GreetingVoiceEditor profile={businessProfile} greeting={greeting} onChange={handleGreetingChange} hidePreferences />
        <div className="call-meta" style={{ marginTop: 6 }}>
          Changes apply immediately to the live phone line (and take effect on the next call).
        </div>
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
