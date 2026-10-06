import type { CallOutcome } from "../../types";
import { CALL_OUTCOME_LABEL } from "../../types";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "good" | "warn" | "bad";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const OUTCOME_TONE: Record<CallOutcome, "good" | "warn" | "bad" | "neutral"> = {
  "booked-appointment": "good",
  "answered-question": "neutral",
  "took-message": "neutral",
  "declined-spam": "bad",
  "info-only": "neutral",
};

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  return <span className={`badge badge-${OUTCOME_TONE[outcome]}`}>{CALL_OUTCOME_LABEL[outcome]}</span>;
}
