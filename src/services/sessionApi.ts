/**
 * Real backend calls for the 5 confirmed endpoints:
 *
 *  - POST /api/v1/sessions
 *  - POST /api/v1/sessions/{session_id}/think-aloud
 *  - POST /api/v1/sessions/{session_id}/defense
 *  - GET  /api/v1/sessions/{session_id}
 *  - POST /api/v1/evaluate
 *
 * These are the ONLY backend endpoints this app talks to. Do not add
 * case/results endpoints here — they don't exist in the provided Swagger.
 */
import { apiRequest, requireSessionId } from "./apiClient";

export type BackendSessionState = "START" | "THINK_ALOUD" | "DEFENSE" | "RESULT";

/**
 * Mirrors the backend's `SessionResponse`. `evaluation_result`'s exact shape
 * isn't pinned down in the provided spec (the standalone `/evaluate`
 * endpoint returns a plain string, so this likely does too) — treated as
 * `unknown` and handled defensively wherever it's consumed.
 */
export interface SessionResponse {
  session_id: string;
  user_id: number;
  case_id: string;
  state: BackendSessionState;
  think_aloud_text: string | null;
  defense_question: string | null;
  defense_answer: string | null;
  evaluation_result: unknown;
}

export async function createSession(userId: number, caseId: string): Promise<SessionResponse> {
  return apiRequest<SessionResponse>("/api/v1/sessions", {
    method: "POST",
    body: { user_id: userId, case_id: caseId },
  });
}

export async function getSession(sessionId: string): Promise<SessionResponse> {
  const id = requireSessionId(sessionId);
  return apiRequest<SessionResponse>(`/api/v1/sessions/${encodeURIComponent(id)}`);
}

export async function postThinkAloud(sessionId: string, thinkAloudText: string): Promise<SessionResponse> {
  const id = requireSessionId(sessionId);
  return apiRequest<SessionResponse>(`/api/v1/sessions/${encodeURIComponent(id)}/think-aloud`, {
    method: "POST",
    body: { think_aloud_text: thinkAloudText },
  });
}

export async function postDefenseAnswer(sessionId: string, answerText: string): Promise<SessionResponse> {
  const id = requireSessionId(sessionId);
  return apiRequest<SessionResponse>(`/api/v1/sessions/${encodeURIComponent(id)}/defense`, {
    method: "POST",
    body: { session_id: id, answer_text: answerText },
  });
}

/**
 * Standalone free-text evaluation. The spec says this returns a plain
 * string, but in practice the backend returns a structured object (see
 * `formatEvaluationResult`) — typed as `unknown` here and formatted safely
 * by the caller instead of assuming either shape.
 */
export async function evaluateThinkAloud(thinkAloudText: string): Promise<unknown> {
  return apiRequest<unknown>("/api/v1/evaluate", {
    method: "POST",
    body: { think_aloud_text: thinkAloudText },
  });
}
