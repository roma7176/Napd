/**
 * Thin fetch wrapper for the real Nabd FastAPI backend.
 *
 * Base URL comes from `VITE_API_BASE_URL` (see `.env`). All real backend
 * calls in this app should go through `apiRequest` so errors are handled
 * consistently (non-2xx responses, network failures, bad JSON).
 */

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  "https://napd-production.up.railway.app";

export type ApiErrorKind = "network" | "http" | "invalid-request" | "parse";

/** Error shape thrown by every function in `sessionApi.ts`. */
export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;

  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

/**
 * Issues a request against the real backend and returns the parsed JSON
 * body, typed as `T`. Throws `ApiError` for:
 * - non-2xx HTTP responses (`kind: "http"`, with `status` set)
 * - network failures / backend unreachable (`kind: "network"`)
 * - a response body that isn't valid JSON (`kind: "parse"`)
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Couldn't reach the backend. Check that the server is running and reachable.",
      "network",
    );
  }

  if (!response.ok) {
    // FastAPI validation/error bodies are usually JSON (`{"detail": ...}`),
    // but fall back gracefully if not.
    let detail: string | undefined;
    try {
      const errorBody = (await response.json()) as { detail?: unknown };
      detail =
        typeof errorBody?.detail === "string" ? errorBody.detail : JSON.stringify(errorBody?.detail);
    } catch {
      // ignore — no JSON body to parse
    }
    throw new ApiError(
      detail ? `Request failed (${response.status}): ${detail}` : `Request failed (${response.status})`,
      "http",
      response.status,
    );
  }

  // Some endpoints (e.g. POST /api/v1/evaluate) return a bare JSON string.
  const text = await response.text();
  if (text.length === 0) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Backend returned a response that wasn't valid JSON.", "parse");
  }
}

export function requireSessionId(sessionId: string | null | undefined): string {
  if (!sessionId || sessionId.trim().length === 0) {
    throw new ApiError("Missing or invalid session id.", "invalid-request");
  }
  return sessionId;
}

export { API_BASE_URL };
