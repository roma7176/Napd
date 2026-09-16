/**
 * Safely turns a backend "evaluation result" value into plain text that's
 * always safe to render as a React child.
 *
 * The spec for `POST /api/v1/evaluate` says it returns a plain string, and
 * `SessionResponse.evaluation_result` is untyped in the spec — but in
 * practice the backend has been observed returning a structured object
 * instead, shaped roughly like:
 *
 *   { summary, key_observations, working_diagnoses, supporting_evidence, uncertainties }
 *
 * Rather than assuming either shape, this defensively handles: a plain
 * string/number/boolean, that structured object (rendered as labeled
 * sections), any other object (rendered as JSON), and null/undefined.
 * Nothing here invents content — every line comes from a field the
 * backend actually returned.
 */

interface KnownStructuredEvaluation {
  summary?: unknown;
  key_observations?: unknown;
  working_diagnoses?: unknown;
  supporting_evidence?: unknown;
  uncertainties?: unknown;
}

const KNOWN_LIST_FIELDS: { key: keyof KnownStructuredEvaluation; label: string }[] = [
  { key: "key_observations", label: "Key observations" },
  { key: "working_diagnoses", label: "Working diagnoses" },
  { key: "supporting_evidence", label: "Supporting evidence" },
  { key: "uncertainties", label: "Uncertainties" },
];

function formatListField(items: unknown, label: string): string | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const lines = items.map((item) => `  • ${typeof item === "string" ? item : JSON.stringify(item)}`);
  return `${label}:\n${lines.join("\n")}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatEvaluationResult(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);

  if (isPlainObject(raw)) {
    const sections: string[] = [];

    if (typeof raw.summary === "string" && raw.summary.trim().length > 0) {
      sections.push(raw.summary.trim());
    }

    for (const { key, label } of KNOWN_LIST_FIELDS) {
      const formatted = formatListField(raw[key], label);
      if (formatted) sections.push(formatted);
    }

    if (sections.length > 0) {
      return sections.join("\n\n");
    }

    // Unrecognized object shape — fall back to readable JSON rather than
    // crashing or showing "[object Object]".
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }

  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}
