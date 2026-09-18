import { mockResults } from "../lib/mockData";
import type { SessionResult } from "../lib/types";
import { mockDelay } from "./mockNetwork";
import { getCaseIdForSession } from "./sessionStore";

/**
 * Returns the score, rubric breakdown, feedback, and reasoning graph for a
 * finished session. Returns `null` if the session/case is unknown.
 *
 * There is no real `GET /api/sessions/:sessionId/results` endpoint in the
 * current backend, so this stays mock-backed. `sessionId` here is now a
 * REAL backend session id, not a case id — it's resolved back to its case
 * id (recorded when the session was created, see `sessionStore.ts`) so the
 * lookup into the mock, case-keyed results table still works.
 *
 * TODO(backend): replace with `GET /api/sessions/:sessionId/results` once
 * it exists, and drop the case-id resolution step.
 */
export async function getSessionResult(sessionId: string): Promise<SessionResult | null> {
  await mockDelay(500);
  const caseId = getCaseIdForSession(sessionId);
  // Falls back to treating the param as a case id directly, so old links
  // (or a page opened with mock data only) still resolve.
  return mockResults[caseId ?? sessionId] ?? null;
}
