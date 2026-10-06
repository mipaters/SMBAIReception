import type { BusinessProfile, GreetingSettings, GreetingStyle } from "../types";
import { GREETING_STYLE_LABEL } from "../types";
import { buildGreetingPreview } from "../data/defaults";

// Only the real quick-pick templates are shown as pills — "custom" isn't a
// choice you pick, it's what the greeting becomes automatically once you
// edit the text below.
const TEMPLATE_STYLES: GreetingStyle[] = ["friendly", "professional", "concise"];

interface Props {
  profile: BusinessProfile;
  greeting: GreetingSettings;
  onChange: (next: GreetingSettings) => void;
  /** Hide the "mention hours" / "offer appointments" switches (e.g. on the Live Demo page). */
  hidePreferences?: boolean;
}

/**
 * The single, consistent place the app lets you set the receptionist's
 * voice (male/female) and greeting script. Always shows an editable
 * textarea pre-populated with the recommended wording for whichever
 * template pill is active — no need to pick "Custom" first to type.
 */
export function GreetingVoiceEditor({ profile, greeting, onChange, hidePreferences }: Props) {
  const displayText =
    greeting.style === "custom" && greeting.customGreeting.trim()
      ? greeting.customGreeting
      : buildGreetingPreview(profile, {
          ...greeting,
          style: greeting.style === "custom" ? "friendly" : greeting.style,
          customGreeting: "",
        });

  const applyTemplate = (style: GreetingStyle) => {
    onChange({ ...greeting, style, customGreeting: "" });
  };

  const editText = (text: string) => {
    onChange({ ...greeting, style: "custom", customGreeting: text });
  };

  return (
    <div>
      <div className="section-title" style={{ marginTop: 0 }}>Receptionist voice</div>
      <div className="pill-select" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={`pill ${greeting.voiceGender === "female" ? "active" : ""}`}
          onClick={() => onChange({ ...greeting, voiceGender: "female" })}
        >
          ♀ Female voice
        </button>
        <button
          type="button"
          className={`pill ${greeting.voiceGender === "male" ? "active" : ""}`}
          onClick={() => onChange({ ...greeting, voiceGender: "male" })}
        >
          ♂ Male voice
        </button>
      </div>

      <div className="section-title">Caller greeting</div>
      <div className="pill-select" style={{ marginBottom: 10 }}>
        {TEMPLATE_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            className={`pill ${greeting.style === style ? "active" : ""}`}
            onClick={() => applyTemplate(style)}
          >
            {GREETING_STYLE_LABEL[style]}
          </button>
        ))}
      </div>
      <div className="form-row">
        <label htmlFor="greeting-script">What the AI says when it answers (recommended — edit as you like)</label>
        <textarea
          id="greeting-script"
          className="textarea-input"
          value={displayText}
          onChange={(e) => editText(e.target.value)}
        />
      </div>

      {!hidePreferences && (
        <>
          <div className="pref-row">
            <span>Mention that we're closed, if applicable</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={greeting.mentionHours}
                onChange={(e) => onChange({ ...greeting, mentionHours: e.target.checked })}
              />
              <span className="track" />
            </label>
          </div>
          <div className="pref-row">
            <span>Proactively offer to book an appointment</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={greeting.offerAppointments}
                onChange={(e) => onChange({ ...greeting, offerAppointments: e.target.checked })}
              />
              <span className="track" />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
