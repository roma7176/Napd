/**
 * Local (browser sessionStorage) bookkeeping around the real backend
 * session id.
 *
 * Two things live here:
 *  1. `caseId -> session_id` — so reloading /session/:caseId reuses the
 *     same real session instead of creating a new one every time.
 *  2. `session_id -> caseId` — because there's no real results endpoint
 *     yet, the Results page still reads from mock data keyed by case id.
 *     This mapping lets `/results/:sessionId` (a REAL session id) resolve
 *     back to the right mock result.
 *
 * TODO(backend): once `GET /api/sessions/:sessionId/results` exists, drop
 * the reverse mapping and fetch results by session id directly.
 */

const ACTIVE_SESSION_PREFIX = "nabd:activeSessionByCase:";
const CASE_FOR_SESSION_PREFIX = "nabd:caseForSession:";

/** No real auth in this MVP — every session is created for a single
 *  anonymous placeholder user. Replace once auth exists. */
export const DEFAULT_USER_ID = 1;

export function getActiveSessionIdForCase(caseId: string): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_SESSION_PREFIX + caseId);
  } catch {
    return null;
  }
}

export function setActiveSessionForCase(caseId: string, sessionId: string): void {
  try {
    sessionStorage.setItem(ACTIVE_SESSION_PREFIX + caseId, sessionId);
    sessionStorage.setItem(CASE_FOR_SESSION_PREFIX + sessionId, caseId);
  } catch {
    // sessionStorage unavailable (e.g. privacy mode) — the app still works,
    // it just creates a fresh session per page load.
  }
}

export function getCaseIdForSession(sessionId: string): string | null {
  try {
    return sessionStorage.getItem(CASE_FOR_SESSION_PREFIX + sessionId);
  } catch {
    return null;
  }
}
