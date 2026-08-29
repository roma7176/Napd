import { mockResults } from "../lib/mockData";
import type { SessionResult } from "../lib/types";
import { mockDelay } from "./mockNetwork";

/**
 * Returns the score, rubric breakdown, feedback, and reasoning graph for a
 * finished session. Returns `null` if the session/case is unknown.
 *
 * TODO(backend): replace with `GET /api/sessions/:sessionId/results`.
 */
export async function getSessionResult(sessionId: string): Promise<SessionResult | null> {
  await mockDelay(500);
  return mockResults[sessionId] ?? null;
}
