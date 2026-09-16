export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Specialty =
  | "Respiratory"
  | "Surgery"
  | "Cardiology"
  | "Endocrinology"
  | "Hepatology";

export interface VitalSigns {
  temp: string;
  hr: string;
  bp: string;
  rr: string;
  spo2: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  specialty: Specialty;
  patientAge: number;
  patientGender: "Male" | "Female";
  chiefComplaint: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  vitals: VitalSigns;
  hasImaging: boolean;
  hasLabs: boolean;
}

export type ImagingModality = "xray" | "ct" | "ecg";

export interface ImagingStudy {
  id: string;
  modality: ImagingModality;
  label: string;
}

export type LabFlag = "low" | "high" | "normal";

export interface LabResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  refRange: string;
  flag: LabFlag;
}

export interface CaseAssets {
  imaging: ImagingStudy[];
  labs: LabResult[];
}

export interface ScoreCategory {
  label: string;
  weight: number;
  score: number; // 0-10
  note: string;
}

/** The four fixed rubric categories, per the Nabd scoring rubric. */
export type RubricCategoryKey =
  | "dataGathering"
  | "hypothesis"
  | "differentialDiagnosis"
  | "clinicalDefense";

/** weight is a fixed percentage (30 / 25 / 25 / 20) — always sums to 100. */
export interface RubricCategoryScore {
  key: RubricCategoryKey;
  label: string;
  weight: number;
  score: number; // 0-10
  note: string;
}

export interface SessionResult {
  sessionId: string;
  caseTitle: string;
  overallScore: number; // 0-10
  categories: RubricCategoryScore[];
  strengths: string[];
  growthAreas: string[];
  reasoningGraph: ReasoningGraph;
}

// ---------------------------------------------------------------------------
// Think Aloud
// ---------------------------------------------------------------------------

export interface ThinkAloudResult {
  /** Short mock acknowledgement from the AI examiner. */
  acknowledgement: string;
  /** Clinically relevant terms detected in the free-text reasoning. */
  detectedKeywords: string[];
}

// ---------------------------------------------------------------------------
// Defense questions
// ---------------------------------------------------------------------------

export type DefenseQuestionStyle = "why" | "whatIf" | "evidence";

export interface DefenseQuestion {
  id: string;
  style: DefenseQuestionStyle;
  prompt: string;
}

/**
 * "reviewed" is used for a live backend evaluation whose exact scoring
 * shape isn't exposed by the API — it signals "the AI Examiner responded"
 * without fabricating a correct/partial/incorrect verdict that the
 * backend didn't actually provide.
 */
export type EvaluationVerdict = "correct" | "partial" | "incorrect" | "reviewed";

export interface AnswerEvaluation {
  verdict: EvaluationVerdict;
  /** 0-10, or `null` when the backend didn't return a numeric score. */
  score: number | null;
  feedback: string;
}

// ---------------------------------------------------------------------------
// Reasoning graph
// ---------------------------------------------------------------------------

export type ReasoningStage = "data" | "evidence" | "interpretation" | "hypothesis" | "decision";

export interface ReasoningGraphNode {
  id: string;
  stage: ReasoningStage;
  label: string;
  detail: string;
}

export interface ReasoningGraph {
  nodes: ReasoningGraphNode[];
}
