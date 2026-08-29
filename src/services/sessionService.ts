import type { ThinkAloudResult } from "../lib/types";
import { mockDelay } from "./mockNetwork";

/** Terms the mock scans for so the acknowledgement isn't fully static. */
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

/**
 * Submits a Think Aloud entry for the given case and returns a mock
 * examiner acknowledgement. The acknowledgement varies with the detected
 * keywords so the flow doesn't feel fully static, without simulating an
 * actual AI model.
 *
 * TODO(backend): replace with `POST /api/sessions/:sessionId/think-aloud`,
 * which will eventually route through the Adaptive Clinical Defense Engine.
 */
export async function submitThinkAloud(_caseId: string, text: string): Promise<ThinkAloudResult> {
  await mockDelay(600);

  const lower = text.toLowerCase();
  const detectedKeywords = CLINICAL_KEYWORDS.filter((k) => lower.includes(k));

  const acknowledgement = detectedKeywords.length
    ? `Noted — you're focusing on ${detectedKeywords.slice(0, 3).join(", ")}. Keep building your reasoning from here.`
    : "Noted. Try connecting this observation to a specific finding, lab value, or vital sign.";

  return { acknowledgement, detectedKeywords };
}
