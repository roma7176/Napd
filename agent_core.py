import asyncio
from typing import List, Dict, Any
from pydantic import BaseModel, Field

class AgentInsight(BaseModel):
    agent_name: str
    risk_score: float = Field(..., ge=0.0, le=100.0)
    findings: List[str]
    recommendations: List[str]

class MultiAgentEvaluationResult(BaseModel):
    case_id: str
    overall_safety_rating: str
    composite_cognitive_score: float
    agent_insights: List[AgentInsight]
    next_best_action: str

class ClinicalReasoningAgent:
    """Agent 1: Evaluates diagnostic hypotheses and cognitive flow."""
    async def analyze(self, reasoning_text: str) -> AgentInsight:
        await asyncio.sleep(0.1)  # Async non-blocking execution simulation
        has_differential = "differential" in reasoning_text.lower() or "diagnosis" in reasoning_text.lower()
        risk = 15.0 if has_differential else 65.0
        return AgentInsight(
            agent_name="Clinical Reasoning Agent",
            risk_score=risk,
            findings=["Structured differential diagnosis detected." if has_differential else "Lack of explicit differential diagnosis."],
            recommendations=["Maintain broad differentials before narrowing down."]
        )

class PatientSafetyAgent:
    """Agent 2: Scans for missed critical labs and emergency risks."""
    async def analyze(self, student_input: str, mandatory_labs: List[str]) -> AgentInsight:
        await asyncio.sleep(0.1)
        missed = [lab for lab in mandatory_labs if lab.lower() not in student_input.lower()]
        risk = len(missed) * 35.0
        risk = min(risk, 100.0)
        return AgentInsight(
            agent_name="Patient Safety Agent",
            risk_score=risk,
            findings=[f"Missed mandatory lab: {lab}" for lab in missed] if missed else ["All critical labs addressed."],
            recommendations=["Prioritize rule-out of life-threatening conditions immediately."]
        )

class NabdMultiAgentOrchestrator:
    """Orchestrates async evaluation across specialized AI agents."""
    def __init__(self):
        self.reasoning_agent = ClinicalReasoningAgent()
        self.safety_agent = PatientSafetyAgent()

    async def evaluate_case_async(self, case_id: str, student_input: str, mandatory_labs: List[str]) -> MultiAgentEvaluationResult:
        # Run agents concurrently using asyncio.gather
        reasoning_task = self.reasoning_agent.analyze(student_input)
        safety_task = self.safety_agent.analyze(student_input, mandatory_labs)
        
        reasoning_insight, safety_insight = await asyncio.gather(reasoning_task, safety_task)
        
        avg_risk = (reasoning_insight.risk_score + safety_insight.risk_score) / 2
        cognitive_score = max(0.0, 100.0 - avg_risk)
        
        safety_rating = "OPTIMAL" if avg_risk < 25 else "CRITICAL RISK" if avg_risk > 60 else "NEEDS REVIEW"
        
        return MultiAgentEvaluationResult(
            case_id=case_id,
            overall_safety_rating=safety_rating,
            composite_cognitive_score=round(cognitive_score, 2),
            agent_insights=[reasoning_insight, safety_insight],
            next_best_action="Proceed to confirmation testing" if safety_rating == "OPTIMAL" else "Re-evaluate baseline vitals and emergency labs"
        )
