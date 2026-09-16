import type { CaseAssets, CaseSummary, DefenseQuestion, ReasoningGraph, SessionResult } from "./types";

// Mock data only — replace with API calls once the FastAPI backend and the
// Adaptive Clinical Defense Engine are wired up. Every integration point is
// marked with a `// TODO(backend)` comment (see src/services/).

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

/** The 3 cases required for the MVP — these are the only ones shown in
 *  Case Selection. */
export const mockCases: CaseSummary[] = [
  {
    id: "pneumonia-01",
    title: "Community-Acquired Pneumonia",
    specialty: "Respiratory",
    patientAge: 34,
    patientGender: "Male",
    chiefComplaint: "Fever and productive cough with rust-colored sputum for 3 days",
    description:
      "A 34-year-old male presents with high-grade fever, pleuritic chest pain, and a productive cough. Review the vitals, labs, and chest X-ray to build your differential.",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    vitals: { temp: "38.9°C", hr: "110", bp: "110/70", rr: "24", spo2: "93%" },
    hasImaging: true,
    hasLabs: true,
  },
  {
    id: "appendicitis-01",
    title: "Acute Abdominal Pain",
    specialty: "Surgery",
    patientAge: 22,
    patientGender: "Female",
    chiefComplaint: "Periumbilical pain migrating to the right lower quadrant",
    description:
      "A 22-year-old female reports pain that started around the umbilicus and localized to the right iliac fossa over 12 hours, with nausea and low-grade fever.",
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    vitals: { temp: "37.8°C", hr: "98", bp: "118/76", rr: "18", spo2: "98%" },
    hasImaging: true,
    hasLabs: true,
  },
  {
    id: "mi-01",
    title: "Acute Chest Pain with Diaphoresis",
    specialty: "Cardiology",
    patientAge: 58,
    patientGender: "Male",
    chiefComplaint: "Crushing chest pain radiating to the left arm, onset 1 hour ago",
    description:
      "A 58-year-old male with a history of hypertension presents with sudden-onset substernal chest pressure, diaphoresis, and shortness of breath. Time-critical decision making.",
    difficulty: "Advanced",
    estimatedMinutes: 25,
    vitals: { temp: "36.9°C", hr: "102", bp: "150/95", rr: "20", spo2: "95%" },
    hasImaging: true,
    hasLabs: true,
  },
];

/** Kept for later (post-MVP) — intentionally NOT surfaced in Case Selection.
 *  Isolated here rather than deleted, per the MVP scope note. */
export const experimentalCases: CaseSummary[] = [
  {
    id: "diabetes-01",
    title: "Polyuria and Unintentional Weight Loss",
    specialty: "Endocrinology",
    patientAge: 45,
    patientGender: "Female",
    chiefComplaint: "Excessive thirst, frequent urination, and fatigue for 2 months",
    description:
      "A 45-year-old female presents with a two-month history of polydipsia, polyuria, and fatigue, with recent unintentional weight loss. No imaging required for this case.",
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    vitals: { temp: "36.7°C", hr: "88", bp: "130/85", rr: "16", spo2: "98%" },
    hasImaging: false,
    hasLabs: true,
  },
  {
    id: "hepc-01",
    title: "Chronic Fatigue with Mild Jaundice",
    specialty: "Hepatology",
    patientAge: 51,
    patientGender: "Male",
    chiefComplaint: "Persistent fatigue and mild scleral icterus for several weeks",
    description:
      "A 51-year-old male reports weeks of low energy and yellowing of the eyes, with no clear precipitant. Liver panel and viral serology point toward the diagnosis.",
    difficulty: "Advanced",
    estimatedMinutes: 22,
    vitals: { temp: "36.8°C", hr: "76", bp: "120/80", rr: "16", spo2: "98%" },
    hasImaging: false,
    hasLabs: true,
  },
];

/** All cases (MVP + experimental), keyed by id — used where a lookup by id
 *  shouldn't silently fail just because a case was hidden from selection. */
const allCasesById: Record<string, CaseSummary> = Object.fromEntries(
  [...mockCases, ...experimentalCases].map((c) => [c.id, c]),
);

export function findCaseById(caseId: string): CaseSummary | undefined {
  return allCasesById[caseId];
}

// ---------------------------------------------------------------------------
// Multimodal Case Deck — imaging + labs per case
// ---------------------------------------------------------------------------

export const mockCaseAssets: Record<string, CaseAssets> = {
  "pneumonia-01": {
    imaging: [{ id: "img-1", modality: "xray", label: "Chest X-ray (PA view)" }],
    labs: [
      { id: "l1", name: "WBC", value: "14.2", unit: "×10⁹/L", refRange: "4.0–11.0", flag: "high" },
      { id: "l2", name: "CRP", value: "86", unit: "mg/L", refRange: "< 5", flag: "high" },
      { id: "l3", name: "Hemoglobin", value: "13.5", unit: "g/dL", refRange: "13.0–17.0", flag: "normal" },
      { id: "l4", name: "Neutrophils", value: "82", unit: "%", refRange: "40–75", flag: "high" },
    ],
  },
  "appendicitis-01": {
    imaging: [{ id: "img-2", modality: "ct", label: "CT Abdomen (axial)" }],
    labs: [
      { id: "l5", name: "WBC", value: "15.8", unit: "×10⁹/L", refRange: "4.0–11.0", flag: "high" },
      { id: "l6", name: "CRP", value: "42", unit: "mg/L", refRange: "< 5", flag: "high" },
      { id: "l7", name: "Hemoglobin", value: "14.1", unit: "g/dL", refRange: "12.0–16.0", flag: "normal" },
      { id: "l8", name: "Neutrophils", value: "88", unit: "%", refRange: "40–75", flag: "high" },
    ],
  },
  "mi-01": {
    imaging: [{ id: "img-3", modality: "ecg", label: "ECG — Lead II" }],
    labs: [
      { id: "l9", name: "Troponin I", value: "2.4", unit: "ng/mL", refRange: "< 0.04", flag: "high" },
      { id: "l10", name: "CK-MB", value: "38", unit: "U/L", refRange: "< 25", flag: "high" },
      { id: "l11", name: "Total Cholesterol", value: "240", unit: "mg/dL", refRange: "< 200", flag: "high" },
      { id: "l12", name: "Potassium", value: "4.2", unit: "mmol/L", refRange: "3.5–5.1", flag: "normal" },
    ],
  },
  "diabetes-01": {
    imaging: [],
    labs: [
      { id: "l13", name: "Fasting Glucose", value: "210", unit: "mg/dL", refRange: "70–100", flag: "high" },
      { id: "l14", name: "HbA1c", value: "9.2", unit: "%", refRange: "< 5.7", flag: "high" },
      { id: "l15", name: "Creatinine", value: "0.9", unit: "mg/dL", refRange: "0.6–1.3", flag: "normal" },
      { id: "l16", name: "Urine Ketones", value: "Negative", unit: "", refRange: "Negative", flag: "normal" },
    ],
  },
  "hepc-01": {
    imaging: [],
    labs: [
      { id: "l17", name: "ALT", value: "145", unit: "U/L", refRange: "7–56", flag: "high" },
      { id: "l18", name: "AST", value: "132", unit: "U/L", refRange: "10–40", flag: "high" },
      { id: "l19", name: "Total Bilirubin", value: "2.1", unit: "mg/dL", refRange: "0.1–1.2", flag: "high" },
      { id: "l20", name: "Albumin", value: "3.6", unit: "g/dL", refRange: "3.4–5.4", flag: "normal" },
      { id: "l21", name: "HCV RNA", value: "Positive", unit: "", refRange: "Negative", flag: "high" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Defense question pools — one small pool per case, rotated through the
// Why / What if / Evidence styles so the mock doesn't feel fully static.
// See src/services/aiService.ts for the (mock) selection logic.
// ---------------------------------------------------------------------------

export const mockDefenseQuestionPools: Record<string, DefenseQuestion[]> = {
  "pneumonia-01": [
    { id: "pn-why-1", style: "why", prompt: "Why did you rank bacterial pneumonia above tuberculosis given this history?" },
    { id: "pn-whatif-1", style: "whatIf", prompt: "What if the CRP came back normal — would that change your working diagnosis?" },
    { id: "pn-evidence-1", style: "evidence", prompt: "What specific finding on the chest X-ray would you point to as evidence for your diagnosis?" },
    { id: "pn-why-2", style: "why", prompt: "Why is the elevated neutrophil percentage relevant to your reasoning?" },
  ],
  "appendicitis-01": [
    { id: "ap-why-1", style: "why", prompt: "Why does pain migrating from periumbilical to the right iliac fossa point toward appendicitis?" },
    { id: "ap-whatif-1", style: "whatIf", prompt: "What if the patient were pregnant — how would that change your imaging choice?" },
    { id: "ap-evidence-1", style: "evidence", prompt: "What lab evidence supports an acute inflammatory process here?" },
    { id: "ap-why-2", style: "why", prompt: "Why would you still consider ovarian pathology as a differential in this patient?" },
  ],
  "mi-01": [
    { id: "mi-why-1", style: "why", prompt: "Why is time-to-treatment especially critical in this presentation?" },
    { id: "mi-whatif-1", style: "whatIf", prompt: "What if the troponin were still within normal range at this timepoint — would you rule out MI?" },
    { id: "mi-evidence-1", style: "evidence", prompt: "What evidence from the ECG would you cite to support acute ischemia?" },
    { id: "mi-why-2", style: "why", prompt: "Why does the patient's history of hypertension matter to your risk assessment?" },
  ],
};

// ---------------------------------------------------------------------------
// Results — one mock SessionResult per MVP case, following the fixed rubric:
// Data Gathering 30% / Hypothesis 25% / Differential Diagnosis 25% / Clinical Defense 20%
// ---------------------------------------------------------------------------

const pneumoniaGraph: ReasoningGraph = {
  nodes: [
    { id: "n1", stage: "data", label: "Symptoms / Data", detail: "Fever, productive cough, pleuritic chest pain (3 days)" },
    { id: "n2", stage: "evidence", label: "Evidence", detail: "WBC 14.2, CRP 86, chest X-ray reviewed" },
    { id: "n3", stage: "interpretation", label: "Interpretation", detail: "Elevated inflammatory markers with consolidation pattern" },
    { id: "n4", stage: "hypothesis", label: "Hypothesis", detail: "Bacterial community-acquired pneumonia favored" },
    { id: "n5", stage: "decision", label: "Decision", detail: "Empiric antibiotics proposed, TB considered and deprioritized" },
  ],
};

const appendicitisGraph: ReasoningGraph = {
  nodes: [
    { id: "n1", stage: "data", label: "Symptoms / Data", detail: "Periumbilical pain migrating to RLQ over 12 hours, nausea" },
    { id: "n2", stage: "evidence", label: "Evidence", detail: "WBC 15.8, CRP 42, CT abdomen reviewed" },
    { id: "n3", stage: "interpretation", label: "Interpretation", detail: "Localized peritoneal signs with raised inflammatory markers" },
    { id: "n4", stage: "hypothesis", label: "Hypothesis", detail: "Acute appendicitis favored over gynecological causes" },
    { id: "n5", stage: "decision", label: "Decision", detail: "Surgical consult recommended" },
  ],
};

const miGraph: ReasoningGraph = {
  nodes: [
    { id: "n1", stage: "data", label: "Symptoms / Data", detail: "Crushing substernal chest pain radiating to left arm, 1 hour onset" },
    { id: "n2", stage: "evidence", label: "Evidence", detail: "Troponin I 2.4, CK-MB 38, ECG Lead II reviewed" },
    { id: "n3", stage: "interpretation", label: "Interpretation", detail: "Elevated cardiac markers consistent with myocardial injury" },
    { id: "n4", stage: "hypothesis", label: "Hypothesis", detail: "Acute myocardial infarction favored" },
    { id: "n5", stage: "decision", label: "Decision", detail: "Urgent cardiology referral, time-critical management pathway" },
  ],
};

export const mockResults: Record<string, SessionResult> = {
  "pneumonia-01": {
    sessionId: "pneumonia-01",
    caseTitle: "Community-Acquired Pneumonia",
    overallScore: 7.4,
    categories: [
      { key: "dataGathering", label: "Data Gathering", weight: 30, score: 8, note: "Took a structured history and reviewed vitals, labs, and imaging in a logical order." },
      { key: "hypothesis", label: "Hypothesis", weight: 25, score: 7, note: "Reached a reasonable working diagnosis but was slow to state it explicitly." },
      { key: "differentialDiagnosis", label: "Differential Diagnosis", weight: 25, score: 7, note: "Listed relevant differentials but under-explained why TB was deprioritized." },
      { key: "clinicalDefense", label: "Clinical Defense", weight: 20, score: 7, note: "Defended most answers with evidence, though some responses lacked detail." },
    ],
    strengths: [
      "Logical sequencing when taking the patient's history",
      "Clear link between symptoms and examination findings",
    ],
    growthAreas: [
      "Rule out alternative diagnoses earlier in the reasoning process",
      "Explain abnormal lab values explicitly and connect them to the diagnosis",
    ],
    reasoningGraph: pneumoniaGraph,
  },
  "appendicitis-01": {
    sessionId: "appendicitis-01",
    caseTitle: "Acute Abdominal Pain",
    overallScore: 7.0,
    categories: [
      { key: "dataGathering", label: "Data Gathering", weight: 30, score: 7, note: "Covered the pain migration pattern but didn't fully explore associated symptoms." },
      { key: "hypothesis", label: "Hypothesis", weight: 25, score: 7, note: "Correctly favored appendicitis based on the classic migration pattern." },
      { key: "differentialDiagnosis", label: "Differential Diagnosis", weight: 25, score: 6, note: "Gynecological differentials were mentioned late in the session." },
      { key: "clinicalDefense", label: "Clinical Defense", weight: 20, score: 8, note: "Answered defense questions with specific, evidence-based reasoning." },
    ],
    strengths: [
      "Correctly prioritized appendicitis given the classic pain migration",
      "Confident, evidence-based answers under questioning",
    ],
    growthAreas: [
      "Broaden the differential earlier, particularly for female patients",
      "Ask about associated GI and urinary symptoms during history-taking",
    ],
    reasoningGraph: appendicitisGraph,
  },
  "mi-01": {
    sessionId: "mi-01",
    caseTitle: "Acute Chest Pain with Diaphoresis",
    overallScore: 8.1,
    categories: [
      { key: "dataGathering", label: "Data Gathering", weight: 30, score: 9, note: "Recognized time-critical presentation immediately and gathered focused data." },
      { key: "hypothesis", label: "Hypothesis", weight: 25, score: 8, note: "Correctly identified MI as the leading hypothesis early in the session." },
      { key: "differentialDiagnosis", label: "Differential Diagnosis", weight: 25, score: 7, note: "Considered aortic dissection but didn't fully justify ruling it out." },
      { key: "clinicalDefense", label: "Clinical Defense", weight: 20, score: 8, note: "Clearly explained the significance of troponin and ECG findings." },
    ],
    strengths: [
      "Fast recognition of the time-critical nature of the presentation",
      "Strong grasp of cardiac biomarker significance",
    ],
    growthAreas: [
      "Justify ruling out other high-risk causes of chest pain more explicitly",
      "State the working diagnosis earlier in the session",
    ],
    reasoningGraph: miGraph,
  },
};
