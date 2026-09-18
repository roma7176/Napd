import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCaseAssets, getCaseById } from "../services/caseService";
import { createSession, getSession } from "../services/sessionApi";
import { ApiError } from "../services/apiClient";
import { DEFAULT_USER_ID, getActiveSessionIdForCase, setActiveSessionForCase } from "../services/sessionStore";
import type { CaseAssets, CaseSummary } from "../lib/types";
import { CaseDeck } from "../components/CaseDeck";
import { ThinkAloudPanel } from "../components/ThinkAloudPanel";
import { DefenseExaminer } from "../components/DefenseExaminer";

type Tab = "thinkAloud" | "examiner";

/**
 * Creates a real backend session for this case (`POST /api/v1/sessions`),
 * reusing a previously-created one for the same case/tab if it still
 * exists on the backend. Never treats `caseId` as a session id.
 */
async function ensureSession(caseId: string): Promise<string> {
  const existing = getActiveSessionIdForCase(caseId);
  if (existing) {
    try {
      await getSession(existing);
      return existing;
    } catch {
      // Stale/unknown session id (e.g. backend restarted) — fall through
      // and create a fresh one.
    }
  }

  const created = await createSession(DEFAULT_USER_ID, caseId);
  setActiveSessionForCase(caseId, created.session_id);
  return created.session_id;
}

export function ActiveDefense() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [activeCase, setActiveCase] = useState<CaseSummary | null>(null);
  const [assets, setAssets] = useState<CaseAssets | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionRetryToken, setSessionRetryToken] = useState(0);
  const [tab, setTab] = useState<Tab>("thinkAloud");
  const [progress, setProgress] = useState({ answered: 0, total: 3 });

  useEffect(() => {
    if (!caseId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setSessionError(null);
    setSessionId(null);

    Promise.all([getCaseById(caseId), getCaseAssets(caseId)])
      .then(async ([caseResult, assetsResult]) => {
        if (cancelled) return;
        if (!caseResult) {
          setNotFound(true);
          return;
        }
        setActiveCase(caseResult);
        setAssets(assetsResult);
        // Reset workspace state in case this effect re-runs on an existing
        // instance (e.g. the caseId param changes without a full unmount).
        setTab("thinkAloud");
        setProgress({ answered: 0, total: 3 });

        try {
          const realSessionId = await ensureSession(caseId);
          if (!cancelled) setSessionId(realSessionId);
        } catch (err) {
          if (cancelled) return;
          const message =
            err instanceof ApiError
              ? err.message
              : "Couldn't start a session with the backend. Please try again.";
          setSessionError(message);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [caseId, sessionRetryToken]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-sm text-ink-faint" aria-busy="true">
        Loading case…
      </div>
    );
  }

  if (notFound || !activeCase) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-ink">Case not found</h1>
        <p className="mt-2 text-sm text-ink-soft">This case doesn't exist or isn't part of the current MVP.</p>
        <Link
          to="/cases"
          className="mt-5 inline-block rounded-md bg-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-dark"
        >
          Back to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-4 px-4 py-5 lg:grid-cols-[240px_1fr_380px] lg:px-6">
      {/* LEFT — patient / case info */}
      <aside className="space-y-4 lg:sticky lg:top-16 lg:h-fit">
        <div className="rounded-card border border-line bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
              {activeCase.specialty}
            </span>
          </div>
          <h1 className="mt-2 text-base font-semibold leading-snug text-ink">{activeCase.title}</h1>
          <p className="mt-1 text-xs text-ink-faint">
            {activeCase.patientGender}, {activeCase.patientAge}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{activeCase.chiefComplaint}</p>
        </div>

        <Link to="/cases" className="block text-center text-xs font-medium text-ink-soft hover:text-red">
          ← Back
        </Link>

        <button
          onClick={() => sessionId && navigate(`/results/${sessionId}`)}
          disabled={progress.answered < progress.total || !sessionId}
          className="w-full rounded-md bg-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          See Results
        </button>
        {progress.answered < progress.total && (
          <p className="text-center text-[11px] leading-snug text-ink-faint">
            Answer all {progress.total} Defense Questions to unlock Results
            {progress.answered > 0 && ` (${progress.answered}/${progress.total} so far)`}.
          </p>
        )}
      </aside>

      {/* CENTER — Patient Information: vitals, labs, imaging */}
      <section className="space-y-4">
        <div className="rounded-card border border-line bg-white p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Patient Information</p>
          <dl className="mt-2 grid grid-cols-5 gap-2 text-center font-mono text-sm">
            <div>
              <dt className="text-[10px] text-ink-faint">Temp</dt>
              <dd className="mt-0.5 font-semibold text-ink">{activeCase.vitals.temp}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-ink-faint">HR</dt>
              <dd className="mt-0.5 font-semibold text-ink">{activeCase.vitals.hr}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-ink-faint">BP</dt>
              <dd className="mt-0.5 font-semibold text-ink">{activeCase.vitals.bp}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-ink-faint">RR</dt>
              <dd className="mt-0.5 font-semibold text-ink">{activeCase.vitals.rr}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-ink-faint">SpO₂</dt>
              <dd className="mt-0.5 font-semibold text-ink">{activeCase.vitals.spo2}</dd>
            </div>
          </dl>
        </div>

        {assets && <CaseDeck assets={assets} />}
      </section>

      {/* RIGHT — Think Aloud / AI Examiner */}
      <section className="flex min-h-[70vh] flex-col rounded-card border border-line bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-5rem)]">
        <div className="border-b border-line p-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => setTab("thinkAloud")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "thinkAloud" ? "bg-ink text-white" : "border border-line text-ink-soft hover:border-ink/30"
              }`}
            >
              Think Aloud
            </button>
            <button
              onClick={() => setTab("examiner")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "examiner" ? "bg-red text-white" : "border border-line text-ink-soft hover:border-red/40"
              }`}
            >
              AI Examiner {progress.answered > 0 && `(${progress.answered}/${progress.total})`}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {sessionError && (
            <div className="p-4">
              <p className="rounded-md border border-red-tint-strong bg-red-tint/40 px-3 py-2.5 text-sm text-red-dark">
                {sessionError}
              </p>
              <button
                onClick={() => setSessionRetryToken((t) => t + 1)}
                className="mt-2 w-full rounded-md border border-line px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-red hover:text-red"
              >
                Retry
              </button>
            </div>
          )}

          {!sessionError && !sessionId && (
            <div className="p-4 text-sm text-ink-faint" aria-busy="true">
              Starting session…
            </div>
          )}

          {!sessionError &&
            sessionId &&
            (tab === "thinkAloud" ? (
              <ThinkAloudPanel key={`ta-${activeCase.id}-${sessionId}`} sessionId={sessionId} />
            ) : (
              <DefenseExaminer
                key={`ex-${activeCase.id}-${sessionId}`}
                caseId={activeCase.id}
                sessionId={sessionId}
                onProgress={(answered, total) => setProgress({ answered, total })}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
