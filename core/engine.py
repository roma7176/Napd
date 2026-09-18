import re
from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class BiasSeverity(Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class CognitiveBiasAlert(BaseModel):
    bias_type: str
    detected: bool
    severity: BiasSeverity
    evidence_found: str
    clinical_risk: str
    remediation_advice: str

class ClinicalAssessmentReport(BaseModel):
    case_id: str
    overall_cognitive_score: float
    clinical_safety_level: str
    covered_symptoms: List[str]
    missed_critical_investigations: List[str]
    detected_biases: List[CognitiveBiasAlert]
    retrieved_guidelines: List[str]
    actionable_feedback: str

class AdvancedVectorStore:
    """Enhanced Vector Knowledge Base supporting Clinical Guidelines Retrieval."""
    def __init__(self):
        self.knowledge_base = [
            {
                "topic": "acute coronary syndrome",
                "keywords": ["chest pain", "angina", "stemi", "nstemi", "troponin", "ecg"],
                "guideline": "ESC ACS Guidelines: Perform immediate 12-lead ECG within 10 mins and serial Troponin assays."
            },
            {
                "topic": "pulmonary embolism",
                "keywords": ["shortness of breath", "dyspnea", "d-dimer", "ctpa", "pleuritic pain"],
                "guideline": "PERC / ESC PE Guidelines: Evaluate Well's Score, assess D-Dimer, and request CT Pulmonary Angiogram if high probability."
            },
            {
                "topic": "aortic dissection",
                "keywords": ["tearing pain", "back pain", "pulse deficit", "ct angiogram"],
                "guideline": "Aortic Dissection Protocol: Order urgent CT Angiogram and maintain strict blood pressure control."
            }
        ]

    def search(self, query: str, top_k: int = 2) -> List[str]:
        query_lower = query.lower()
        matched_results = []
        
        for entry in self.knowledge_base:
            score = sum(1 for kw in entry["keywords"] if kw in query_lower)
            if score > 0:
                matched_results.append((score, entry["guideline"]))
        
        matched_results.sort(key=lambda x: x[0], reverse=True)
        return [res[1] for res in matched_results[:top_k]]

class NabdCognitiveEngine:
    def __init__(self, vector_store: Optional[AdvancedVectorStore] = None):
        self.vector_store = vector_store or AdvancedVectorStore()

    def _clean_text(self, text: str) -> str:
        return text.lower().strip()

    def analyze_reasoning(
        self,
        case_id: str,
        student_input: str,
        required_labs: List[str],
        required_findings: List[str],
        differential_diagnoses: List[str]
    ) -> ClinicalAssessmentReport:
        if not case_id or not student_input:
            raise ValueError("case_id and student_input must not be empty.")

        cleaned_input = self._clean_text(student_input)

        covered_symptoms = [f for f in required_findings if f.lower() in cleaned_input]
        missed_labs = [lab for lab in required_labs if lab.lower() not in cleaned_input]

        total_items = len(required_labs) + len(required_findings)
        found_items = (len(required_labs) - len(missed_labs)) + len(covered_symptoms)
        score = round((found_items / total_items) * 100, 2) if total_items > 0 else 100.0

        safety_level = "Safe" if len(missed_labs) == 0 else "Critical Missing Labs"

        has_diagnosis = any(d.lower() in cleaned_input for d in differential_diagnoses) or "diagnosis" in cleaned_input
        premature_closure = len(missed_labs) > 0 and has_diagnosis

        biases = [
            CognitiveBiasAlert(
                bias_type="Premature Closure",
                detected=premature_closure,
                severity=BiasSeverity.HIGH if premature_closure else BiasSeverity.LOW,
                evidence_found="Diagnosis reached prior to ordering required investigations." if premature_closure else "None",
                clinical_risk="High risk of misdiagnosis due to incomplete patient evaluation." if premature_closure else "None",
                remediation_advice="Ensure all baseline laboratory investigations are reviewed before finalizing a diagnosis." if premature_closure else "Good clinical practice."
            )
        ]

        guidelines = self.vector_store.search(cleaned_input)

        return ClinicalAssessmentReport(
            case_id=case_id,
            overall_cognitive_score=score,
            clinical_safety_level=safety_level,
            covered_symptoms=covered_symptoms,
            missed_critical_investigations=missed_labs,
            detected_biases=biases,
            retrieved_guidelines=guidelines,
            actionable_feedback="Review missing laboratory investigations before finalizing diagnosis." if missed_labs else "Comprehensive clinical assessment."
        )
