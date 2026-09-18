import { mockDefenseQuestionPools } from "../lib/mockData";
import type { AnswerEvaluation, DefenseQuestion } from "../lib/types";
import { mockDelay } from "./mockNetwork";

/**
 * Returns the next defense question for a case, cycling through that
 * case's mock question pool (Why / What if / Evidence styles) so a session
 * doesn't repeat the same question twice in a row where avoidable.
 *
 * TODO(backend): replace with `POST /api/sessions/:sessionId/defense-question`,
 * which will eventually call the real Adaptive Clinical Defense Engine
 * (`generate_defense()` on the AI Engine side).
 */
export async function generateDefenseQuestion(
  caseId: string,
  askedQuestionIds: string[],
): Promise<DefenseQuestion | null> {
  await mockDelay(500);

  const pool = mockDefenseQuestionPools[caseId];
  if (!pool || pool.length === 0) return null;

  const unused = pool.filter((q) => !askedQuestionIds.includes(q.id));
  const candidates = unused.length > 0 ? unused : pool;
  return candidates[0];
}

/**
 * Mock-evaluates a free-text answer to a defense question. The verdict is
 * a simple heuristic (answer length + a couple of clinical-reasoning
 * signal words) — intentionally simple, not a simulated AI model.
 *
 * TODO(backend): replace with `POST /api/sessions/:sessionId/evaluate-answer`,
 * which will eventually call the real `evaluate_answer()` on the AI Engine.
 */
export async function evaluateDefenseAnswer(
  question: DefenseQuestion,
  answer: string,
): Promise<AnswerEvaluation> {
  await mockDelay(700);

  const trimmed = answer.trim();
  const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const hasReasoningSignal = /\b(because|since|given|due to|as)\b/i.test(trimmed);

  if (wordCount === 0) {
    return {
      verdict: "incorrect",
      score: 0,
      feedback: "No answer was submitted for this question.",
    };
  }

  if (wordCount >= 12 && hasReasoningSignal) {
    return {
      verdict: "correct",
      score: 9,
      feedback: `Well defended — you clearly justified your reasoning for "${question.prompt.slice(0, 40)}…".`,
    };
  }

  if (wordCount >= 5) {
    return {
      verdict: "partial",
      score: 6,
      feedback: "Reasonable answer, but try explicitly stating the evidence or logic behind it.",
    };
  }

  return {
    verdict: "incorrect",
    score: 3,
    feedback: "Too brief to defend your reasoning — try explaining the 'why' behind your answer.",
  };
}
