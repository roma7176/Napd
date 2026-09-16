import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCases } from "../services/caseService";
import type { CaseSummary, Difficulty } from "../lib/types";

const difficultyStyle: Record<Difficulty, string> = {
  Beginner: "bg-good-tint text-good",
  Intermediate: "bg-amber-tint text-amber",
  Advanced: "bg-red-tint text-red-dark",
};

export function CaseSelection() {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setCases(null);

    getCases()
      .then((result) => {
        if (!cancelled) setCases(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink">Choose a Clinical Case</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Each case includes a virtual patient, history, and labs — some also include imaging.
        </p>
      </div>

      {error && (
        <div className="mt-8 rounded-card border border-red-tint-strong bg-red-tint/40 p-5 text-sm text-red-dark">
          Couldn't load cases right now. Please try again.
        </div>
      )}

      {!error && !cases && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading cases">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-card border border-line bg-surface" />
          ))}
        </div>
      )}

      {!error && cases && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.id}
              className="flex flex-col rounded-card border border-line bg-white p-5 transition-colors hover:border-red/40"
            >
              <div className="flex items-center gap-2">
                <span className="rounded border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
                  {c.specialty}
                </span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${difficultyStyle[c.difficulty]}`}>
                  {c.difficulty}
                </span>
              </div>

              <h2 className="mt-3 text-base font-semibold leading-snug text-ink">{c.title}</h2>
              <p className="mt-1 text-xs text-ink-faint">
                {c.patientGender}, {c.patientAge}
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{c.description}</p>

              <div className="mt-4 flex items-center gap-3 border-t border-line pt-3 font-mono text-[11px] text-ink-faint">
                <span>{c.estimatedMinutes} min</span>
                {c.hasImaging && <span>· Imaging</span>}
                {c.hasLabs && <span>· Labs</span>}
              </div>

              <Link
                to={`/session/${c.id}`}
                className="mt-4 rounded-md bg-red px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-red-dark"
              >
                Start Case
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
