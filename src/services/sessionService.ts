import type { ThinkAloudResult } from "../lib/types";
import { formatEvaluationResult } from "../lib/formatEvaluation";
import { postThinkAloud, evaluateThinkAloud } from "./sessionApi";

/** Terms scanned for client-side so the acknowledgement highlights the
 *  relevant part of what the user typed — this is local text analysis on
 *  the user's own real input, not a fake API response. */
const CLINICAL_KEYWORDS = [
  "fever",
  "cough",
  "pain",
  "chest",
  "labs",
  "lab",
  "x-ray",
  "xray",
  "ct",
  "ecg",
  "troponin",
  "history",
  "differential",
  "infection",
];

function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return CLINICAL_KEYWORDS.filter((k) => lower.includes(k));
}

/**
 * Submits a Think Aloud entry for a real session:
 *  1. `POST /api/v1/sessions/:sessionId/think-aloud` persists the entry and
 *     advances the session state.
 *  2. `POST /api/v1/evaluate` returns the AI examiner's feedback text for
 *     that entry, used as the panel's "acknowledgement".
 *
 * `sessionId` must be a REAL session id from `POST /api/v1/sessions` —
 * never the case id.
 */
export async function submitThinkAloud(sessionId: string, text: string): Promise<ThinkAloudResult> {
  await postThinkAloud(sessionId, text);
  const rawEvaluation = await evaluateThinkAloud(text);
  const acknowledgement = formatEvaluationResult(rawEvaluation) || "Noted.";

  return {
    acknowledgement,
    detectedKeywords: detectKeywords(text),
  };
}
