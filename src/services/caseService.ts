import { findCaseById, mockCaseAssets, mockCases } from "../lib/mockData";
import type { CaseAssets, CaseSummary } from "../lib/types";
import { mockDelay } from "./mockNetwork";

/**
 * Returns the cases available for selection in the MVP (exactly 3:
 * Pneumonia, Appendicitis, MI).
 *
 * TODO(backend): replace with `GET /api/cases`.
 */
export async function getCases(): Promise<CaseSummary[]> {
  await mockDelay(300);
  return mockCases;
}

/**
 * Returns a single case by id, including cases outside the MVP set
 * (`findCaseById` looks across both MVP and experimental cases so a direct
 * link doesn't dead-end). Returns `null` if no such case exists.
 *
 * TODO(backend): replace with `GET /api/cases/:caseId`.
 */
export async function getCaseById(caseId: string): Promise<CaseSummary | null> {
  await mockDelay(250);
  return findCaseById(caseId) ?? null;
}

/**
 * Returns the imaging + labs deck for a case. Returns `null` if the case
 * has no deck (or doesn't exist).
 *
 * TODO(backend): replace with `GET /api/cases/:caseId/assets`.
 */
export async function getCaseAssets(caseId: string): Promise<CaseAssets | null> {
  await mockDelay(250);
  return mockCaseAssets[caseId] ?? null;
}
