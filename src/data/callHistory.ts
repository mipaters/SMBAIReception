import type { CallHistoryEntry, TranscriptLine } from "../types";
import { SCENARIOS } from "./scenarios";

function stepsToTranscript(steps: { callerLine?: string; aiLine?: string; systemNote?: string }[]): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  for (const step of steps) {
    if (step.systemNote) lines.push({ speaker: "system", text: step.systemNote });
    if (step.aiLine) lines.push({ speaker: "ai", text: step.aiLine });
    if (step.callerLine) lines.push({ speaker: "caller", text: step.callerLine });
  }
  return lines;
}

const SUMMARY_BY_SCENARIO: Record<string, string> = {
  "rivera-emergency": "Emergency flooding call — on-call tech texted, backup slot held.",
  "brightsmiles-pricing": "Answered whitening pricing question, booked a consultation.",
  "luxecuts-reschedule": "Rescheduled a color appointment to Thursday 5 PM.",
  "spam-warranty": "Robocall declined in 9 seconds — owner not interrupted.",
  "golden-dragon-hours": "Confirmed delivery area, texted ordering link to caller.",
};

const DURATION_BY_SCENARIO: Record<string, number> = {
  "rivera-emergency": 138,
  "brightsmiles-pricing": 96,
  "luxecuts-reschedule": 74,
  "spam-warranty": 9,
  "golden-dragon-hours": 52,
};

export const SEED_CALL_HISTORY: CallHistoryEntry[] = SCENARIOS.map((s) => ({
  id: `seed-${s.id}`,
  businessId: s.businessId,
  callerName: s.callerName,
  callerNumber: s.callerNumber,
  when: s.whenDescription,
  durationSeconds: DURATION_BY_SCENARIO[s.id] ?? 60,
  outcome: s.outcome,
  summary: SUMMARY_BY_SCENARIO[s.id] ?? "Call handled by SMB AI Receptionist.",
  transcript: stepsToTranscript(s.steps),
}));
