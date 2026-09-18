import { useEffect, useRef, useState } from "react";
import { generateDefenseQuestion, evaluateDefenseAnswer } from "../services/aiService";
import { getSession, postDefenseAnswer } from "../services/sessionApi";
import { formatEvaluationResult } from "../lib/formatEvaluation";
import type { AnswerEvaluation, DefenseQuestion } from "../lib/types";

const styleLabel: Record<DefenseQuestion["style"], string> = {
  why: "Why?",
  whatIf: "What if?",
  evidence: "Evidence?",
};

const verdictMeta: Record<AnswerEvaluation["verdict"], { label: string; className: string; icon: string }> = {
  correct: { label: "Well defended", className: "bg-good-tint text-good", icon: "✓" },
  partial: { label: "Partially defended", className: "bg-amber-tint text-amber", icon: "~" },
  incorrect: { label: "Needs more evidence", className: "bg-red-tint text-red-dark", icon: "✕" },
  // Used for a live backend evaluation whose scoring shape the API doesn't
  // expose — shows the AI Examiner's real feedback without inventing a
  // correct/partial/incorrect verdict or a numeric score it didn't give us.
  reviewed: { label: "Reviewed by AI Examiner", className: "bg-surface text-ink-soft", icon: "•" },
};

const TOTAL_QUESTIONS = 3;

/** A defense round backed by the real backend (question text + answer
 *  submission both come from `POST /api/v1/sessions/:id/*`). */
const REAL_QUESTION_ID = "__live_session_question__";

export function DefenseExaminer({
  caseId,
  sessionId,
  onProgress,
}: {
  caseId: string;
  sessionId: string;
  onProgress: (answered: number, total: number) => void;
}) {
  const [question, setQuestion] = useState<DefenseQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [error, setError] = useState(false);
  const askedIds = useRef<string[]>([]);
  const submittingRef = useRef(false);
  // Whether this session still has an unused real `defense_question` from
  // the backend available for the CURRENT question slot.
  const liveQuestionAvailable = useRef(true);

  async function loadNextQuestion() {
    setLoadingQuestion(true);
    setError(false);
    setEvaluation(null);
    setAnswer("");
    try {
      // Only the first round of this examiner session tries the real
      // backend — there's no endpoint for the backend to hand back a
      // *second* defense question, so later rounds use the existing mock
      // question bank (same as before this integration).
      if (liveQuestionAvailable.current) {
        liveQuestionAvailable.current = false;
        const session = await getSession(sessionId);
        if (session.defense_question) {
          askedIds.current = [...askedIds.current, REAL_QUESTION_ID];
          setQuestion({ id: REAL_QUESTION_ID, style: "why", prompt: session.defense_question });
          return;
        }
      }

      const next = await generateDefenseQuestion(caseId, askedIds.current);
      if (next) askedIds.current = [...askedIds.current, next.id];
      setQuestion(next);
    } catch {
      setError(true);
    } finally {
      setLoadingQuestion(false);
    }
  }

  useEffect(() => {
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, sessionId]);

  async function handleSubmitAnswer() {
    // Guard against: no question loaded, empty answer, an evaluation already
    // in flight, this question already evaluated (must click "Next Question"
    // first), or a double-invocation race before `evaluating` state re-renders.
    if (!question || !answer.trim() || evaluating || evaluation || submittingRef.current) return;
    submittingRef.current = true;
    setEvaluating(true);
    setError(false);
    try {
      const result =
        question.id === REAL_QUESTION_ID
          ? await submitRealDefenseAnswer(sessionId, answer)
          : await evaluateDefenseAnswer(question, answer);
      setEvaluation(result);
      const next = answeredCount + 1;
      setAnsweredCount(next);
      onProgress(next, TOTAL_QUESTIONS);
    } catch {
      setError(true);
    } finally {
      setEvaluating(false);
      submittingRef.current = false;
    }
  }

  const reachedTarget = answeredCount >= TOTAL_QUESTIONS;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          Question {Math.min(answeredCount + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
        </p>

        {loadingQuestion && (
          <div className="h-20 animate-pulse rounded-md border border-line bg-surface" aria-busy="true" />
        )}

        {!loadingQuestion && error && (
          <p className="rounded-md border border-red-tint-strong bg-red-tint/40 px-3 py-2 text-xs text-red-dark">
            Couldn't load the next question — please try again.
          </p>
        )}

        {!loadingQuestion && !error && question && !reachedTarget && (
          <div className="rounded-md border border-line bg-surface px-3 py-2.5">
            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-red-dark">
              {question.id === REAL_QUESTION_ID ? "Live" : styleLabel[question.style]}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-ink">{question.prompt}</p>
          </div>
        )}

        {!loadingQuestion && !question && !error && (
          <p className="text-sm text-ink-faint">No defense questions are available for this case yet.</p>
        )}

        {evaluation && (
          <div className={`rounded-md px-3 py-2.5 ${verdictMeta[evaluation.verdict].className}`}>
            <p className="text-xs font-semibold">
              {verdictMeta[evaluation.verdict].icon} {verdictMeta[evaluation.verdict].label}
              {evaluation.score !== null && ` — ${evaluation.score}/10`}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{evaluation.feedback}</p>
          </div>
        )}

        {reachedTarget && (
          <div className="rounded-md border border-good/30 bg-good-tint px-3 py-2.5 text-sm text-good">
            You've answered all {TOTAL_QUESTIONS} defense questions for this case. Continue to Results.
          </div>
        )}
      </div>

      {!reachedTarget && (
        <div className="border-t border-line p-3">
          <div className="flex gap-2">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
              placeholder="Defend your reasoning…"
              disabled={loadingQuestion || evaluating || !!evaluation || !question}
              className="min-w-0 flex-1 rounded-md border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red disabled:opacity-60"
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={loadingQuestion || evaluating || !!evaluation || !answer.trim() || !question}
              className="shrink-0 rounded-md bg-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {evaluating ? "Evaluating…" : "Submit"}
            </button>
          </div>
          {evaluation && (
            <button
              onClick={loadNextQuestion}
              className="mt-2 w-full rounded-md border border-line px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-red hover:text-red"
            >
              Next Question
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Submits an answer to the ONE real defense question for this session via
 * `POST /api/v1/sessions/:id/defense`. The backend's `evaluation_result`
 * shape isn't pinned down by the provided spec, so this renders whatever
 * text it gets back under a neutral "reviewed" verdict rather than
 * inventing a score. If the backend hasn't attached a result yet, one
 * follow-up `GET` is tried before falling back to a plain confirmation.
 */
async function submitRealDefenseAnswer(sessionId: string, answerText: string): Promise<AnswerEvaluation> {
  let session = await postDefenseAnswer(sessionId, answerText);

  if (session.evaluation_result === null || session.evaluation_result === undefined) {
    try {
      session = await getSession(sessionId);
    } catch {
      // ignore — fall through to the no-result message below
    }
  }

  const raw = session.evaluation_result;
  if (raw === null || raw === undefined) {
    return {
      verdict: "reviewed",
      score: null,
      feedback: "Your answer was submitted to the AI Examiner.",
    };
  }

  return {
    verdict: "reviewed",
    score: null,
    feedback: formatEvaluationResult(raw),
  };
}
