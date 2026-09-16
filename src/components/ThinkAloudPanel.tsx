import { useState } from "react";
import { submitThinkAloud } from "../services/sessionService";

interface ThinkAloudEntry {
  id: string;
  text: string;
  acknowledgement: string;
}

export function ThinkAloudPanel({ sessionId }: { sessionId: string }) {
  const [draft, setDraft] = useState("");
  const [entries, setEntries] = useState<ThinkAloudEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit() {
    const text = draft.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    setError(false);
    try {
      const result = await submitThinkAloud(sessionId, text);
      setEntries((prev) => [...prev, { id: `ta-${Date.now()}`, text, acknowledgement: result.acknowledgement }]);
      setDraft("");
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {entries.length === 0 && (
          <p className="text-sm leading-relaxed text-ink-faint">
            Narrate your clinical reasoning as you review the patient's data — what you notice, what it suggests, and what you want to check next.
          </p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="space-y-1.5">
            <div className="rounded-md border border-red-tint-strong bg-red-tint/40 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-dark">Think Aloud</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{entry.text}</p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">AI Examiner</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{entry.acknowledgement}</p>
            </div>
          </div>
        ))}
        {error && (
          <p className="rounded-md border border-red-tint-strong bg-red-tint/40 px-3 py-2 text-xs text-red-dark">
            Couldn't submit that entry — please try again.
          </p>
        )}
      </div>

      <div className="border-t border-line p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What's your reasoning so far?"
          rows={3}
          disabled={submitting}
          className="w-full min-w-0 resize-none rounded-md border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red disabled:opacity-60"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !draft.trim()}
          className="mt-2 w-full rounded-md bg-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
