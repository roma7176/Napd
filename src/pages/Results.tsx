import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSessionResult } from "../services/resultsService";
import type { SessionResult } from "../lib/types";

const circumference = 2 * Math.PI * 52;

const stageLabel: Record<string, string> = {
  data: "Data",
  evidence: "Evidence",
  interpretation: "Interpretation",
  hypothesis: "Hypothesis",
  decision: "Decision",
};

export function Results() {
  const { sessionId } = useParams();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getSessionResult(sessionId)
      .then((r) => {
        if (cancelled) return;
        if (!r) setNotFound(true);
        else setResult(r);
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
  }, [sessionId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center text-sm text-ink-faint" aria-busy="true">
        Loading results…
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-ink">Results not found</h1>
        <p className="mt-2 text-sm text-ink-soft">
          This session doesn't have results yet — finish a Defense Question first.
        </p>
        <Link
          to="/cases"
          className="mt-5 inline-block rounded-md bg-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-dark"
        >
          Back to Cases
        </Link>
      </div>
    );
  }

  const r = result;
  const pct = r.overallScore / 10;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-xs text-ink-faint">{r.caseTitle}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Results</h1>

      <div className="mt-7 grid gap-4 md:grid-cols-[200px_1fr]">
        {/* Score dial */}
        <div className="flex flex-col items-center justify-center rounded-card border border-line bg-white p-6">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-line)" strokeWidth="9" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--color-red)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct)}
              />
            </svg>
            <p className="font-mono text-2xl font-bold text-ink">{r.overallScore}</p>
          </div>
          <p className="mt-3 text-xs font-medium text-ink-faint">Overall score / 10</p>
        </div>

        {/* Category breakdown — fixed rubric: 30 / 25 / 25 / 20 */}
        <div className="rounded-card border border-line bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Score Breakdown</h2>
          <div className="mt-4 space-y-3.5">
            {r.categories.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-ink">
                    {c.label} <span className="font-mono text-[11px] text-ink-faint">({c.weight}%)</span>
                  </span>
                  <span className="font-mono text-ink-soft">{c.score}/10</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-red" style={{ width: `${(c.score / 10) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reasoning Graph */}
      <div className="mt-4 rounded-card border border-line bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Reasoning Graph</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {r.reasoningGraph.nodes.map((n, i) => (
            <div key={n.id} className="relative">
              <div className="rounded-md border border-line bg-surface p-3 text-center">
                <p className="font-mono text-[10px] text-red-dark">{stageLabel[n.stage] ?? String(i + 1)}</p>
                <p className="mt-1 text-xs font-semibold text-ink">{n.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-ink-faint">{n.detail}</p>
              </div>
              {i < r.reasoningGraph.nodes.length - 1 && (
                <span className="pointer-events-none absolute right-[-10px] top-1/2 hidden -translate-y-1/2 text-ink-faint sm:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-card border border-line bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-good">Strengths</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
            {r.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-good">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-line bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-red-dark">Areas for Improvement</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
            {r.growthAreas.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-red-dark">↗</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-7 flex gap-3">
        <Link to="/cases" className="rounded-md bg-red px-6 py-3 text-sm font-semibold text-white hover:bg-red-dark">
          Try Another Case
        </Link>
        <Link
          to="/"
          className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-ink hover:border-red hover:text-red"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
