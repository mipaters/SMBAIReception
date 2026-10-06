import { useEffect, useRef, useState } from "react";
import { useDemo } from "../context/DemoContext";
import { buildGreetingPreview } from "../data/defaults";
import { sendLiveCallTurn, type LiveCallTurnMessage } from "../lib/api";
import type { CallHistoryEntry, TranscriptLine } from "../types";

interface DisplayLine extends TranscriptLine {
  key: string;
}

/**
 * A genuinely interactive AI phone call: the user types as the caller, and a
 * real Azure OpenAI call generates each receptionist reply, grounded only in
 * the business profile/greeting/scheduling the user just set up. Scheduling
 * is the one part that's simulated — there's no real calendar, so the model
 * is instructed to offer a couple of concrete time slots itself.
 */
export function LiveCallSimulator() {
  const { businessProfile, greeting, scheduling, addAppointment, addCallHistoryEntry } = useDemo();
  const [lines, setLines] = useState<DisplayLine[]>(() => [
    { key: "open-0", speaker: "system", text: `☎️ Incoming call to ${businessProfile.businessName || "the business"} — unanswered, forwarded to SMB AI Receptionist.` },
    { key: "open-1", speaker: "ai", text: buildGreetingPreview(businessProfile, greeting) },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState(false);
  const [ended, setEnded] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const history: LiveCallTurnMessage[] = lines
    .filter((l) => l.speaker === "ai" || l.speaker === "caller")
    .map((l) => ({ role: l.speaker as "ai" | "caller", content: l.text }));

  const handleSend = async () => {
    const callerMessage = input.trim();
    if (!callerMessage || sending || ended) return;
    setInput("");
    setSending(true);
    setLines((prev) => [...prev, { key: `caller-${Date.now()}`, speaker: "caller", text: callerMessage }]);

    const result = await sendLiveCallTurn(businessProfile, greeting, scheduling, history, callerMessage);
    setSending(false);

    if (!result.available || !result.reply) {
      setUnavailable(result.reason ?? "Live AI call generation is unavailable right now.");
      return;
    }

    setLines((prev) => [...prev, { key: `ai-${Date.now()}`, speaker: "ai", text: result.reply! }]);

    if (result.booking && !booked) {
      const { callerName, callerPhone, service, proposedWhen } = result.booking;
      const ownerSms = `SMB AI Receptionist: I've updated your schedule — new appointment for ${callerName} (${callerPhone}), ${service}, ${proposedWhen}.`;
      const callerSms = `${businessProfile.businessName}: you're confirmed for ${service} on ${proposedWhen}. See you then!`;
      setLines((prev) => [
        ...prev,
        {
          key: `system-${Date.now()}`,
          speaker: "system",
          text: `📩 Texted ${scheduling.ownerName || "the owner"}: "${ownerSms}"`,
        },
      ]);
      setBooked(true);

      const callId = `live-${Date.now()}`;
      addAppointment({
        id: `appt-${callId}`,
        businessId: businessProfile.businessName || "live-demo",
        callerName,
        callerPhone,
        service,
        proposedWhen,
        status: "confirmed",
        createdFromCallId: callId,
        ownerSmsPreview: ownerSms,
        callerSmsPreview: callerSms,
        createdAt: "Just now",
      });
    }
  };

  const handleEndCall = () => {
    if (ended) return;
    const transcript: TranscriptLine[] = lines.map(({ speaker, text }) => ({ speaker, text }));
    const callId = `live-${Date.now()}`;
    const entry: CallHistoryEntry = {
      id: callId,
      businessId: businessProfile.businessName || "live-demo",
      callerName: lines.some((l) => l.speaker === "caller") ? "Live demo caller" : "Unknown caller",
      callerNumber: "555-010-0100",
      when: "Just now",
      durationSeconds: Math.max(20, lines.length * 12),
      outcome: booked ? "booked-appointment" : "answered-question",
      summary: booked ? "Booked an appointment during the live demo call." : "Live demo call handled by SMB AI Receptionist.",
      transcript,
    };
    addCallHistoryEntry(entry);
    setEnded(true);
  };

  return (
    <div>
      <div className="card" style={{ maxHeight: 420, overflowY: "auto" }}>
        {lines.map((l) => (
          <div key={l.key} className={`transcript-line ${l.speaker}`}>
            <div className="transcript-bubble">{l.text}</div>
          </div>
        ))}
        {sending && (
          <div className="transcript-line ai">
            <div className="transcript-bubble">…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {unavailable && <div className="disclaimer">⚠️ {unavailable}</div>}

      {!ended ? (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              className="text-input"
              style={{ flex: 1 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type what the caller says…"
              disabled={sending}
            />
            <button className="btn btn-solid" onClick={handleSend} disabled={sending || !input.trim()}>
              Send
            </button>
          </div>
          <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={handleEndCall}>
            End call & log to history
          </button>
        </>
      ) : (
        <div className="card-soft" style={{ marginTop: 10 }}>
          ✓ Call logged to history{booked ? " and appointment booked." : "."}
        </div>
      )}
    </div>
  );
}
